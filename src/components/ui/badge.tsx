import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "bg-surface-100 text-surface-700",
  positive: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-orange-100 text-orange-700",
  info: "bg-sky-100 text-sky-700",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof toneClasses }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
