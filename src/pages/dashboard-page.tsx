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
  Wallet,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";
import { accounts, alerts, customers, fxRates, transactions } from "@/data/seed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";

const customerActionItems = [
  { label: "Transfer", icon: ArrowRightLeft, to: "/app/payments/transfer" },
  { label: "Pay Bills", icon: ReceiptText, to: "/app/payments/bills" },
  { label: "Buy Airtime", icon: PhoneCall, to: "/app/payments/airtime" },
  { label: "FX Convert", icon: Wallet, to: "/app/fx/convert" },
  { label: "Download Statement", icon: Download, to: "/app/accounts" },
];

const tellerActionItems = [
  { label: "Cash Deposit", icon: Landmark },
  { label: "Cash Withdrawal", icon: Wallet },
  { label: "Account Opening", icon: CreditCard },
];

const chartColors = ["#0A3D2E", "#C9A84C", "#C46E4A", "#7A8F64", "#234E52"];

function formatAmount(currency: string, value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function maskAccountNumber(accountNumber: string) {
  return `••••••${accountNumber.slice(-4)}`;
}

function getSpendingBreakdown() {
  const debitTransactions = transactions.filter((transaction) => transaction.type === "debit");
  const totals = new Map<string, number>();

  debitTransactions.forEach((transaction) => {
    totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount);
  });

  return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
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
          Review balances, track recent activity, trigger quick actions, and monitor indicative FX rates from one surface.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id} className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{account.type}</CardTitle>
                  <CardDescription className="mt-2">Account No: {maskAccountNumber(account.accountNumber)}</CardDescription>
                </div>
                <div className="rounded-2xl bg-[#0A3D2E] px-3 py-2 text-sm font-semibold text-[#F5F0E8]">
                  {account.currency === "NGN" ? "🇳🇬 NGN" : "🇺🇸 USD"}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Available balance</p>
                <p className="mt-2 font-display text-4xl font-semibold">
                  {formatAmount(account.currency, account.balance)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button className="rounded-full" onClick={() => navigate("/app/payments/transfer")}>Quick Transfer</Button>
                <Button variant="outline" className="rounded-full" onClick={() => navigate("/app/accounts")}>View Statement</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardHeader>
            <div>
              <CardTitle className="text-2xl">Recent transactions</CardTitle>
              <CardDescription>Last 10 activities across your primary account.</CardDescription>
            </div>
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
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border/50">
                    <td className="py-4 pr-4">{transaction.date}</td>
                    <td className="py-4 pr-4 font-medium">{transaction.description}</td>
                    <td className="py-4 pr-4">
                      <span className={transaction.type === "credit" ? "text-emerald-700" : "text-orange-700"}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-4 pr-4">{formatAmount("NGN", transaction.amount)}</td>
                    <td className="py-4 pr-4">{formatAmount("NGN", transaction.runningBalance)}</td>
                    <td className="py-4">
                      <span
                        className={
                          transaction.status === "completed"
                            ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                            : "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700"
                        }
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardHeader>
            <div>
              <CardTitle className="text-2xl">Spending mix</CardTitle>
              <CardDescription>Current month debit categories.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={spendingData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={3}>
                    {spendingData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatAmount("NGN", value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {spendingData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl bg-secondary/35 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatAmount("NGN", item.value)}</span>
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
              <span>{rate.rate}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TellerDashboard() {
  const [query, setQuery] = useState("");

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    if (!normalizedQuery) {
      return customers;
    }
    return customers.filter((customer) =>
      `${customer.fullName} ${customer.accountNumber} ${customer.bvn}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const todayTransactionCount = transactions.filter((transaction) => transaction.date === "2026-04-04").length;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Teller dashboard</p>
        <h1 className="font-display text-4xl font-semibold">Branch operations control center</h1>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          Search customers instantly, watch today&apos;s transaction load, and access cash handling shortcuts from one teller workspace.
        </p>
      </div>

      <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by customer name, account number, or BVN"
              className="h-12 w-full rounded-full border border-border bg-white pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/5"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Today&apos;s transactions</p>
            <p className="mt-3 font-display text-4xl font-semibold">{todayTransactionCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Till balance</p>
            <p className="mt-3 font-display text-4xl font-semibold">{formatAmount("NGN", 12_750_000)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pending exceptions</p>
            <p className="mt-3 font-display text-4xl font-semibold">3</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tellerActionItems.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.label} className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
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
          <div>
            <CardTitle className="text-2xl">Customer search results</CardTitle>
            <CardDescription>{filteredCustomers.length} matched records</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="rounded-2xl border border-border/70 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{customer.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.accountNumber} · BVN {customer.bvn}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {customer.segment} · {customer.phone}
                </div>
              </div>
            </div>
          ))}
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
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5"><CardContent className="p-6"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">KYC queue</p><p className="mt-3 font-display text-4xl font-semibold">18</p></CardContent></Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5"><CardContent className="p-6"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">AML alerts</p><p className="mt-3 font-display text-4xl font-semibold">{alerts.length}</p></CardContent></Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5"><CardContent className="p-6"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sanctions screenings</p><p className="mt-3 font-display text-4xl font-semibold">6</p></CardContent></Card>
      </div>
      <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
        <CardHeader><CardTitle className="text-2xl">Priority alerts</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-4 rounded-2xl border border-border/70 p-4">
              <div className="rounded-2xl bg-orange-100 p-3 text-orange-700"><ShieldAlert className="h-4 w-4" /></div>
              <div>
                <p className="font-medium">{alert.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{alert.timestamp}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Admin dashboard</p>
        <h1 className="font-display text-4xl font-semibold">Platform oversight and controls</h1>
      </div>
      <div className="grid gap-5 md:grid-cols-4">
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5"><CardContent className="p-6"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active users</p><p className="mt-3 font-display text-4xl font-semibold">142</p></CardContent></Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5"><CardContent className="p-6"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">System health</p><p className="mt-3 font-display text-4xl font-semibold">99.98%</p></CardContent></Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5"><CardContent className="p-6"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Audit events</p><p className="mt-3 font-display text-4xl font-semibold">3,492</p></CardContent></Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5"><CardContent className="p-6"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Compliance exceptions</p><p className="mt-3 font-display text-4xl font-semibold">11</p></CardContent></Card>
      </div>
      <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
        <CardHeader><CardTitle className="text-2xl">Admin insights</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 p-5">
            <p className="font-medium">User management</p>
            <p className="mt-2 text-sm text-muted-foreground">Role provisioning, branch entitlements, and operator lifecycle controls are centralized here.</p>
          </div>
          <div className="rounded-2xl border border-border/70 p-5">
            <p className="font-medium">System configuration</p>
            <p className="mt-2 text-sm text-muted-foreground">Treasury limits, product rules, notification policies, and operational thresholds are governed from admin.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  if (user.role === "teller") {
    return <TellerDashboard />;
  }

  if (user.role === "compliance") {
    return <ComplianceDashboard />;
  }

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  return <CustomerDashboard />;
}
