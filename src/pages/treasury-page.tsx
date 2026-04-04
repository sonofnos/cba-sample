import { useTreasury } from "@/api/hooks";
import { TreasuryChart } from "@/components/charts/treasury-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/hooks/use-i18n";
import { formatCompactNumber } from "@/lib/format";
import type { TreasuryPosition } from "@/lib/types";

export function TreasuryPage() {
  const { locale } = useI18n();
  const { data = [] } = useTreasury();
  const rows: TreasuryPosition[] = data;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Treasury"
        title="Monitor intraday positions, nostro balances and FX translation exposure"
        description="The treasury layer aggregates currency books across markets and highlights intraday utilization against operating limits."
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Utilization by currency book</CardTitle>
            <CardDescription>Intraday utilization as a percentage of operating limit.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <TreasuryChart data={rows} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((position) => (
          <Card key={position.id}>
            <CardHeader>
              <div>
                <CardTitle>{position.currency}</CardTitle>
                <CardDescription>
                  Nostro {formatCompactNumber(position.nostroBalance, locale)} · USD rate {position.rateToUsd}
                </CardDescription>
              </div>
              <Badge tone={position.dailyChange >= 0 ? "positive" : "warning"}>
                {position.dailyChange >= 0 ? "+" : ""}
                {position.dailyChange}%
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={position.utilization} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Intraday utilization</span>
                <span className="font-medium">{position.utilization}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
