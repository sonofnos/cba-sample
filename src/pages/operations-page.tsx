import { ActivitySquare, Globe, Languages, ShieldAlert } from "lucide-react";
import { useMarkets, useOperations } from "@/api/hooks";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import { formatDate } from "@/lib/format";
import type { Market, OperationalIncident } from "@/lib/types";

export function OperationsPage() {
  const { locale, t } = useI18n();
  const { data: incidents = [] } = useOperations();
  const { data: markets = [] } = useMarkets();
  const incidentRows: OperationalIncident[] = incidents;
  const marketRows: Market[] = markets;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Cross-functional command centre for market coverage, languages and exception queues"
        description="This surface represents the kinds of operational overlays a real core banking command centre would use to coordinate branches, regulators and shared services."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active markets</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-3xl font-display font-semibold">
            <Globe className="h-6 w-6 text-primary" />
            {(markets as Market[]).length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Languages</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-3xl font-display font-semibold">
            <Languages className="h-6 w-6 text-primary" />
            2
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Live incidents</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-3xl font-display font-semibold">
            <ShieldAlert className="h-6 w-6 text-primary" />
            {incidentRows.filter((incident) => incident.status !== "Resolved").length}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("operations.timeline")}</CardTitle>
              <CardDescription>Queue ownership, severity and resolution posture for operating issues.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {incidentRows.map((incident) => (
              <div key={incident.id} className="rounded-2xl border border-border/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-surface-100 p-2 text-surface-700">
                      <ActivitySquare className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{incident.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {incident.queue} · {incident.market}
                      </p>
                    </div>
                  </div>
                  <Badge tone={incident.priority === "P1" ? "danger" : incident.priority === "P2" ? "warning" : "neutral"}>
                    {incident.priority}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {incident.status} · Updated {formatDate(incident.updatedAt, locale)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Market operating model</CardTitle>
              <CardDescription>Coverage map for market language, regulator and settlement currency.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketRows.map((market) => (
              <div key={market.code} className="rounded-2xl border border-border/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{market.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {market.regulator} · {market.region}
                    </p>
                  </div>
                  <Badge tone="info">{market.currency}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Primary language: {market.language === "fr" ? "French" : "English"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
