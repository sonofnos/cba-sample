import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  BellRing,
  CreditCard,
  Download,
  Landmark,
  PhoneCall,
  ReceiptText,
  Search,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";
import { accounts, alerts, customers, fxRates, transactions } from "@/data/seed";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";

const customerActionItems = [
  { label: "Transfer", icon: ArrowRightLeft, to: "/app/payments/transfer" },
  { label: "Pay Bills", icon: ReceiptText, to: "/app/payments/bills" },
  { label: "Buy Airtime", icon: PhoneCall, to: "/app/payments/airtime" },
  { label: "FX Convert", icon: Wallet, to: "/app/fx/convert" },
  { label: "Download Statement", icon: Download, to: "/app/accounts" },
];

const tellerActionItems = [
  { label: "Cash Deposit", icon: Landmark, to: "/app/payments/transfer" },
  { label: "Cash Withdrawal", icon: Wallet, to: "/app/payments/transfer" },
  { label: "Account Opening", icon: CreditCard, to: "/app/customers" },
];

const chartColors = ["#0A3D2E", "#C9A84C", "#C46E4A", "#7A8F64", "#234E52"];

function maskAccountNumber(accountNumber: string) {
  return `••••••${accountNumber.slice(-4)}`;
}

function getSpendingBreakdown() {
  const debitTransactions = transactions.filter((t) => t.type === "debit");
  const totals = new Map<string, number>();
  debitTransactions.forEach((t) => {
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  });
  return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
}

function KpiCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
      <CardContent className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="font-display text-4xl font-semibold leading-none">{value}</p>
          {trend === "up" && <TrendingUp className="mb-1 h-4 w-4 text-emerald-600" />}
          {trend === "down" && <TrendingDown className="mb-1 h-4 w-4 text-orange-600" />}
        </div>
        {sub && <p className="mt-2 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function CustomerDashboard() {
  const navigate = useNavigate();
  const spendingData = useMemo(() => getSpendingBreakdown(), []);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Customer dashboard</p>
        <h1 className="font-display text-4xl font-semibold">Your banking control center</h1>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          Balances, recent activity, quick actions, and live FX rates in one surface.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id} className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{account.type}</CardTitle>
                  <CardDescription className="mt-2">
                    {maskAccountNumber(account.accountNumber)}
                  </CardDescription>
                </div>
                <span className="rounded-2xl bg-[#0A3D2E] px-3 py-2 text-sm font-semibold text-[#F5F0E8]">
                  {account.currency === "NGN" ? "🇳🇬 NGN" : "🇺🇸 USD"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Available balance</p>
                <p className="mt-2 font-display text-4xl font-semibold">
                  {formatCurrency(account.balance, account.currency, "en")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button className="rounded-full" onClick={() => navigate("/app/payments/transfer")}>
                  Quick Transfer
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => navigate("/app/accounts")}>
                  View Statement
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="text-2xl">Recent transactions</CardTitle>
            <CardDescription>Last 10 activities across your primary account.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Running Balance</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-border/50">
                    <td className="py-4 pr-4 tabular-nums text-muted-foreground">{txn.date}</td>
                    <td className="py-4 pr-4 font-medium">{txn.description}</td>
                    <td className="py-4 pr-4">
                      <Badge tone={txn.type === "credit" ? "positive" : "neutral"}>
                        {txn.type}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4 tabular-nums">
                      {formatCurrency(txn.amount, "NGN", "en")}
                    </td>
                    <td className="py-4 pr-4 tabular-nums text-muted-foreground">
                      {formatCurrency(txn.runningBalance, "NGN", "en")}
                    </td>
                    <td className="py-4">
                      <Badge tone={txn.status === "completed" ? "positive" : "warning"}>
                        {txn.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="text-2xl">Spending mix</CardTitle>
            <CardDescription>Current month debit categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={spendingData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {spendingData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, "NGN", "en")}
                    contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {spendingData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl bg-secondary/35 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: chartColors[index % chartColors.length] }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(item.value, "NGN", "en")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {customerActionItems.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.label}
              className="cursor-pointer rounded-[28px] border-primary/10 bg-white/80 transition hover:-translate-y-1 dark:bg-white/5"
              onClick={() => navigate(action.to)}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl bg-[#0A3D2E] p-3 text-[#F5F0E8]">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium">{action.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[#C9A84C]/25 bg-[#0A3D2E] px-0 py-4 text-[#F5F0E8] shadow-panel">
        <div className="fx-marquee whitespace-nowrap">
          {[...fxRates, ...fxRates].map((rate, index) => (
            <span key={`${rate.id}-${index}`} className="mx-6 inline-flex items-center gap-3 text-sm font-medium">
              <span className="rounded-full bg-[#C9A84C] px-3 py-1 text-[#0A3D2E]">{rate.pair}</span>
              <span className="tabular-nums">{rate.rate}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TellerDashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filteredCustomers = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      `${c.fullName} ${c.accountNumber} ${c.bvn}`.toLowerCase().includes(q),
    );
  }, [query]);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = transactions.filter((t) => t.date === today).length || transactions.length;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Teller dashboard</p>
        <h1 className="font-display text-4xl font-semibold">Branch operations</h1>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          Search customers, monitor today&apos;s transaction load, and access cash handling shortcuts.
        </p>
      </div>

      <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer name, account number, or BVN"
              className="h-12 w-full rounded-full border border-border bg-white pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/5"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        <KpiCard label="Today's transactions" value={todayCount} sub="Across all counters" />
        <KpiCard label="Till balance" value={formatCurrency(12_750_000, "NGN", "en")} sub="Opening: ₦12,500,000" />
        <KpiCard label="Pending exceptions" value={3} sub="2 require escalation" trend="down" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tellerActionItems.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.label}
              className="cursor-pointer rounded-[28px] border-primary/10 bg-white/80 transition hover:-translate-y-1 dark:bg-white/5"
              onClick={() => navigate(action.to)}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-2xl bg-[#C9A84C] p-3 text-[#0A3D2E]">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium">{action.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
        <CardHeader>
          <CardTitle className="text-2xl">Customer search results</CardTitle>
          <CardDescription>{filteredCustomers.length} matched record{filteredCustomers.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No customers match &ldquo;{query}&rdquo;</p>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{customer.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.accountNumber} · BVN {customer.bvn}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="neutral">{customer.segment}</Badge>
                    <span className="text-sm text-muted-foreground">{customer.phone}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ComplianceDashboard() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Compliance dashboard</p>
        <h1 className="font-display text-4xl font-semibold">KYC and surveillance workbench</h1>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          Active review queues, escalated AML flags, and screening workloads across all markets.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <KpiCard label="KYC queue" value={18} sub="4 require escalation" trend="up" />
        <KpiCard label="Open AML alerts" value={alerts.length} sub="1 escalated to SAR" trend="down" />
        <KpiCard label="Sanctions screenings" value={6} sub="All cleared today" trend="neutral" />
      </div>

      <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
        <CardHeader>
          <CardTitle className="text-2xl">Priority alerts</CardTitle>
          <CardDescription>Active flags requiring compliance officer attention.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-4 rounded-2xl border border-border/70 p-4">
              <div className="rounded-2xl bg-orange-100 p-3 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{alert.title}</p>
                  <Badge
                    tone={
                      alert.severity === "critical"
                        ? "danger"
                        : alert.severity === "warning"
                          ? "warning"
                          : "info"
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{alert.timestamp}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">KYC approval rate</p>
            <p className="mt-3 font-display text-4xl font-semibold">87.4%</p>
            <p className="mt-2 text-xs text-muted-foreground">Last 30 days · 214 cases reviewed</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[87%] rounded-full bg-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Avg. review time</p>
            <p className="mt-3 font-display text-4xl font-semibold">2.4 hrs</p>
            <p className="mt-2 text-xs text-muted-foreground">SLA target: 4 hrs · On track</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[60%] rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Admin dashboard</p>
        <h1 className="font-display text-4xl font-semibold">Platform oversight and controls</h1>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          System health, user activity, audit coverage, and compliance exceptions across the group.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <KpiCard label="Active users" value={142} sub="↑ 12 from yesterday" trend="up" />
        <KpiCard label="System health" value="99.98%" sub="All services nominal" trend="neutral" />
        <KpiCard label="Audit events" value="3,492" sub="Last 24 hours" trend="neutral" />
        <KpiCard label="Compliance exceptions" value={11} sub="3 require action" trend="down" />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="text-xl">Market coverage</CardTitle>
            <CardDescription>Active entities by region</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { market: "🇳🇬 Nigeria", status: "Operational", users: 84 },
              { market: "🇬🇭 Ghana", status: "Operational", users: 21 },
              { market: "🇰🇪 Kenya", status: "Operational", users: 18 },
              { market: "🇿🇦 South Africa", status: "Degraded", users: 9 },
              { market: "🇸🇳 Senegal", status: "Operational", users: 10 },
            ].map((row) => (
              <div key={row.market} className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium">{row.market}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{row.users} users</span>
                  <Badge tone={row.status === "Operational" ? "positive" : "warning"}>{row.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="text-xl">Recent platform events</CardTitle>
            <CardDescription>System-level changes and approvals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Treasury limit updated", time: "3 mins ago", tone: "info" as const },
              { label: "New operator role provisioned", time: "1 hr ago", tone: "positive" as const },
              { label: "AML rule threshold adjusted", time: "2 hrs ago", tone: "warning" as const },
              { label: "FX board rate published", time: "4 hrs ago", tone: "info" as const },
              { label: "KYC workflow config updated", time: "6 hrs ago", tone: "neutral" as const },
            ].map((event) => (
              <div key={event.label} className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
                <p className="text-sm font-medium">{event.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                  <Badge tone={event.tone}>event</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pending approvals</p>
            <p className="mt-3 font-display text-4xl font-semibold">7</p>
            <p className="mt-2 text-xs text-muted-foreground">Limit overrides, role changes</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Locked accounts</p>
            <p className="mt-3 font-display text-4xl font-semibold">3</p>
            <p className="mt-2 text-xs text-muted-foreground">Failed auth threshold reached</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">API calls (24h)</p>
            <p className="mt-3 font-display text-4xl font-semibold">48.2k</p>
            <p className="mt-2 text-xs text-muted-foreground">0.02% error rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  if (user.role === "teller") return <TellerDashboard />;
  if (user.role === "compliance") return <ComplianceDashboard />;
  if (user.role === "admin") return <AdminDashboard />;

  return <CustomerDashboard />;
}
