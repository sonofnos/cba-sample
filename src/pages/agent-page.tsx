import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Network,
  Printer,
  Search,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NavLink, Outlet, useNavigate, useOutletContext } from "react-router-dom";
import {
  agentMarkets,
  agentProfile,
  agentStatuses,
  agentTiers,
  floatHistory,
  seededAgentNetwork,
  agentWeeklyPerformance,
  type AgentStatus,
  type AgentTier,
} from "@/data/agent-banking";
import { accounts, customers, marketOptions } from "@/data/seed";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";

type AgentTransactionType =
  | "Cash Deposit"
  | "Cash Withdrawal"
  | "Account Opening"
  | "Bill Payment"
  | "Airtime Sales"
  | "Balance Enquiry";

interface FloatHistoryEntry {
  label: string;
  balance: number;
  topUps: number;
  dispensed: number;
}

interface AgentReceipt {
  id: string;
  type: AgentTransactionType;
  customerName: string;
  accountNumber: string;
  amount: number;
  createdAt: string;
  reference: string;
  statusLine: string;
  extraLines?: Array<{ label: string; value: string }>;
}

interface AgentModuleContextValue {
  currentFloat: number;
  currentProfile: typeof agentProfile;
  floatLedger: FloatHistoryEntry[];
  recentReceipts: AgentReceipt[];
  requestTopUp: (amount: number) => void;
  addReceipt: (receipt: AgentReceipt) => void;
}

const agentNavItems = [
  { to: "/app/agent", label: "Dashboard" },
  { to: "/app/agent/transactions", label: "Transactions" },
  { to: "/app/agent/float", label: "Float" },
  { to: "/app/agent/network", label: "Network Map" },
];

const terminalTypes: AgentTransactionType[] = [
  "Cash Deposit",
  "Cash Withdrawal",
  "Account Opening",
  "Bill Payment",
  "Airtime Sales",
  "Balance Enquiry",
];

