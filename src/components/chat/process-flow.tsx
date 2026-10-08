import type { Activity } from "@/components/chat/activity";
import { totalTokens, type ChatUsage } from "@/lib/chat-options";
import { useI18n } from "@/i18n/provider";

type Props = { entries: Activity[]; running: boolean; usage?: ChatUsage };
const stages = ["Question", "Retrieve", "Context", "Generate", "Answer"] as const;

export function ProcessFlow({ entries, running, usage }: Props) {
  const { t } = useI18n();
  const approx = usage?.estimated ? "≈ " : "";
  const stageTokens: (number | undefined)[] = usage
    ? [
        usage.question,
        usage.retrieval,
        usage.context + usage.instructions,
        usage.completion === undefined ? undefined : usage.prompt + usage.completion,
        usage.completion === undefined ? undefined : totalTokens(usage),
      ]
    : [];
  const latest = entries.at(-1);
  const text = latest?.text.toLowerCase() ?? "";
  const hasQuestion = entries.some((entry) => entry.text.includes("Question submitted"));
  const failed = latest?.level === "error" || text.includes("interrupted");
  let current = -1;
  if (hasQuestion) current = 0;
  if (entries.some((entry) => entry.text.includes("Retrieved"))) current = 2;
  if (entries.some((entry) => entry.text.includes("Streaming response"))) current = 3;
  if (entries.some((entry) => entry.text.includes("Response completed"))) current = 4;
  const active = running ? Math.min(current + (current === 0 ? 1 : 0), 3) : -1;

  return (
    <section className="panel process-flow-card" aria-label={t("RAG process flow")}>
      <div className="process-flow-heading">
        <strong>{t("Response pipeline")}</strong>
        <span>{running ? t("IN PROGRESS") : hasQuestion && !failed ? t("COMPLETE") : t("READY")}</span>
      </div>
      <div className="process-flow" role="list" aria-label={t("Question to answer process")}>
        {stages.map((stage, index) => {
          const complete = index < current || (index === 4 && current === 4);
          const isActive = index === active && !failed;
          const state = failed && index === current ? "error" : complete ? "complete" : isActive ? "active" : "waiting";
          return (
            <div className={`process-flow-step process-flow-${state}`} role="listitem" key={stage}>
              {index > 0 && <span className="process-flow-edge" aria-hidden="true" />}
              <span className="process-flow-node" aria-hidden="true">{complete ? "✓" : index + 1}</span>
              <span className="process-flow-label">{t(stage)}</span>
              {stageTokens[index] !== undefined && (
                <span className="process-flow-tokens">{approx}{stageTokens[index]} {t("tokens")}</span>
              )}
            </div>
          );
        })}
      </div>
      {usage && usage.completion !== undefined && (
        <div className="process-flow-total">
          <strong>{t("Total cost")}: {approx}{totalTokens(usage)} {t("tokens")}</strong>
          <span>
            {t("embedding")} {usage.retrieval} + {t("prompt")} {usage.prompt} + {t("answer")} {usage.completion}
          </span>
        </div>
      )}
    </section>
  );
}
