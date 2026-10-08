import type { Dispatch, SetStateAction } from "react";
import {
  MAX_INSTRUCTIONS_LENGTH,
  type ChatOptions,
  type ChatPreset,
} from "@/lib/chat-options";
import { useI18n } from "@/i18n/provider";

type Props = {
  options: ChatOptions;
  setOptions: Dispatch<SetStateAction<ChatOptions>>;
  disabled?: boolean;
};

const presets: { value: ChatPreset; label: string; hint: string }[] = [
  {
    value: "fast",
    label: "Fast reply",
    hint: "Few sources, short and direct answers.",
  },
  {
    value: "balanced",
    label: "Balanced",
    hint: "Uses your RAG settings with no extra constraints.",
  },
  {
    value: "thinking",
    label: "Thinking",
    hint: "More sources and a step-by-step, thorough answer.",
  },
  {
    value: "custom",
    label: "Custom",
    hint: "Set sources, creativity and answer length yourself.",
  },
];

export function ChatOptionsMenu({ options, setOptions, disabled }: Props) {
  const { t } = useI18n();
  const update = (patch: Partial<ChatOptions>) =>
    setOptions((current) => ({ ...current, ...patch }));
  const number = (value: string, fallback: number) =>
    value === "" || Number.isNaN(Number(value)) ? fallback : Number(value);
  const active = presets.find((preset) => preset.value === options.preset);

  return (
    <details className="chat-options">
      <summary className="button button-light" title={t("Model context")}>
        ⚙ {t(active?.label ?? "Balanced")}
      </summary>
      <div className="chat-options-panel" role="group" aria-label={t("Model context")}>
        <div className="chat-options-presets" role="radiogroup">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              role="radio"
              aria-checked={options.preset === preset.value}
              className={`chat-options-preset${options.preset === preset.value ? " is-active" : ""}`}
              disabled={disabled}
              onClick={() => update({ preset: preset.value })}
            >
              {t(preset.label)}
            </button>
          ))}
        </div>
        <p className="chat-options-hint">{t(active?.hint ?? "")}</p>
        {options.preset === "custom" && (
          <div className="chat-options-grid">
            <label>
              {t("Sources to retrieve")}
              <input
                type="number"
                min={1}
                max={20}
                value={options.topK}
                onChange={(e) => update({ topK: number(e.target.value, options.topK) })}
              />
            </label>
            <label>
              {t("Temperature")}
              <input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={options.temperature}
                onChange={(e) =>
                  update({ temperature: number(e.target.value, options.temperature) })
                }
              />
            </label>
            <label>
              {t("Max answer tokens")}
              <input
                type="number"
                min={16}
                max={8192}
                step={50}
                value={options.maxOutputTokens}
                onChange={(e) =>
                  update({
                    maxOutputTokens: number(e.target.value, options.maxOutputTokens),
                  })
                }
              />
            </label>
          </div>
        )}
        <label className="chat-options-field">
          {t("How should the model reply?")}
          <textarea
            rows={3}
            maxLength={MAX_INSTRUCTIONS_LENGTH}
            placeholder={t("e.g. Answer in Italian, use bullet points, keep it formal.")}
            value={options.instructions}
            onChange={(e) => update({ instructions: e.target.value })}
          />
        </label>
        <label className="chat-options-check">
          <input
            type="checkbox"
            checked={options.showCost}
            onChange={(e) => update({ showCost: e.target.checked })}
          />
          {t("Show token cost")}
        </label>
      </div>
    </details>
  );
}