const countryPolygons = {
  GH: "130,116 170,98 206,118 214,164 202,222 194,260 208,318 188,348 152,320 142,266 132,214 138,160",
  NG: "292,96 352,82 430,110 462,154 458,220 438,284 412,336 356,360 314,338 292,296 274,238 280,178",
  KE: "742,122 796,108 836,136 854,188 842,242 854,306 830,358 788,344 764,286 746,236 736,186",
} as const;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function formatMoney(value: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "NGN" ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function maskAccountNumber(accountNumber: string) {
  const tail = accountNumber.slice(-4);
  return `******${tail}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getReceiptTone(type: AgentTransactionType) {
  if (type === "Cash Withdrawal") return "warning";
  if (type === "Account Opening") return "info";
  if (type === "Balance Enquiry") return "neutral";
  return "positive";
}

function getStatusTone(status: AgentStatus) {
  if (status === "Active") return "positive";
  if (status === "Suspended") return "danger";
  return "warning";
}

function useAgentModule() {
  return useOutletContext<AgentModuleContextValue>();
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
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

function ReceiptView({ receipt }: { receipt: AgentReceipt }) {
  return (
    <div className="receipt-print-area mx-auto max-w-md rounded-[24px] border border-dashed border-border/80 bg-[#faf7ef] p-6 font-mono text-[13px] leading-6 text-[#2d2a25] shadow-sm">
      <div className="text-center">
        <p className="text-base font-semibold">PANAFRIKA BANK</p>
        <p>AGENT BANKING RECEIPT</p>
      </div>
      <div className="my-4 border-t border-dashed border-[#6b655a]" />
      <p>{agentProfile.name}</p>
      <p>{agentProfile.code}</p>
      <p>{agentProfile.location}</p>
      <div className="my-4 border-t border-dashed border-[#6b655a]" />
      <p>TXN TYPE : {receipt.type.toUpperCase()}</p>
      <p>CUSTOMER : {receipt.customerName.toUpperCase()}</p>
      <p>ACCOUNT  : {maskAccountNumber(receipt.accountNumber)}</p>
      <p>AMOUNT   : {formatMoney(receipt.amount)}</p>
      <p>DATE/TIME: {formatDateTime(receipt.createdAt)}</p>
      <p>REF      : {receipt.reference}</p>
      {receipt.extraLines?.map((line) => (
        <p key={line.label}>
          {line.label.padEnd(8, " ")}: {line.value}
        </p>
      ))}
      <div className="my-4 border-t border-dashed border-[#6b655a]" />
      <p className="text-center">{receipt.statusLine.toUpperCase()}</p>
      <p className="mt-2 text-center">POWERED BY PANAFRIKA BANK</p>
    </div>
  );
}

export function AgentPage() {
  const user = useAuthStore((state) => state.user);
  const [currentFloat, setCurrentFloat] = useState(agentProfile.floatBalance);
  const [floatLedger, setFloatLedger] = useState<FloatHistoryEntry[]>(floatHistory);
  const [recentReceipts, setRecentReceipts] = useState<AgentReceipt[]>([
    {
      id: "agt-rct-001",
      type: "Cash Withdrawal",
      customerName: "Adaobi Chukwu",
      accountNumber: "0123456789",
      amount: 40_000,
      createdAt: "2026-04-04T10:11:00Z",
      reference: "AGT202604041011",
      statusLine: "Transaction successful",
    },
    {
      id: "agt-rct-002",
      type: "Cash Deposit",
      customerName: "Ifeanyi Okafor",
      accountNumber: "0123456792",
      amount: 75_000,
      createdAt: "2026-04-04T11:26:00Z",
      reference: "AGT202604041126",
      statusLine: "Deposit posted successfully",
    },
  ]);

  function updateFloat(nextBalance: number, topUps: number, dispensed: number) {
    setCurrentFloat(nextBalance);
    setFloatLedger((current) => [
      ...current,
      {
        label: new Intl.DateTimeFormat("en-NG", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
        balance: nextBalance,
        topUps,
        dispensed,
      },
    ]);
  }

  function requestTopUp(amount: number) {
    updateFloat(currentFloat + amount, amount, 0);
  }

  function addReceipt(receipt: AgentReceipt) {
    setRecentReceipts((current) => [receipt, ...current].slice(0, 8));
    if (receipt.type === "Cash Withdrawal") {
      updateFloat(Math.max(currentFloat - receipt.amount, 0), 0, receipt.amount);
    }
    if (receipt.type === "Cash Deposit") {
      updateFloat(currentFloat + receipt.amount, receipt.amount, 0);
    }
  }

  if (!user || (user.role !== "teller" && user.role !== "admin")) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Agent Banking"
          title="Agent banking workspace restricted"
          description="This module is available to teller and admin roles operating field banking distribution."
        />
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-8">
            <Badge tone="warning">Restricted</Badge>
            <p className="mt-4 font-display text-3xl font-semibold">
              Agent dashboard, terminal, float controls, and network visibility are not available to your role.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Agent Banking"
        title="Last-mile distribution network and field transactions"
        description="Assisted-service transactions, float monitoring, and agent network visibility across last-mile channels."
      />

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-3 rounded-[28px] border border-border/70 bg-white/70 p-2 shadow-sm dark:bg-white/5">
          {agentNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app/agent"}
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

      <Outlet
        context={{
          currentFloat,
          currentProfile: agentProfile,
          floatLedger,
          recentReceipts,
          requestTopUp,
          addReceipt,
        } satisfies AgentModuleContextValue}
      />
    </div>
  );
}

export function AgentDashboardPage() {
  const navigate = useNavigate();
  const { currentFloat, currentProfile, floatLedger, recentReceipts } = useAgentModule();
  const additionalTransactions = recentReceipts.length;
  const additionalVolume = recentReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const transactionsToday = currentProfile.todayTransactions + additionalTransactions;
  const volumeToday = currentProfile.todayVolume + additionalVolume;
  const commissionToday = currentProfile.todayCommission + Math.round(additionalVolume * 0.008);
  const lowFloat = currentFloat < 100_000;
  const dispensedToday = floatLedger.reduce((sum, point) => sum + point.dispensed, 0);
  const utilization = Math.round((dispensedToday / Math.max(dispensedToday + currentFloat, 1)) * 100);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
          <CardHeader className="flex-col items-start gap-3">
            <Badge tone="info">Agent profile</Badge>
            <CardTitle className="font-display text-3xl text-[#F5F0E8]">{currentProfile.name}</CardTitle>
            <CardDescription className="text-[#F5F0E8]/70">
              {currentProfile.code} · {currentProfile.location}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#C9A84C]">Tier</p>
              <p className="mt-3 text-2xl font-semibold">{currentProfile.tier}</p>
            </div>
            <div className="rounded-[24px] bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#C9A84C]">Float balance</p>
              <p className="mt-3 text-2xl font-semibold">{formatMoney(currentFloat)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Transactions</p>
              <p className="mt-3 font-display text-4xl font-semibold">{transactionsToday}</p>
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Volume</p>
              <p className="mt-3 font-display text-4xl font-semibold">{formatMoney(volumeToday)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Commission</p>
              <p className="mt-3 font-display text-4xl font-semibold">{formatMoney(commissionToday)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5 md:col-span-3">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Float threshold monitor</p>
                  <p className="mt-2 text-sm text-muted-foreground">Threshold alert triggers below NGN 100,000.</p>
                </div>
                <Badge tone={lowFloat ? "danger" : "positive"}>{lowFloat ? "Low float" : "Healthy"}</Badge>
              </div>
              <Progress value={(currentFloat / 1_200_000) * 100} className="h-3" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatMoney(currentFloat)}</span>
                <span>{utilization}% utilized today</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading
              title="Weekly transaction performance"
              description="Daily transaction count and transaction volume across the current operating week."
            />
          </CardHeader>
          <CardContent>
            <div className="h-[340px]">
              <ResponsiveContainer>
                <ComposedChart data={agentWeeklyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8ccbb" />
                  <XAxis dataKey="day" stroke="#7c6f5c" />
                  <YAxis yAxisId="left" stroke="#7c6f5c" />
                  <YAxis yAxisId="right" orientation="right" stroke="#7c6f5c" />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === "volume" ? formatMoney(value) : value.toLocaleString()
                    }
                  />
                  <Bar yAxisId="left" dataKey="transactions" fill="#0A3D2E" radius={[8, 8, 0, 0]} />
                  <Area yAxisId="right" type="monotone" dataKey="volume" fill="#C9A84C" stroke="#C9A84C" fillOpacity={0.22} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading
              title="Quick links"
              description="Jump directly into the terminal, float desk, or network monitoring."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Open terminal", note: "Run deposits, withdrawals, account opening, airtime, and balance enquiries.", icon: Activity, to: "/app/agent/transactions" },
              { title: "Manage float", note: "Watch float utilization and request top-ups before thresholds are breached.", icon: Wallet, to: "/app/agent/float" },
              { title: "View network", note: "Inspect the agent footprint and health across Nigeria, Ghana, and Kenya.", icon: Network, to: "/app/agent/network" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className="flex w-full items-center gap-4 rounded-[24px] border border-border/70 bg-secondary/20 p-4 text-left transition hover:border-[#C9A84C]/40"
                >
                  <div className="rounded-2xl bg-[#0A3D2E] p-3 text-[#F5F0E8]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                  </div>
                </button>
              );
            })}

            {recentReceipts[0] ? (
              <div className="rounded-[24px] border border-border/70 bg-[#faf7ef] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latest terminal receipt</p>
                <p className="mt-3 font-medium">{recentReceipts[0].type}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {recentReceipts[0].customerName} · {formatMoney(recentReceipts[0].amount)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{recentReceipts[0].reference}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AgentTransactionsPage() {
  const navigate = useNavigate();
  const { addReceipt, recentReceipts } = useAgentModule();
  const [transactionType, setTransactionType] = useState<AgentTransactionType>("Cash Deposit");
  const [accountNumber, setAccountNumber] = useState("0123456789");
  const [customerName, setCustomerName] = useState("Adaobi Chukwu");
  const [amount, setAmount] = useState("25000");
  const [pin, setPin] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<AgentReceipt | null>(null);
  const [openingStep, setOpeningStep] = useState<1 | 2>(1);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [idType, setIdType] = useState("National ID");
  const [airtimePhone, setAirtimePhone] = useState("+2348031234567");

  const requiresPin = transactionType === "Cash Withdrawal" || transactionType === "Balance Enquiry";
  const requiresAmount = transactionType !== "Balance Enquiry";

  async function lookupCustomer() {
    setLookupLoading(true);
    await wait(1200);
    const knownCustomer = customers.find((customer) => customer.accountNumber === accountNumber);
    const ownAccount = accounts.find((account) => account.accountNumber === accountNumber);
    setCustomerName(knownCustomer?.fullName ?? ownAccount?.type ?? "Chinedu Balogun");
    setLookupLoading(false);
  }

  async function processTerminalTransaction() {
    setProcessing(true);
    await wait(2000);

    let nextReceipt: AgentReceipt;
    const createdAt = new Date().toISOString();
    const reference = `AGT${Date.now()}`;

    if (transactionType === "Account Opening") {
      nextReceipt = {
        id: reference,
        type: transactionType,
        customerName: newCustomerName,
        accountNumber: `013${String(Date.now()).slice(-7)}`,
        amount: 0,
        createdAt,
        reference,
        statusLine: "Account opened successfully",
        extraLines: [
          { label: "PHONE", value: phoneNumber },
          { label: "ID TYPE", value: idType },
        ],
      };
      setOpeningStep(1);
      setNewCustomerName("");
      setPhoneNumber("");
    } else if (transactionType === "Balance Enquiry") {
      nextReceipt = {
        id: reference,
        type: transactionType,
        customerName,
        accountNumber,
        amount: 0,
        createdAt,
        reference,
        statusLine: "Balance enquiry successful",
        extraLines: [
          { label: "BALANCE", value: "NGN ***,***.00" },
          { label: "PIN", value: "VERIFIED" },
        ],
      };
    } else if (transactionType === "Airtime Sales") {
      nextReceipt = {
        id: reference,
        type: transactionType,
        customerName,
        accountNumber,
        amount: Number(amount),
        createdAt,
        reference,
        statusLine: "Airtime delivered successfully",
        extraLines: [{ label: "MOBILE", value: airtimePhone }],
      };
    } else {
      nextReceipt = {
        id: reference,
        type: transactionType,
        customerName,
        accountNumber,
        amount: Number(amount),
        createdAt,
        reference,
        statusLine:
          transactionType === "Cash Withdrawal"
            ? "Cash paid successfully"
            : "Transaction successful",
        extraLines: requiresPin ? [{ label: "PIN", value: "VERIFIED" }] : undefined,
      };
    }

    setReceipt(nextReceipt);
    addReceipt(nextReceipt);
    setProcessing(false);
    setPin("");
  }

  function printReceipt() {
    window.print();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="rounded-[28px] border-primary/10 bg-[#102a20] text-[#F5F0E8]">
        <CardHeader className="flex-col items-start gap-3">
          <SectionHeading
            title="Agent transaction terminal"
            description="POS-style assisted-service terminal for deposits, withdrawals, onboarding, enquiries, and quick value services."
          />
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Transaction type">
            <Select value={transactionType} onChange={(event) => setTransactionType(event.target.value as AgentTransactionType)} className="bg-white/95 text-foreground">
              {terminalTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>

          {transactionType === "Bill Payment" ? (
            <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-[#F5F0E8]/75">
                Bill payments route into the full payments module so the agent terminal uses the same validation and receipt flow.
              </p>
              <Button className="rounded-full bg-[#C9A84C] text-[#0A3D2E] hover:bg-[#d8b96c]" onClick={() => navigate("/app/payments/bills")}>
                Open bills payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : transactionType === "Account Opening" ? (
            <div className="space-y-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <Badge tone={openingStep === 1 ? "positive" : "neutral"}>Step 1</Badge>
                <Badge tone={openingStep === 2 ? "positive" : "neutral"}>Step 2</Badge>
              </div>
              {openingStep === 1 ? (
                <div className="grid gap-4">
                  <Field label="Customer name">
                    <Input value={newCustomerName} onChange={(event) => setNewCustomerName(event.target.value)} className="bg-white/95 text-foreground" />
                  </Field>
                  <Field label="Phone number">
                    <Input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="bg-white/95 text-foreground" />
                  </Field>
                  <Button className="rounded-full" disabled={!newCustomerName || !phoneNumber} onClick={() => setOpeningStep(2)}>
                    Continue to ID step
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  <Field label="ID type">
                    <Select value={idType} onChange={(event) => setIdType(event.target.value)} className="bg-white/95 text-foreground">
                      <option>National ID</option>
                      <option>Voter Card</option>
                      <option>Passport</option>
                      <option>Driver Licence</option>
                    </Select>
                  </Field>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" className="rounded-full bg-transparent text-[#F5F0E8]" onClick={() => setOpeningStep(1)}>
                      Back
                    </Button>
                    <Button className="rounded-full" onClick={() => void processTerminalTransaction()}>
                      {processing ? "Processing..." : "Open account"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="grid gap-4">
                <Field label="Customer account number">
                  <Input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} className="bg-white/95 text-foreground" />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="rounded-full bg-transparent text-[#F5F0E8]" onClick={() => void lookupCustomer()}>
                    {lookupLoading ? "Checking..." : "Name enquiry"}
                    <Search className="ml-2 h-4 w-4" />
                  </Button>
                  <div className="rounded-full bg-white/10 px-4 py-2 text-sm">{customerName || "Awaiting name enquiry"}</div>
                </div>
              </div>

              {transactionType === "Airtime Sales" ? (
                <Field label="Recharge phone number">
                  <Input value={airtimePhone} onChange={(event) => setAirtimePhone(event.target.value)} className="bg-white/95 text-foreground" />
                </Field>
              ) : null}

              {requiresAmount ? (
                <Field label="Amount">
                  <Input value={amount} onChange={(event) => setAmount(event.target.value)} className="bg-white/95 text-foreground" />
                </Field>
              ) : null}

              {requiresPin ? (
                <Field label="Customer PIN">
                  <Input value={pin} onChange={(event) => setPin(event.target.value)} className="bg-white/95 text-foreground" placeholder="Enter 4 digits" />
                </Field>
              ) : (
                <div className="rounded-[20px] border border-dashed border-white/15 px-4 py-3 text-sm text-[#F5F0E8]/72">
                  Cash is collected physically at the agent point before confirmation.
                </div>
              )}

              <Button
                className="rounded-full"
                disabled={
                  processing ||
                  !accountNumber ||
                  !customerName ||
                  (requiresAmount && !amount) ||
                  (requiresPin && pin.length < 4)
                }
                onClick={() => void processTerminalTransaction()}
              >
                {processing ? "Processing..." : "Process transaction"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <div className="flex w-full items-center justify-between gap-4">
              <SectionHeading
                title="Thermal receipt"
                description="Monospace receipt output formatted for agency banking confirmation slips."
              />
              {receipt ? (
                <Button className="receipt-print-hide rounded-full" variant="outline" onClick={printReceipt}>
                  Print
                  <Printer className="ml-2 h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {receipt ? (
              <ReceiptView receipt={receipt} />
            ) : (
              <div className="rounded-[24px] border border-dashed border-border/70 bg-secondary/20 p-8 text-sm text-muted-foreground">
                Run a transaction to generate a terminal receipt.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading
              title="Recent terminal activity"
              description="Latest assisted-service transactions processed by this agent terminal."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReceipts.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-border/70 bg-secondary/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.type}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.customerName} · {maskAccountNumber(item.accountNumber)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={getReceiptTone(item.type)}>{item.statusLine}</Badge>
                    <p className="mt-2 text-sm font-medium">{formatMoney(item.amount)}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{item.reference} · {formatDateTime(item.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AgentFloatPage() {
  const { currentFloat, floatLedger, requestTopUp } = useAgentModule();
  const [topUpAmount, setTopUpAmount] = useState("250000");
  const [topUpSource, setTopUpSource] = useState("Branch Vault");
  const [loading, setLoading] = useState(false);

  const totalDispensed = floatLedger.reduce((sum, item) => sum + item.dispensed, 0);
  const utilization = Math.round((totalDispensed / Math.max(totalDispensed + currentFloat, 1)) * 100);
  const lowFloat = currentFloat < 100_000;

  async function submitTopUp() {
    setLoading(true);
    await wait(1500);
    requestTopUp(Number(topUpAmount));
    setLoading(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading
              title="Float position"
              description="Monitor current float, top-up readiness, and dispensed utilization across the day."
            />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-[#0A3D2E] p-5 text-[#F5F0E8]">
                <p className="text-xs uppercase tracking-[0.18em] text-[#C9A84C]">Current float balance</p>
                <p className="mt-3 font-display text-4xl font-semibold">{formatMoney(currentFloat)}</p>
              </div>
              <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Float utilization</p>
                <p className="mt-3 font-display text-4xl font-semibold">{utilization}%</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">Low float warning system</p>
                <Badge tone={lowFloat ? "danger" : "positive"}>
                  {lowFloat ? "Threshold breached" : "Within threshold"}
                </Badge>
              </div>
              <Progress value={(currentFloat / 1_200_000) * 100} className="h-3" />
              <p className="text-sm text-muted-foreground">Threshold alert triggers below NGN 100,000.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading
              title="Request float top-up"
              description="Simulate same-day float replenishment from branch vault, cluster hub, or treasury support."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Top-up amount">
              <Input value={topUpAmount} onChange={(event) => setTopUpAmount(event.target.value)} />
            </Field>
            <Field label="Source">
              <Select value={topUpSource} onChange={(event) => setTopUpSource(event.target.value)}>
                <option>Branch Vault</option>
                <option>Cluster Hub</option>
                <option>Treasury Support</option>
              </Select>
            </Field>
            <Button className="rounded-full" disabled={loading || !topUpAmount} onClick={() => void submitTopUp()}>
              {loading ? "Requesting..." : "Request float top-up"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-3">
          <SectionHeading
            title="Float history"
            description="Intraday float balance versus dispensed value and replenishment events."
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-[320px]">
            <ResponsiveContainer>
              <AreaChart data={floatLedger}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8ccbb" />
                <XAxis dataKey="label" stroke="#7c6f5c" />
                <YAxis stroke="#7c6f5c" />
                <Tooltip formatter={(value: number) => formatMoney(value)} />
                <Area type="monotone" dataKey="balance" stroke="#0A3D2E" fill="#0A3D2E" fillOpacity={0.16} />
                <Area type="monotone" dataKey="dispensed" stroke="#C46E4A" fill="#C46E4A" fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {floatLedger.slice().reverse().map((entry, index) => (
              <div key={`${entry.label}-${index}`} className="rounded-[24px] border border-border/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">{entry.label}</p>
                  <p className="text-sm text-muted-foreground">{formatMoney(entry.balance)}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Top-ups: {formatMoney(entry.topUps)} · Dispensed: {formatMoney(entry.dispensed)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AgentNetworkPage() {
  const [market, setMarket] = useState<"all" | (typeof agentMarkets)[number]>("all");
  const [tier, setTier] = useState<"all" | AgentTier>("all");
  const [status, setStatus] = useState<"all" | AgentStatus>("all");

  const filteredAgents = useMemo(
    () =>
      seededAgentNetwork.filter((agent) => {
        if (market !== "all" && agent.market !== market) return false;
        if (tier !== "all" && agent.tier !== tier) return false;
        if (status !== "all" && agent.status !== status) return false;
        return true;
      }),
    [market, status, tier],
  );

  const [selectedId, setSelectedId] = useState(filteredAgents[0]?.id ?? seededAgentNetwork[0].id);

  useEffect(() => {
    if (!filteredAgents.length) return;
    if (!filteredAgents.some((agent) => agent.id === selectedId)) {
      setSelectedId(filteredAgents[0].id);
    }
  }, [filteredAgents, selectedId]);

  const selectedAgent = filteredAgents.find((agent) => agent.id === selectedId) ?? filteredAgents[0];
  const activeNow = filteredAgents.filter((agent) => agent.status === "Active").length;
  const totalFloat = filteredAgents.reduce((sum, agent) => sum + agent.floatBalance, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total agents</p>
            <p className="mt-3 font-display text-4xl font-semibold">{filteredAgents.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active now</p>
            <p className="mt-3 font-display text-4xl font-semibold">{activeNow}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total network float</p>
            <p className="mt-3 font-display text-4xl font-semibold">{formatMoney(totalFloat)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Markets shown</p>
            <p className="mt-3 font-display text-4xl font-semibold">{market === "all" ? 3 : 1}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-4">
            <SectionHeading
              title="Agent network map"
              description="Web-native SVG footprint of active, inactive, and suspended agents across Nigeria, Ghana, and Kenya."
            />
            <div className="grid w-full gap-3 md:grid-cols-3">
              <Select value={market} onChange={(event) => setMarket(event.target.value as typeof market)}>
                <option value="all">All markets</option>
                {agentMarkets.map((entry) => {
                  const option = marketOptions.find((item) => item.code === entry);
                  return (
                    <option key={entry} value={entry}>
                      {option?.label ?? entry}
                    </option>
                  );
                })}
              </Select>
              <Select value={tier} onChange={(event) => setTier(event.target.value as typeof tier)}>
                <option value="all">All tiers</option>
                {agentTiers.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </Select>
              <Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                <option value="all">All statuses</option>
                {agentStatuses.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-[28px] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.18),transparent_24%),linear-gradient(180deg,#f7f1e8,#efe5d5)] p-4 dark:bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.16),transparent_22%),linear-gradient(180deg,#11271f,#0c2019)]">
              <svg viewBox="0 0 1000 460" className="h-[460px] w-full">
                <g opacity="0.16">
                  <polygon points={countryPolygons.GH} fill="#0A3D2E" stroke="#0A3D2E" strokeWidth="3" />
                  <polygon points={countryPolygons.NG} fill="#0A3D2E" stroke="#0A3D2E" strokeWidth="3" />
                  <polygon points={countryPolygons.KE} fill="#0A3D2E" stroke="#0A3D2E" strokeWidth="3" />
                </g>
                <g fontSize="18" fill="#0A3D2E" opacity="0.78" className="font-semibold">
                  <text x="140" y="92">Ghana</text>
                  <text x="326" y="72">Nigeria</text>
                  <text x="760" y="92">Kenya</text>
                </g>
                {filteredAgents.map((agent) => {
                  const color = agent.status === "Active" ? "#C9A84C" : agent.status === "Suspended" ? "#C46E4A" : "#7A8F64";
                  const selected = agent.id === selectedId;
                  return (
                    <g key={agent.id} onClick={() => setSelectedId(agent.id)} className="cursor-pointer">
                      {agent.status === "Active" ? (
                        <circle cx={agent.x} cy={agent.y} r="12" fill={color} opacity="0.22" className="africa-pulse" />
                      ) : null}
                      <circle cx={agent.x} cy={agent.y} r={selected ? 8 : 6} fill={color} stroke={selected ? "#0A3D2E" : "#fff"} strokeWidth={selected ? 3 : 2} />
                    </g>
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardHeader className="flex-col items-start gap-3">
              <SectionHeading
                title="Selected agent"
                description="Click any network dot to inspect local profile, tier, volume, and status."
              />
            </CardHeader>
            <CardContent>
              {selectedAgent ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl font-semibold">{selectedAgent.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedAgent.code}</p>
                    </div>
                    <Badge tone={getStatusTone(selectedAgent.status)}>{selectedAgent.status}</Badge>
                  </div>
                  <SummaryRow label="Location" value={selectedAgent.location} />
                  <SummaryRow label="Market" value={marketOptions.find((item) => item.code === selectedAgent.market)?.label ?? selectedAgent.market} />
                  <SummaryRow label="Tier" value={selectedAgent.tier} />
                  <SummaryRow label="Today volume" value={formatMoney(selectedAgent.todayVolume)} />
                  <SummaryRow label="Float balance" value={formatMoney(selectedAgent.floatBalance)} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No agents match the current filters.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardHeader className="flex-col items-start gap-3">
              <SectionHeading
                title="Network health legend"
                description="Status colors used on the map."
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Active", color: "#C9A84C", note: "Transacting and heartbeat live" },
                { label: "Inactive", color: "#7A8F64", note: "No transactions or heartbeat during the current window" },
                { label: "Suspended", color: "#C46E4A", note: "Manually suspended or under network review" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-[20px] border border-border/70 p-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.note}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
