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
        title="Operational command centre"
        description="Market coverage, active incidents, regulatory language mapping, and cross-branch exception queues."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active markets</p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="font-display text-4xl ">{(markets as Market[]).length}</p>
              <Globe className="mb-1 h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">West, East and Southern Africa</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Interface languages</p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="font-display text-4xl ">2</p>
              <Languages className="mb-1 h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">English and French</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live incidents</p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="font-display text-4xl ">
                {incidentRows.filter((incident) => incident.status !== "Resolved").length}
              </p>
              <ShieldAlert className="mb-1 h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Unresolved across all queues</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
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
                    <div className="rounded-xl bg-secondary p-2 text-muted-foreground">
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

        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
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
