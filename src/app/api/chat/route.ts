import { streamText } from "ai";
import { NextResponse } from "next/server";
import { getChatModel, getProviderSummary } from "@/lib/providers";
import { retrieve } from "@/lib/rag";
import { db } from "@/lib/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

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
    const sources = await retrieve(body.collectionId, body.question);
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

    const result = streamText({
      model: getChatModel(),
      abortSignal: req.signal,
      system:
        "Answer using only the supplied retrieved sources. If they do not contain the answer, say so. Cite source titles in your answer. Do not invent facts.\n\nRetrieved context:\n" +
        sources
          .map(
            (source, index) =>
              `[${index + 1}] ${source.title}: ${source.content}`,
          )
          .join("\n\n"),
      messages: [...historyMessages, { role: "user", content: body.question }],
      onFinish: ({ text }) => {
        const finishedAt = new Date().toISOString();
        db.prepare("UPDATE chat_messages SET answer=? WHERE id=?").run(
          text,
          messageId,
        );
        db.prepare("UPDATE chat_sessions SET updated_at=? WHERE id=?").run(
          finishedAt,
          sessionId,
        );
      },
      onAbort: ({ steps }) => {
        const partial = steps.map((step) => step.text).join("");
        const finishedAt = new Date().toISOString();
        db.prepare("UPDATE chat_messages SET answer=? WHERE id=?").run(
          partial,
          messageId,
        );
        db.prepare("UPDATE chat_sessions SET updated_at=? WHERE id=?").run(
          finishedAt,
          sessionId,
        );
      },
    });
    const { chatProvider, chatModel } = getProviderSummary();
    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-cache, no-transform",
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
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 502 },
    );
  }
}
