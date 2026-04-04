import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-100", className)}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}
