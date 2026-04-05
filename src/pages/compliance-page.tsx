import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  useAmlAlert,
  useAmlAlertActionMutation,
  useAmlAlertsModule,
  useAuditTrail,
  useGenerateComplianceReportMutation,
  useKycCase,
  useKycDecisionMutation,
  useKycQueue,
  useSanctionsSearchMutation,
} from "@/api/hooks";
import { seededAuditTrail } from "@/data/compliance";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { exportRowsToExcel, exportRowsToPdf } from "@/lib/compliance";
import type { AmlAlert, KycCase, ReportType, SanctionsResult } from "@/lib/compliance";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/hooks/use-i18n";
import { useAuthStore } from "@/store/auth-store";

const complianceNavItems = [
  { to: "/app/compliance/kyc-queue", label: "KYC Queue" },
  { to: "/app/compliance/aml-alerts", label: "AML Alerts" },
  { to: "/app/compliance/sanctions", label: "Sanctions" },
  { to: "/app/compliance/reports", label: "Reports" },
  { to: "/app/compliance/audit-trail", label: "Audit Trail" },
];

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="font-display text-2xl ">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function getRiskTone(score: number) {
  if (score >= 75) return "danger";
  if (score >= 45) return "warning";
  return "positive";
}

function getKycStatusTone(status: KycCase["status"]) {
  if (status === "Approved") return "positive";
  if (status === "Rejected") return "danger";
  if (status === "Referred" || status === "Under Review") return "warning";
  return "neutral";
}

function getAmlStatusTone(status: AmlAlert["status"]) {
  if (status === "SAR Filed") return "danger";
  if (status === "Escalated" || status === "Investigating") return "warning";
  if (status === "Dismissed") return "neutral";
  return "info";
}

