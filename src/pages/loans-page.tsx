import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  useAcceptLoanOfferMutation,
  useLoanApplicationMutation,
  useLoanPaymentMutation,
  useManagedLoan,
  useManagedLoans,
} from "@/api/hooks";
import { loanProducts, seededLoans } from "@/data/loans";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { downloadLoanAgreement } from "@/lib/loan-pdf";
import {
  calculateDebtToIncomeRatio,
  calculateLoan,
} from "@/lib/loans";
import type {
  CollateralType,
  EmploymentType,
  LoanOffer,
  LoanType,
  ManagedLoan,
} from "@/lib/loans";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/hooks/use-i18n";

const loansNavItems = [
  { to: "/app/loans", label: "Overview" },
  { to: "/app/loans/apply", label: "Apply" },
  { to: "/app/loans/calculator", label: "Calculator" },
];

const applicationSteps = [
  "Loan Type",
  "Employment",
  "Financial Profile",
  "Collateral",
  "Review",
];

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
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

function getProduct(type: LoanType) {
  return loanProducts.find((product) => product.type === type) ?? loanProducts[0];
}

function isSecuredLoan(type: LoanType) {
  return type === "Asset Finance" || type === "Mortgage";
}

function getCountdown(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) {
    return "Due now";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return `${days}d ${hours}h remaining`;
}

