import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricTile({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "positive" | "neutral" | "attention";
}) {
  const Icon = tone === "positive" ? ArrowUpRight : tone === "attention" ? ArrowDownRight : Minus;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl",
            tone === "positive" && "bg-emerald-100 text-emerald-700",
            tone === "neutral" && "bg-surface-100 text-surface-700",
            tone === "attention" && "bg-orange-100 text-orange-700",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{delta}</p>
      </CardContent>
    </Card>
  );
}