function DocumentPlaceholder({ label }: { label: string }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-border/70 bg-gradient-to-br from-[#F5F0E8] to-[#e6d7bf] p-4">
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-[#0A3D2E]/20 bg-white/50">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export function CompliancePage() {
  const user = useAuthStore((state) => state.user);

  if (!user || (user.role !== "compliance" && user.role !== "admin")) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Compliance"
          title="Compliance workspace restricted"
          description="This module is available to compliance officers and administrators only."
        />
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-8">
            <Badge tone="warning">Restricted</Badge>
            <p className="mt-4 font-display text-3xl ">
              KYC, AML, sanctions, reporting, and audit workflows are not available to your role.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Compliance"
        title="KYC, AML, sanctions, and regulatory reporting"
        description="Onboarding review queues, transaction monitoring, sanctions screening, and audit trail in one workspace."
      />

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-3 rounded-[28px] border border-border/70 bg-white/70 p-2 shadow-sm dark:bg-white/5">
          {complianceNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app/compliance"}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive ? "bg-[#0A3D2E] text-[#F5F0E8]" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet />
    </div>
  );
}

export function ComplianceKycQueuePage() {
  const { locale } = useI18n();
  const { data } = useKycQueue();
  const queue = data?.data ?? [];
  const [selectedId, setSelectedId] = useState<string | undefined>(queue[0]?.id);
  const { data: caseResponse } = useKycCase(selectedId);
  const selectedCase = caseResponse?.data ?? queue.find((item) => item.id === selectedId) ?? queue[0];
  const decisionMutation = useKycDecisionMutation(selectedCase?.id ?? "");

  useEffect(() => {
    if (!selectedId && queue[0]) {
      setSelectedId(queue[0].id);
    }
  }, [queue, selectedId]);

  async function takeDecision(status: KycCase["status"]) {
    if (!selectedCase) return;
    await decisionMutation.mutateAsync({ status });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-3">
          <SectionHeading
            title="KYC review queue"
            description="20 seeded onboarding cases awaiting compliance review and decisioning."
          />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Submission</TableHead>
                <TableHead>ID Type</TableHead>
                <TableHead>Risk Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((item) => (
                <TableRow key={item.id} className={selectedId === item.id ? "bg-secondary/30" : ""} onClick={() => setSelectedId(item.id)}>
                  <TableCell className="font-medium">{item.customerName}</TableCell>
                  <TableCell>{item.accountNumber}</TableCell>
                  <TableCell>{formatDate(item.submissionDate, locale)}</TableCell>
                  <TableCell>{item.idType}</TableCell>
                  <TableCell>{item.riskTier}</TableCell>
                  <TableCell>
                    <Badge tone={getKycStatusTone(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); }}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedCase ? (
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading
              title="KYC detail panel"
              description="Personal profile, verification results, and reviewer decision controls."
            />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
              <SummaryRow label="Customer" value={selectedCase.customerName} />
              <SummaryRow label="Account" value={selectedCase.accountNumber} />
              <SummaryRow label="Phone" value={selectedCase.phone} />
              <SummaryRow label="Email" value={selectedCase.email} />
              <SummaryRow label="BVN" value={selectedCase.bvn} />
              <SummaryRow label="Nationality" value={selectedCase.nationality} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {selectedCase.documents.map((document) => (
                <DocumentPlaceholder key={document.id} label={document.label} />
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-border/70 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">ID verification</p>
                <Badge className="mt-3" tone={selectedCase.idVerificationResult === "VERIFIED" ? "positive" : selectedCase.idVerificationResult === "UNCLEAR" ? "warning" : "danger"}>
                  {selectedCase.idVerificationResult}
                </Badge>
              </div>
              <div className="rounded-[24px] border border-border/70 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Liveness</p>
                <Badge className="mt-3" tone={selectedCase.livenessCheckResult === "PASS" ? "positive" : "warning"}>
                  {selectedCase.livenessCheckResult}
                </Badge>
              </div>
              <div className="rounded-[24px] border border-border/70 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Risk score</p>
                <Badge className="mt-3" tone={getRiskTone(selectedCase.riskScore)}>{selectedCase.riskScore}/100</Badge>
              </div>
              <div className="rounded-[24px] border border-border/70 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">PEP check</p>
                <Badge className="mt-3" tone={selectedCase.pepCheck === "No Match" ? "positive" : "warning"}>{selectedCase.pepCheck}</Badge>
              </div>
              <div className="rounded-[24px] border border-border/70 bg-white/70 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Adverse media</p>
                <Badge className="mt-3" tone={selectedCase.adverseMediaCheck === "Clear" ? "positive" : "warning"}>{selectedCase.adverseMediaCheck}</Badge>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Button className="rounded-full" onClick={() => void takeDecision("Approved")} disabled={decisionMutation.isPending}>Approve</Button>
              <Button variant="danger" className="rounded-full" onClick={() => void takeDecision("Rejected")} disabled={decisionMutation.isPending}>Reject</Button>
              <Button variant="outline" className="rounded-full" onClick={() => void takeDecision("Pending Review")} disabled={decisionMutation.isPending}>Request More Docs</Button>
              <Button variant="outline" className="rounded-full" onClick={() => void takeDecision("Referred")} disabled={decisionMutation.isPending}>Escalate</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function ComplianceAmlAlertsPage() {
  const { locale } = useI18n();
  const { data } = useAmlAlertsModule();
  const alerts = data?.data ?? [];
  const [selectedId, setSelectedId] = useState<string | undefined>(alerts[0]?.id);
  const { data: alertResponse } = useAmlAlert(selectedId);
  const selectedAlert = alertResponse?.data ?? alerts.find((item) => item.id === selectedId) ?? alerts[0];
  const actionMutation = useAmlAlertActionMutation(selectedAlert?.id ?? "");

  useEffect(() => {
    if (!selectedId && alerts[0]) setSelectedId(alerts[0].id);
  }, [alerts, selectedId]);

  async function runAction(status: AmlAlert["status"], action: string) {
    if (!selectedAlert) return;
    await actionMutation.mutateAsync({
      status,
      action,
      note: `${action} executed through AML alert console.`,
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5"><CardContent className="p-6"><Badge tone="info">Total Open</Badge><p className="mt-4 font-display text-3xl ">{alerts.filter((item) => item.status === "Open").length}</p></CardContent></Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5"><CardContent className="p-6"><Badge tone="danger">High Risk</Badge><p className="mt-4 font-display text-3xl ">{alerts.filter((item) => item.riskScore >= 75).length}</p></CardContent></Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5"><CardContent className="p-6"><Badge tone="warning">Escalated</Badge><p className="mt-4 font-display text-3xl ">{alerts.filter((item) => item.status === "Escalated").length}</p></CardContent></Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5"><CardContent className="p-6"><Badge tone="positive">Resolved today</Badge><p className="mt-4 font-display text-3xl ">{alerts.filter((item) => item.status === "Dismissed" || item.status === "SAR Filed").length}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading title="AML alerts dashboard" description="15 seeded alerts with transaction-monitoring narratives and action workflows." />
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Alert ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Alert type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Risk score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id} className={selectedId === alert.id ? "bg-secondary/30" : ""} onClick={() => setSelectedId(alert.id)}>
                    <TableCell className="font-medium">{alert.id}</TableCell>
                    <TableCell>{alert.customerName}</TableCell>
                    <TableCell>{alert.alertType}</TableCell>
                    <TableCell>{alert.amount.toLocaleString()}</TableCell>
                    <TableCell>{formatDate(alert.date, locale)}</TableCell>
                    <TableCell><Badge tone={getRiskTone(alert.riskScore)}>{alert.riskScore}</Badge></TableCell>
                    <TableCell><Badge tone={getAmlStatusTone(alert.status)}>{alert.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedAlert ? (
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardHeader className="flex-col items-start gap-3">
              <SectionHeading title="AML alert detail" description="Underlying transactions, narrative context, and investigator action log." />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
                <SummaryRow label="Alert ID" value={selectedAlert.id} />
                <SummaryRow label="Customer" value={selectedAlert.customerName} />
                <SummaryRow label="Alert type" value={selectedAlert.alertType} />
                <SummaryRow label="Risk score" value={`${selectedAlert.riskScore}/100`} />
                <SummaryRow label="Status" value={selectedAlert.status} />
              </div>

              <div className="rounded-[24px] border border-border/70 bg-white/70 p-5">
                <p className="text-sm font-medium">Narrative</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{selectedAlert.narrative}</p>
              </div>

              <div className="rounded-[24px] border border-border/70 bg-white/70 p-5">
                <p className="mb-3 text-sm font-medium">Transactions</p>
                <div className="space-y-3">
                  {selectedAlert.transactions.map((transaction) => (
                    <div key={transaction.id} className="rounded-2xl bg-secondary/20 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{transaction.description}</span>
                        <span>{transaction.amount.toLocaleString()}</span>
                      </div>
                      <p className="mt-2 text-muted-foreground">{formatDate(transaction.date, locale)} · {transaction.direction}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-border/70 bg-white/70 p-5">
                <p className="mb-3 text-sm font-medium">Action log</p>
                <div className="space-y-3">
                  {selectedAlert.actionLog.map((entry) => (
                    <div key={entry.id} className="rounded-2xl bg-secondary/20 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{entry.action}</span>
                        <span className="text-muted-foreground">{entry.actor}</span>
                      </div>
                      <p className="mt-2 text-muted-foreground">{entry.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Button className="rounded-full" onClick={() => void runAction("Investigating", "Investigate")} disabled={actionMutation.isPending}>Investigate</Button>
                <Button variant="danger" className="rounded-full" onClick={() => void runAction("SAR Filed", "File SAR")} disabled={actionMutation.isPending}>File SAR</Button>
                <Button variant="outline" className="rounded-full" onClick={() => void runAction("Dismissed", "Dismiss")} disabled={actionMutation.isPending}>Dismiss</Button>
                <Button variant="outline" className="rounded-full" onClick={() => void runAction("Escalated", "Escalate")} disabled={actionMutation.isPending}>Escalate</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export function ComplianceSanctionsPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SanctionsResult | null>(null);
  const [message, setMessage] = useState("");
  const sanctionsSearch = useSanctionsSearchMutation();

  async function handleSearch() {
    setMessage("");
    if (!query.trim()) {
      setMessage("Enter a customer name, account number, or BVN.");
      return;
    }
    try {
      const response = await sanctionsSearch.mutateAsync({ query: query.trim() });
      setResult(response.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to run sanctions screening.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-3">
          <SectionHeading title="Sanctions screening" description="Check names, account numbers, and BVNs against OFAC, EU, UN, and CBN watchlists." />
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Search input">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter name / account number / BVN" />
          </Field>
          {message ? <p className="text-sm text-danger">{message}</p> : null}
          <Button className="rounded-full" onClick={() => void handleSearch()} disabled={sanctionsSearch.isPending}>
            {sanctionsSearch.isPending ? "Screening..." : "Run Screening"}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
        <CardHeader className="flex-col items-start gap-3">
          <CardTitle className="text-2xl text-[#F5F0E8]">Screening result</CardTitle>
          <CardDescription className="text-[#F5F0E8]/70">Hardcoded match cases are included to demonstrate escalation flow.</CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="rounded-[24px] bg-white/10 p-5">
              <Badge tone={result.result === "CLEAR" ? "positive" : "warning"}>{result.result === "CLEAR" ? "CLEAR" : "POTENTIAL MATCH"}</Badge>
              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Query" value={result.query} />
                <SummaryRow label="Matched name" value={result.matchName ?? "No hit"} />
                <SummaryRow label="Watchlist" value={result.list ?? "No hit"} />
                <SummaryRow label="Score" value={result.score ? `${result.score}` : "N/A"} />
                <SummaryRow label="Country" value={result.country ?? "N/A"} />
              </div>
              <p className="mt-4 text-sm text-[#F5F0E8]/75">{result.note ?? "No sanctions hit returned."}</p>
            </div>
          ) : (
            <div className="rounded-[24px] bg-white/10 p-5 text-sm text-[#F5F0E8]/75">
              Execute a search to return either a clean result or one of the seeded potential matches.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ComplianceReportsPage() {
  const { locale } = useI18n();
  const reportMutation = useGenerateComplianceReportMutation();
  const [reportType, setReportType] = useState<ReportType>("CBN Returns");
  const [from, setFrom] = useState("2026-04-01");
  const [to, setTo] = useState("2026-04-30");
  const rows = reportMutation.data?.data ?? [];

  function exportExcel() {
    void exportRowsToExcel(`panafrika-${reportType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`, rows);
  }

  function exportPdf() {
    void exportRowsToPdf(reportType, `panafrika-${reportType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`, rows);
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-3">
          <SectionHeading title="Regulatory reports" description="Generate preview tables for prudential, large-value, cash, and suspicious-activity reporting." />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Field label="Report type">
            <Select value={reportType} onChange={(event) => setReportType(event.target.value as ReportType)}>
              <option value="CBN Returns">CBN Returns (Nigeria)</option>
              <option value="Large Value Transaction Report">Large Value Transaction Report</option>
              <option value="Cash Transaction Report">Cash Transaction Report</option>
              <option value="Suspicious Transaction Report">Suspicious Transaction Report (STR)</option>
            </Select>
          </Field>
          <Field label="From">
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button className="rounded-full" onClick={() => void reportMutation.mutateAsync({ reportType, from, to })} disabled={reportMutation.isPending}>
              {reportMutation.isPending ? "Generating..." : "Generate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {rows.length ? (
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">Report preview</CardTitle>
              <CardDescription>{reportType} · {rows.length} rows</CardDescription>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full" onClick={exportExcel}>Export to Excel</Button>
              <Button className="rounded-full" onClick={exportPdf}>Export to PDF</Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[960px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reported At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.id}</TableCell>
                    <TableCell>{row.market}</TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell>{row.accountNumber}</TableCell>
                    <TableCell>{row.amount.toLocaleString()}</TableCell>
                    <TableCell>{row.reason}</TableCell>
                    <TableCell>{formatDate(row.reportedAt, locale)}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function ComplianceAuditTrailPage() {
  const { locale } = useI18n();
  const [page, setPage] = useState(1);
  const [date, setDate] = useState("");
  const [role, setRole] = useState("all");
  const [action, setAction] = useState("all");
  const { data } = useAuditTrail({ page, limit: 12, date: date || undefined, role, action });
  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const actionOptions = Array.from(new Set(seededAuditTrail.map((entry) => entry.action)));

  useEffect(() => {
    setPage(1);
  }, [action, date, role]);

  return (
    <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
      <CardHeader className="flex-col items-start gap-4">
        <SectionHeading title="Audit trail" description="Filterable, paginated log of user and system events across the emulator." />
        <div className="grid w-full gap-4 md:grid-cols-4">
          <Field label="Date">
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Role">
            <Select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="all">All roles</option>
              <option value="compliance">Compliance</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
          <Field label="Action">
            <Select value={action} onChange={(event) => setAction(event.target.value)}>
              <option value="all">All actions</option>
              {actionOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button variant="outline" className="rounded-full" onClick={() => { setDate(""); setRole("all"); setAction("all"); }}>
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.timestamp, locale)}</TableCell>
                  <TableCell>{row.user}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.entity}</TableCell>
                  <TableCell>{row.ipAddress}</TableCell>
                  <TableCell><Badge tone={row.status === "Success" ? "positive" : row.status === "Pending" ? "warning" : "danger"}>{row.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages} · {pagination.total} events</p>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full" disabled={!pagination.hasPreviousPage} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
              <Button className="rounded-full" disabled={!pagination.hasNextPage} onClick={() => setPage((current) => current + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
