import { streamText } from "ai";
import { NextResponse } from "next/server";
import { getChatModel, getProviderSummary } from "@/lib/providers";
import { retrieve } from "@/lib/rag";
import { db } from "@/lib/db";
import { randomUUID } from "node:crypto";
import {
  USAGE_MARKER,
  estimateTokens,
  sanitizeRequestOptions,
  type ChatUsage,
} from "@/lib/chat-options";

export const runtime = "nodejs";

function describeError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(raw);
    const message = parsed?.error?.message ?? parsed?.message;
    if (typeof message === "string") return message;
  } catch {}
  return raw || "Chat failed";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (
    typeof body?.question !== "string" ||
    typeof body?.collectionId !== "string" ||
    !body.question.trim()
  ) {
    return NextResponse.json(
      { error: "Question and collection are required" },
      { status: 400 },
    );
  }
  try {
    if (
      !db
        .prepare("SELECT id FROM collections WHERE id=?")
        .get(body.collectionId)
    ) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }
    const requestOptions = sanitizeRequestOptions(body.options);
    const sources = await retrieve(
      body.collectionId,
      body.question,
      requestOptions.topK,
    );
    if (!sources.length)
      return NextResponse.json(
        { error: "No indexed context found. Add a document first." },
        { status: 400 },
      );

    let sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    if (sessionId) {
      const session = db
        .prepare("SELECT id,collection_id,title FROM chat_sessions WHERE id=?")
        .get(sessionId) as
        { id: string; collection_id: string; title: string } | undefined;
      if (!session || session.collection_id !== body.collectionId)
        return NextResponse.json(
          { error: "Chat not found for this collection" },
          { status: 404 },
        );
      if (session.title === "New chat")
        db.prepare(
          "UPDATE chat_sessions SET title=?,updated_at=? WHERE id=?",
        ).run(
          body.question.trim().slice(0, 120),
          new Date().toISOString(),
          sessionId,
        );
    } else {
      sessionId = randomUUID();
      const now = new Date().toISOString();
      db.prepare(
        "INSERT INTO chat_sessions (id,collection_id,title,created_at,updated_at) VALUES (?,?,?,?,?)",
      ).run(
        sessionId,
        body.collectionId,
        body.question.trim().slice(0, 120),
        now,
        now,
      );
    }
    const history = db
      .prepare(
        "SELECT question,answer FROM chat_messages WHERE session_id=? AND answer<>'' ORDER BY created_at DESC LIMIT 6",
      )
      .all(sessionId) as { question: string; answer: string }[];
    const historyMessages = history.reverse().flatMap((item) => [
      { role: "user" as const, content: item.question },
      { role: "assistant" as const, content: item.answer },
    ]);
    const messageId = randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO chat_messages (id,session_id,question,answer,sources,created_at) VALUES (?,?,?,'',?,?)",
    ).run(
      messageId,
      sessionId,
      body.question.trim(),
      JSON.stringify(sources.map(({ title, score }) => ({ title, score }))),
      now,
    );

    const contextText = sources
      .map(
        (source, index) => `[${index + 1}] ${source.title}: ${source.content}`,
      )
      .join("\n\n");
    const instructionText =
      "Answer using only the supplied retrieved sources. If they do not contain the answer, say so. Cite source titles in your answer. Do not invent facts." +
      (requestOptions.instructions
        ? `\n\nReply instructions from the user (follow them without breaking the rules above):\n${requestOptions.instructions}`
        : "");
    const system = `${instructionText}\n\nRetrieved context:\n${contextText}`;
    const historyTokens = estimateTokens(
      historyMessages.map((item) => item.content).join("\n"),
    );
    const questionTokens = estimateTokens(body.question);
    const usage: ChatUsage = {
      question: questionTokens,
      retrieval: questionTokens,
      context: estimateTokens(contextText),
      instructions: estimateTokens(instructionText) + historyTokens,
      prompt: estimateTokens(system) + historyTokens + questionTokens,
    };

    const result = streamText({
      model: getChatModel(),
      abortSignal: req.signal,
      temperature: requestOptions.temperature,
      maxOutputTokens: requestOptions.maxOutputTokens,
      system,
      messages: [...historyMessages, { role: "user", content: body.question }],
    });
    const { chatProvider, chatModel } = getProviderSummary();
    const reader = result.fullStream.getReader();
    const encoder = new TextEncoder();
    let generated = "";
    let lastSaved = 0;
    // Saved while streaming and on every exit path so a reload never loses the reply.
    const persist = (force = false) => {
      const nowMs = Date.now();
      if (!force && nowMs - lastSaved < 500) return;
      lastSaved = nowMs;
      try {
        db.prepare("UPDATE chat_messages SET answer=? WHERE id=?").run(
          generated,
          messageId,
        );
        db.prepare("UPDATE chat_sessions SET updated_at=? WHERE id=?").run(
          new Date().toISOString(),
          sessionId,
        );
      } catch {}
    };
    // Text deltas pass through; the final usage is appended after USAGE_MARKER.
    const toChunk = (part: Awaited<ReturnType<typeof reader.read>>["value"]) => {
      if (part?.type === "text-delta") {
        generated += part.text;
        persist();
        return part.text;
      }
      if (part?.type === "finish") {
        persist(true);
        const { inputTokens, outputTokens } = part.totalUsage;
        const final: ChatUsage = {
          ...usage,
          prompt: inputTokens ?? usage.prompt,
          completion: outputTokens ?? estimateTokens(generated),
          estimated: inputTokens === undefined || outputTokens === undefined,
        };
        return USAGE_MARKER + JSON.stringify(final);
      }
      return "";
    };
    let firstChunk = "";
    while (!firstChunk) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.type === "error") {
        db.prepare("DELETE FROM chat_messages WHERE id=?").run(messageId);
        db.prepare(
          "DELETE FROM chat_sessions WHERE id=? AND NOT EXISTS (SELECT 1 FROM chat_messages WHERE session_id=?)",
        ).run(sessionId, sessionId);
        return NextResponse.json(
          { error: describeError(value.error) },
          { status: 502 },
        );
      }
      firstChunk = toChunk(value);
    }
    const body_ = new ReadableStream<Uint8Array>({
      start(controller) {
        if (firstChunk) controller.enqueue(encoder.encode(firstChunk));
      },
      async pull(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              persist(true);
              return controller.close();
            }
            if (value.type === "error") {
              persist(true);
              return controller.error(new Error(describeError(value.error)));
            }
            const chunk = toChunk(value);
            if (chunk) {
              controller.enqueue(encoder.encode(chunk));
              return;
            }
          }
        } catch (error) {
          persist(true);
          controller.error(error);
        }
      },
      cancel: () => {
        persist(true);
        return reader.cancel();
      },
    });
    return new Response(body_, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Rag-Tokens": JSON.stringify(usage),
        "X-Rag-Sources": encodeURIComponent(
          JSON.stringify(sources.map(({ title, score }) => ({ title, score }))),
        ),
        "X-Rag-Session": sessionId,
        "X-Rag-Message": messageId,
        "X-Rag-Provider": chatProvider,
        "X-Rag-Model": encodeURIComponent(chatModel),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: describeError(error) },
      { status: 502 },
    );
  }
}
