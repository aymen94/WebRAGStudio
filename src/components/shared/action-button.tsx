import type { ReactNode } from "react";
import { useI18n } from "@/i18n/provider";

type Props = {
  action: string;
  busyAction: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export function ActionButton({
  action,
  busyAction,
  children,
  className,
  disabled = false,
}: Props) {
  const { t } = useI18n();
  const loading = busyAction === action;
  return (
    <button
      className={className}
      type="submit"
      disabled={disabled || !!busyAction}
      aria-busy={loading}
    >
      {loading && <span className="button-spinner" aria-hidden="true" />}
      {loading ? "Working…" : children}
    </button>
  );
}