function CalculatorPanel({
  type,
  amount,
  tenor,
  onTypeChange,
  onAmountChange,
  onTenorChange,
}: {
  type: LoanType;
  amount: number;
  tenor: number;
  onTypeChange: (type: LoanType) => void;
  onAmountChange: (amount: number) => void;
  onTenorChange: (tenor: number) => void;
}) {
  const { locale } = useI18n();
  const product = getProduct(type);
  const calculation = useMemo(
    () =>
      calculateLoan(
        amount,
        product.baseRate,
        tenor,
        new Date().toISOString(),
        0,
        Boolean(product.flatRate),
      ),
    [amount, product.baseRate, product.flatRate, tenor],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-3">
          <SectionHeading
            title="Loan calculator"
            description="Model repayments, interest burden, and effective annual rate using the product pricing profile."
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <Field label="Loan type">
            <Select value={type} onChange={(event) => onTypeChange(event.target.value as LoanType)}>
              {loanProducts.map((product) => (
                <option key={product.type} value={product.type}>
                  {product.type}
                </option>
              ))}
            </Select>
          </Field>

          <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Amount</span>
              <span className="text-sm text-muted-foreground">{formatMoney(amount, product.currency, locale)}</span>
            </div>
            <input
              type="range"
              min={product.minAmount}
              max={product.maxAmount}
              step={product.currency === "NGN" ? 50_000 : 1}
              value={amount}
              onChange={(event) => onAmountChange(Number(event.target.value))}
              className="mt-4 w-full accent-[#0A3D2E]"
            />
            <p className="mt-3 text-xs text-muted-foreground">
              {formatMoney(product.minAmount, product.currency, locale)} to {formatMoney(product.maxAmount, product.currency, locale)}
            </p>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tenor</span>
              <span className="text-sm text-muted-foreground">{tenor} months</span>
            </div>
            <input
              type="range"
              min={product.minTenorMonths}
              max={product.maxTenorMonths}
              step={1}
              value={tenor}
              onChange={(event) => onTenorChange(Number(event.target.value))}
              className="mt-4 w-full accent-[#0A3D2E]"
            />
            <p className="mt-3 text-xs text-muted-foreground">
              {product.minTenorMonths} to {product.maxTenorMonths} months
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-border/70 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Interest rate</p>
              <p className="mt-2 text-lg font-semibold">{product.rateRange}</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Effective annual rate</p>
              <p className="mt-2 text-lg font-semibold">{calculation.effectiveAnnualRate.toFixed(2)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardContent className="p-6">
              <Badge tone="positive">Monthly repayment</Badge>
              <p className="mt-4 font-display text-3xl font-semibold">
                {formatMoney(calculation.monthlyRepayment, product.currency, locale)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardContent className="p-6">
              <Badge tone="warning">Total interest</Badge>
              <p className="mt-4 font-display text-3xl font-semibold">
                {formatMoney(calculation.totalInterest, product.currency, locale)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardContent className="p-6">
              <Badge tone="info">Total repayment</Badge>
              <p className="mt-4 font-display text-3xl font-semibold">
                {formatMoney(calculation.totalRepayment, product.currency, locale)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardContent className="p-6">
              <Badge tone="neutral">Payment count</Badge>
              <p className="mt-4 font-display text-3xl font-semibold">{calculation.amortization.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="text-2xl">Principal vs interest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={calculation.amortization}>
                  <defs>
                    <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0A3D2E" stopOpacity={0.75} />
                      <stop offset="95%" stopColor="#0A3D2E" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.75} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d7c8b5" />
                  <XAxis dataKey="installmentNumber" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="principal" stroke="#0A3D2E" fill="url(#principalGradient)" />
                  <Area type="monotone" dataKey="interest" stroke="#C9A84C" fill="url(#interestGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="xl:col-span-2 rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader>
          <CardTitle className="text-2xl">Amortization table</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Opening Balance</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Closing Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculation.amortization.map((row) => (
                <TableRow key={row.installmentNumber}>
                  <TableCell>{row.installmentNumber}</TableCell>
                  <TableCell>{formatMoney(row.openingBalance, product.currency, locale)}</TableCell>
                  <TableCell>{formatMoney(row.principal, product.currency, locale)}</TableCell>
                  <TableCell>{formatMoney(row.interest, product.currency, locale)}</TableCell>
                  <TableCell>{formatMoney(row.closingBalance, product.currency, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function LoansPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Loans"
        title="Credit origination and servicing"
        description="Originate loans, price offers, simulate decisioning, and manage active repayment schedules from one credit workspace."
      />

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-3 rounded-[28px] border border-border/70 bg-white/70 p-2 shadow-sm dark:bg-white/5">
          {loansNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app/loans"}
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

export function LoansOverviewPage() {
  const { locale } = useI18n();
  const { data } = useManagedLoans();
  const loans = data?.data ?? seededLoans;
  const activeLoan = loans[0];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <Badge tone="positive">Active loans</Badge>
            <p className="mt-4 font-display text-3xl font-semibold">{loans.filter((loan) => loan.status === "Active").length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <Badge tone="warning">Monthly repayment</Badge>
            <p className="mt-4 font-display text-3xl font-semibold">{formatMoney(activeLoan.monthlyRepayment, activeLoan.currency, locale)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <Badge tone="info">Outstanding balance</Badge>
            <p className="mt-4 font-display text-3xl font-semibold">{formatMoney(activeLoan.outstandingBalance, activeLoan.currency, locale)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <Badge tone="neutral">Next payment</Badge>
            <p className="mt-4 font-display text-3xl font-semibold">{getCountdown(activeLoan.nextPaymentDueDate)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading
              title="Active loan dashboard"
              description="Servicing view for the seeded active personal loan and its repayment posture."
            />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
                <SummaryRow label="Loan ID" value={activeLoan.id} />
                <SummaryRow label="Original amount" value={formatMoney(activeLoan.originalAmount, activeLoan.currency, locale)} />
                <SummaryRow label="Disbursed amount" value={formatMoney(activeLoan.disbursedAmount, activeLoan.currency, locale)} />
                <SummaryRow label="Rate" value={`${activeLoan.interestRate}% p.a.`} />
                <SummaryRow label="Tenor" value={`${activeLoan.tenorMonths} months`} />
                <SummaryRow label="Months remaining" value={`${activeLoan.monthsRemaining}`} />
              </div>
              <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Repayment progress</p>
                <p className="mt-3 font-display text-4xl font-semibold">{activeLoan.repaymentProgressPercent}%</p>
                <Progress value={activeLoan.repaymentProgressPercent} className="mt-4 h-3" />
                <p className="mt-4 text-sm text-muted-foreground">Next payment due: {formatDate(activeLoan.nextPaymentDueDate, locale)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{getCountdown(activeLoan.nextPaymentDueDate)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/app/loans/${activeLoan.id}`}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-surface-600"
              >
                Open loan detail
              </Link>
              <Link
                to="/app/loans/apply"
                className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-medium transition hover:bg-surface-50"
              >
                Apply for another loan
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
          <CardHeader className="flex-col items-start gap-3">
            <CardTitle className="text-2xl text-[#F5F0E8]">Products on offer</CardTitle>
            <CardDescription className="text-[#F5F0E8]/70">
              Retail and SME lending products modeled in the emulator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loanProducts.map((product) => (
              <div key={product.type} className="rounded-[24px] bg-white/10 p-4 text-sm">
                <p className="font-medium">{product.type}</p>
                <p className="mt-2 text-[#F5F0E8]/70">{product.rateRange}</p>
                <p className="mt-1 text-[#F5F0E8]/70">
                  {formatMoney(product.minAmount, product.currency, locale)} to {formatMoney(product.maxAmount, product.currency, locale)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LoanCalculatorPage() {
  const [type, setType] = useState<LoanType>("Personal Loan");
  const [amount, setAmount] = useState(2_000_000);
  const [tenor, setTenor] = useState(24);

  useEffect(() => {
    const product = getProduct(type);
    setAmount(Math.min(Math.max(amount, product.minAmount), product.maxAmount));
    setTenor(Math.min(Math.max(tenor, product.minTenorMonths), product.maxTenorMonths));
  }, [amount, tenor, type]);

  return (
    <CalculatorPanel
      type={type}
      amount={amount}
      tenor={tenor}
      onTypeChange={setType}
      onAmountChange={setAmount}
      onTenorChange={setTenor}
    />
  );
}

export function LoanApplicationPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const applyMutation = useLoanApplicationMutation();
  const acceptOfferMutation = useAcceptLoanOfferMutation();
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [offer, setOffer] = useState<LoanOffer | null>(null);
  const [form, setForm] = useState({
    type: "Personal Loan" as LoanType,
    amount: 2_000_000,
    purpose: "Home improvement",
    employmentType: "Employed" as EmploymentType,
    employerName: "PanAfrika Energy Services",
    monthlyIncome: 850_000,
    yearsEmployed: 4,
    monthlyExpenses: 260_000,
    existingLoanObligations: 45_000,
    bankStatementsUploaded: false,
    collateralType: "Property" as CollateralType,
    collateralValue: 0,
    collateralDocumentUploaded: false,
  });

  const product = getProduct(form.type);
  const dti = useMemo(
    () =>
      calculateDebtToIncomeRatio(
        form.monthlyIncome,
        form.monthlyExpenses,
        form.existingLoanObligations,
      ),
    [form.existingLoanObligations, form.monthlyExpenses, form.monthlyIncome],
  );

  const preview = useMemo(
    () =>
      calculateLoan(
        form.amount,
        product.baseRate,
        Math.min(Math.max(24, product.minTenorMonths), product.maxTenorMonths),
        new Date().toISOString(),
        0,
        Boolean(product.flatRate),
      ),
    [form.amount, product.baseRate, product.flatRate, product.maxTenorMonths, product.minTenorMonths],
  );

  function validateStep() {
    if (step === 1 && (!form.type || !form.amount || !form.purpose)) {
      return "Select a loan type, amount, and purpose.";
    }
    if (step === 2 && (!form.employmentType || !form.employerName || !form.monthlyIncome)) {
      return "Complete employment or business profile details.";
    }
    if (step === 3 && (!form.bankStatementsUploaded || !form.monthlyExpenses)) {
      return "Upload bank statements and complete the financial profile.";
    }
    if (step === 4 && isSecuredLoan(form.type) && (!form.collateralValue || !form.collateralDocumentUploaded)) {
      return "Secured facilities require collateral value and document upload.";
    }
    return "";
  }

  async function submitApplication() {
    const validationError = validateStep();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setMessage("");
    const start = Date.now();

    try {
      const response = await applyMutation.mutateAsync({
        ...form,
      });
      const elapsed = Date.now() - start;
      if (elapsed < 3000) {
        await new Promise((resolve) => window.setTimeout(resolve, 3000 - elapsed));
      }
      setOffer(response.data);
    } catch (error) {
      const elapsed = Date.now() - start;
      if (elapsed < 3000) {
        await new Promise((resolve) => window.setTimeout(resolve, 3000 - elapsed));
      }
      setMessage(error instanceof Error ? error.message : "Unable to submit application.");
    }
  }

  async function acceptOffer() {
    if (!offer || offer.decision !== "approved") {
      return;
    }

    setMessage("");
    try {
      const response = await acceptOfferMutation.mutateAsync({ applicationId: offer.applicationId });
      navigate(`/app/loans/${response.data.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to disburse loan.");
    }
  }

  if (offer) {
    return (
      <div className="space-y-6">
        <Card className={`rounded-[28px] ${offer.decision === "approved" ? "border-emerald-200 bg-emerald-50/80" : "border-amber-200 bg-amber-50/80"}`}>
          <CardContent className="p-8">
            <div className="mb-5 flex items-center gap-3">
              <Badge tone={offer.decision === "approved" ? "positive" : "warning"}>
                {offer.decision === "approved" ? "Approved" : "Referred"}
              </Badge>
              <p className="font-display text-3xl font-semibold">
                {offer.decision === "approved" ? "Loan offer ready" : "Additional documents needed"}
              </p>
            </div>

            {offer.decision === "approved" ? (
              <div className="rounded-[24px] border border-emerald-200 bg-white p-6">
                <SummaryRow label="Approved amount" value={formatMoney(offer.approvedAmount ?? 0, "NGN", locale)} />
                <SummaryRow label="Rate" value={`${offer.interestRate}%`} />
                <SummaryRow label="Tenor" value={`${offer.tenorMonths} months`} />
                <SummaryRow label="Monthly repayment" value={formatMoney(offer.monthlyRepayment ?? 0, "NGN", locale)} />
                <SummaryRow label="Offer expiry" value={offer.offerExpiryDate ?? "N/A"} />
              </div>
            ) : (
              <div className="rounded-[24px] border border-amber-200 bg-white p-6">
                <p className="text-sm text-muted-foreground">{offer.reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          {offer.decision === "approved" ? (
            <Button className="rounded-full" onClick={() => void acceptOffer()} disabled={acceptOfferMutation.isPending}>
              {acceptOfferMutation.isPending ? "Disbursing..." : "Accept Offer"}
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              setOffer(null);
              setStep(1);
            }}
          >
            Start Another Application
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-5">
          <SectionHeading
            title="Loan application wizard"
            description="Complete five stages of retail credit origination from product selection through offer decisioning."
          />
          <div className="grid w-full gap-3 md:grid-cols-5">
            {applicationSteps.map((label, index) => (
              <div
                key={label}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                  step === index + 1 ? "border-[#0A3D2E] bg-[#0A3D2E] text-[#F5F0E8]" : "border-border bg-secondary/20 text-muted-foreground"
                }`}
              >
                {index + 1}. {label}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? (
            <>
              <Field label="Loan type">
                <Select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as LoanType }))}>
                  {loanProducts.map((productOption) => (
                    <option key={productOption.type} value={productOption.type}>
                      {productOption.type}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Amount">
                <Input
                  type="number"
                  min={product.minAmount}
                  max={product.maxAmount}
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))}
                />
              </Field>
              <Field label="Purpose">
                <Textarea
                  value={form.purpose}
                  onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))}
                />
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Employment type">
                <Select
                  value={form.employmentType}
                  onChange={(event) => setForm((current) => ({ ...current, employmentType: event.target.value as EmploymentType }))}
                >
                  <option value="Employed">Employed</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Business Owner">Business Owner</option>
                </Select>
              </Field>
              <Field label="Employer / business name">
                <Input value={form.employerName} onChange={(event) => setForm((current) => ({ ...current, employerName: event.target.value }))} />
              </Field>
              <Field label="Monthly income">
                <Input type="number" value={form.monthlyIncome} onChange={(event) => setForm((current) => ({ ...current, monthlyIncome: Number(event.target.value) }))} />
              </Field>
              <Field label="Years employed">
                <Input type="number" value={form.yearsEmployed} onChange={(event) => setForm((current) => ({ ...current, yearsEmployed: Number(event.target.value) }))} />
              </Field>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Monthly expenses">
                  <Input type="number" value={form.monthlyExpenses} onChange={(event) => setForm((current) => ({ ...current, monthlyExpenses: Number(event.target.value) }))} />
                </Field>
                <Field label="Existing loan obligations">
                  <Input type="number" value={form.existingLoanObligations} onChange={(event) => setForm((current) => ({ ...current, existingLoanObligations: Number(event.target.value) }))} />
                </Field>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-[#0A3D2E]/30 bg-[#F5F0E8] px-6 py-10 text-center">
                <p className="font-medium">Upload bank statements</p>
                <p className="mt-2 text-sm text-muted-foreground">Simulated document intake for income verification</p>
                <input
                  type="file"
                  className="hidden"
                  onChange={() => setForm((current) => ({ ...current, bankStatementsUploaded: true }))}
                />
              </label>

              <div className="rounded-[24px] border border-[#C9A84C]/35 bg-[#F5F0E8] p-5">
                <p className="text-sm font-medium">Debt-to-income ratio</p>
                <p className="mt-3 font-display text-4xl font-semibold">{dti.toFixed(1)}%</p>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <Field label="Collateral type">
                <Select
                  value={form.collateralType}
                  onChange={(event) => setForm((current) => ({ ...current, collateralType: event.target.value as CollateralType }))}
                >
                  <option value="Property">Property</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Fixed Deposit">Fixed Deposit</option>
                  <option value="Equipment">Equipment</option>
                </Select>
              </Field>
              <Field label="Estimated value">
                <Input type="number" value={form.collateralValue} onChange={(event) => setForm((current) => ({ ...current, collateralValue: Number(event.target.value) }))} />
              </Field>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-[#0A3D2E]/30 bg-[#F5F0E8] px-6 py-10 text-center">
                <p className="font-medium">Upload collateral documents</p>
                <p className="mt-2 text-sm text-muted-foreground">Simulated valuation and title-document capture</p>
                <input
                  type="file"
                  className="hidden"
                  onChange={() => setForm((current) => ({ ...current, collateralDocumentUploaded: true }))}
                />
              </label>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="rounded-[28px] border border-border/70 bg-secondary/20 p-6">
              <SummaryRow label="Loan type" value={form.type} />
              <SummaryRow label="Requested amount" value={formatMoney(form.amount, "NGN", locale)} />
              <SummaryRow label="Purpose" value={form.purpose} />
              <SummaryRow label="Employment profile" value={`${form.employmentType} · ${form.employerName}`} />
              <SummaryRow label="Monthly income" value={formatMoney(form.monthlyIncome, "NGN", locale)} />
              <SummaryRow label="Debt-to-income ratio" value={`${dti.toFixed(1)}%`} />
              <SummaryRow label="Indicative monthly repayment" value={formatMoney(preview.monthlyRepayment, "NGN", locale)} />
            </div>
          ) : null}

          {message ? <p className="text-sm text-danger">{message}</p> : null}

          <div className="flex flex-wrap gap-3">
            {step > 1 ? (
              <Button variant="outline" className="rounded-full" onClick={() => setStep((current) => current - 1)}>
                Back
              </Button>
            ) : null}
            {step < 5 ? (
              <Button
                className="rounded-full"
                onClick={() => {
                  const validationError = validateStep();
                  if (validationError) {
                    setMessage(validationError);
                    return;
                  }
                  setMessage("");
                  setStep((current) => current + 1);
                }}
              >
                Continue
              </Button>
            ) : (
              <Button className="rounded-full" onClick={() => void submitApplication()} disabled={applyMutation.isPending}>
                {applyMutation.isPending ? "Running credit decision..." : "Submit Application"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
        <CardHeader className="flex-col items-start gap-3">
          <CardTitle className="text-2xl text-[#F5F0E8]">Decisioning context</CardTitle>
          <CardDescription className="text-[#F5F0E8]/70">
            Indicative pricing and repayment preview based on the selected facility profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[24px] bg-white/10 p-5">
            <p className="font-medium">{product.type}</p>
            <p className="mt-2 text-sm text-[#F5F0E8]/70">{product.rateRange}</p>
            <p className="mt-2 text-sm text-[#F5F0E8]/70">
              Tenor window: {product.minTenorMonths}–{product.maxTenorMonths} months
            </p>
          </div>
          <div className="rounded-[24px] bg-white/10 p-5">
            <p className="font-medium">Indicative repayment</p>
            <p className="mt-3 font-display text-4xl font-semibold">{formatMoney(preview.monthlyRepayment, "NGN", locale)}</p>
            <p className="mt-2 text-sm text-[#F5F0E8]/70">This preview uses the base rate for the selected loan type.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function LoanDetailPage() {
  const { locale } = useI18n();
  const params = useParams();
  const loanId = params.id;
  const { data } = useManagedLoan(loanId);
  const loan = data?.data ?? seededLoans[0];
  const makePaymentMutation = useLoanPaymentMutation(loan.id);
  const [message, setMessage] = useState("");

  async function makePayment() {
    setMessage("");
    try {
      const response = await makePaymentMutation.mutateAsync();
      setMessage(
        `Payment successful. ${formatMoney(
          response.data.debitedAmount,
          loan.currency,
          locale,
        )} debited. Available balance: ${formatMoney(
          response.data.remainingAccountBalance,
          loan.currency,
          locale,
        )}.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to post loan repayment.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading
              title="Loan detail"
              description="Summary, repayment health, and servicing actions for the selected facility."
            />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
                <SummaryRow label="Loan ID" value={loan.id} />
                <SummaryRow label="Type" value={loan.type} />
                <SummaryRow label="Original amount" value={formatMoney(loan.originalAmount, loan.currency, locale)} />
                <SummaryRow label="Disbursed amount" value={formatMoney(loan.disbursedAmount, loan.currency, locale)} />
                <SummaryRow label="Outstanding balance" value={formatMoney(loan.outstandingBalance, loan.currency, locale)} />
                <SummaryRow label="Rate" value={`${loan.interestRate}%`} />
              </div>
              <div className="rounded-[24px] border border-border/70 bg-secondary/20 p-5">
                <SummaryRow label="Tenor" value={`${loan.tenorMonths} months`} />
                <SummaryRow label="Months remaining" value={`${loan.monthsRemaining}`} />
                <SummaryRow label="Monthly repayment" value={formatMoney(loan.monthlyRepayment, loan.currency, locale)} />
                <SummaryRow label="Next due date" value={formatDate(loan.nextPaymentDueDate, locale)} />
                <SummaryRow label="Countdown" value={getCountdown(loan.nextPaymentDueDate)} />
                <SummaryRow label="Repayment account balance" value={formatMoney(loan.linkedAccountBalance, loan.currency, locale)} />
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Repaid</p>
              <p className="mt-2 font-display text-4xl font-semibold">{loan.repaymentProgressPercent}%</p>
              <Progress value={loan.repaymentProgressPercent} className="mt-4 h-3" />
            </div>

            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button className="rounded-full" onClick={() => void makePayment()} disabled={makePaymentMutation.isPending}>
                {makePaymentMutation.isPending ? "Processing..." : "Make Payment"}
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => void downloadLoanAgreement(loan)}>
                Download Loan Agreement
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
          <CardHeader className="flex-col items-start gap-3">
            <CardTitle className="text-2xl text-[#F5F0E8]">Repayment insights</CardTitle>
            <CardDescription className="text-[#F5F0E8]/70">
              Payment history and scheduled maturities for the active facility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] bg-white/10 p-5">
              <p className="font-medium">Next debit window</p>
              <p className="mt-2 text-sm text-[#F5F0E8]/70">{getCountdown(loan.nextPaymentDueDate)}</p>
            </div>
            <div className="rounded-[24px] bg-white/10 p-5">
              <p className="font-medium">Payment posture</p>
              <p className="mt-2 text-sm text-[#F5F0E8]/70">
                Past installments are marked paid below, with the next installment flagged as due for servicing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader>
          <CardTitle className="text-2xl">Repayment schedule</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Opening Balance</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Closing Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loan.amortization.map((row) => (
                <TableRow key={row.installmentNumber}>
                  <TableCell>{row.installmentNumber}</TableCell>
                  <TableCell>{formatDate(row.dueDate, locale)}</TableCell>
                  <TableCell>{formatMoney(row.openingBalance, loan.currency, locale)}</TableCell>
                  <TableCell>{formatMoney(row.principal, loan.currency, locale)}</TableCell>
                  <TableCell>{formatMoney(row.interest, loan.currency, locale)}</TableCell>
                  <TableCell>{formatMoney(row.closingBalance, loan.currency, locale)}</TableCell>
                  <TableCell>
                    <Badge tone={row.status === "paid" ? "positive" : row.status === "due" ? "warning" : "neutral"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
