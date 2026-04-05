import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Globe2,
  History,
  Phone,
  ReceiptText,
  Upload,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  useBillPaymentMutation,
  useBulkPaymentMutation,
  useNameEnquiryMutation,
  usePaymentsHistory,
  useTransferMutation,
} from "@/api/hooks";
import { accounts } from "@/data/seed";
import {
  airtimeProducts,
  billCategories,
  findRate,
  getBanksForMarket,
  seededPaymentHistory,
  swiftCountries,
  transferTypeOptions,
} from "@/data/payments";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { formatDate } from "@/lib/format";
import type {
  BillPaymentResponse,
  BulkPaymentResponse,
  BulkPaymentRowPreview,
  FxPreview,
  NameEnquiryResponse,
  PaymentChannel,
  PaymentsHistoryItem,
  TransferResponse,
  TransferType,
} from "@/lib/payments";
import { downloadElementAsPng } from "@/lib/receipt";
import type { CurrencyCode, MarketCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";

const paymentsNavItems = [
  { to: "/app/payments", label: "Overview" },
  { to: "/app/payments/transfer", label: "Transfer" },
  { to: "/app/payments/bills", label: "Bills" },
  { to: "/app/payments/airtime", label: "Airtime" },
  { to: "/app/payments/bulk", label: "Bulk" },
  { to: "/app/payments/international", label: "International" },
  { to: "/app/payments/history", label: "History" },
];

const paymentHubCards = [
  {
    title: "Funds Transfer",
    description: "Three-step transfer wizard with name enquiry, FX preview, scheduling, and receipt generation.",
    icon: ArrowRightLeft,
    to: "/app/payments/transfer",
    badge: "3-step wizard",
  },
  {
    title: "Bills Payment",
    description: "Validate utilities, TV, school fees, and levy references before booking the debit.",
    icon: ReceiptText,
    to: "/app/payments/bills",
    badge: "Validation flow",
  },
  {
    title: "Airtime & Data",
    description: "Recharge mobile airtime and data bundles across PanAfrika operating markets.",
    icon: Phone,
    to: "/app/payments/airtime",
    badge: "Instant fulfillment",
  },
  {
    title: "Bulk Payments",
    description: "Upload CSV batches, validate row-level fields, and process beneficiary outcomes in bulk.",
    icon: FileSpreadsheet,
    to: "/app/payments/bulk",
    badge: "CSV processing",
  },
  {
    title: "International",
    description: "Compose SWIFT-style cross-border instructions with correspondent-bank routing and MT103 preview.",
    icon: Globe2,
    to: "/app/payments/international",
    badge: "MT103 simulation",
  },
  {
    title: "Payments History",
    description: "Filter and paginate all payments across transfers, bills, airtime, and batch disbursements.",
    icon: History,
    to: "/app/payments/history",
    badge: "Paginated ledger",
  },
];

const stepLabels = ["Beneficiary", "Amount & Details", "Review & Confirm"];
const swiftStepLabels = ["Ordering Customer", "Ordering Bank", "Correspondent", "Beneficiary Bank", "Beneficiary"];

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getEffectiveMarket(
  market: MarketCode,
  userMarket: Exclude<MarketCode, "ALL"> | undefined,
): Exclude<MarketCode, "ALL"> {
  if (market !== "ALL") {
    return market;
  }

  return userMarket ?? "NG";
}

function formatMoney(value: number, currency: CurrencyCode, locale: string) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "NGN" ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function accountLabel(accountId: string) {
  return accounts.find((account) => account.id === accountId)?.type ?? "Selected account";
}

function maskAccountNumber(accountNumber: string) {
  return `••••${accountNumber.slice(-4)}`;
}

function buildFxPreview(amount: number, sendCurrency: CurrencyCode, receiveCurrency: CurrencyCode): FxPreview | null {
  if (!amount || sendCurrency === receiveCurrency) {
    return null;
  }

  if (sendCurrency === "NGN" && receiveCurrency === "USD") {
    const rate = findRate("USD/NGN");
    return {
      sendAmount: amount,
      sendCurrency,
      receiveAmount: Number((amount / rate).toFixed(2)),
      receiveCurrency,
      rate,
      fee: 2000,
    };
  }

  if (sendCurrency === "NGN" && receiveCurrency === "EUR") {
    const rate = findRate("EUR/NGN");
    return {
      sendAmount: amount,
      sendCurrency,
      receiveAmount: Number((amount / rate).toFixed(2)),
      receiveCurrency,
      rate,
      fee: 2000,
    };
  }

  if (sendCurrency === "USD" && receiveCurrency === "NGN") {
    const rate = findRate("USD/NGN");
    return {
      sendAmount: amount,
      sendCurrency,
      receiveAmount: Number((amount * rate).toFixed(2)),
      receiveCurrency,
      rate,
      fee: 15,
    };
  }

  if (sendCurrency === "EUR" && receiveCurrency === "NGN") {
    const rate = findRate("EUR/NGN");
    return {
      sendAmount: amount,
      sendCurrency,
      receiveAmount: Number((amount * rate).toFixed(2)),
      receiveCurrency,
      rate,
      fee: 20,
    };
  }

  return null;
}

function buildProviderOptions(category: string, market: Exclude<MarketCode, "ALL">) {
  const match = billCategories.find((entry) => entry.category === category);
  return match?.providers[market] ?? [];
}

function getMockCustomerName(provider: string, referenceNumber: string) {
  const suffix = referenceNumber.slice(-4) || "2201";
  return `${provider.toUpperCase()} CUSTOMER ${suffix}`;
}

function parseCsv(text: string): BulkPaymentRowPreview[] {
  const [headerRow, ...rows] = text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const headers = headerRow?.split(",").map((cell) => cell.trim().toLowerCase()) ?? [];
  const requiredHeaders = ["account_number", "amount", "narration"];
  const hasRequiredHeaders = requiredHeaders.every((header) => headers.includes(header));

  if (!hasRequiredHeaders) {
    return [
      {
        rowNumber: 1,
        account_number: "",
        amount: "",
        narration: "",
        validationStatus: "invalid",
        validationMessage: "CSV must include account_number, amount, narration columns.",
      },
    ];
  }

  return rows.map((row, index) => {
    const cells = row.split(",").map((cell) => cell.trim());
    const record = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] ?? ""])) as {
      account_number: string;
      amount: string;
      narration: string;
    };
    const amount = Number(record.amount);
    const accountValid = /^\d{10,18}$/.test(record.account_number);
    const amountValid = Number.isFinite(amount) && amount > 0;
    const narrationValid = record.narration.length > 0 && record.narration.length <= 100;
    const validationStatus = accountValid && amountValid && narrationValid ? "valid" : "invalid";

    return {
      rowNumber: index + 1,
      ...record,
      validationStatus,
      validationMessage:
        validationStatus === "valid"
          ? "Ready for processing"
          : "Check account number, amount, and narration columns.",
    };
  });
}

function buildMt103Preview(form: {
  reference: string;
  orderingCustomerName: string;
  orderingAddress: string;
  orderingAccount: string;
  orderingBankName: string;
  orderingBankSwift: string;
  correspondentBankName: string;
  correspondentSwift: string;
  beneficiaryBankName: string;
  beneficiaryBankSwift: string;
  beneficiaryBankCountry: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  beneficiaryAccount: string;
  amount: string;
  currency: CurrencyCode;
  purpose: string;
}) {
  const amount = Number(form.amount || 0).toFixed(2).replace(".", ",");
  const today = new Date().toISOString().slice(2, 10).replace(/-/g, "");

  return `{1:F01PABNNGLAXXX0000000000}{2:I103${form.beneficiaryBankSwift || "BARCGB22"}XXXXN}{4:
:20:${form.reference}
:23B:CRED
:32A:${today}${form.currency}${amount}
:50K:/${form.orderingAccount}
${form.orderingCustomerName.toUpperCase()}
${form.orderingAddress.toUpperCase()}
:52A:${form.orderingBankSwift}
${form.orderingBankName.toUpperCase()}
:56A:${form.correspondentSwift}
${form.correspondentBankName.toUpperCase()}
:57A:${form.beneficiaryBankSwift}
${form.beneficiaryBankName.toUpperCase()}
:59:/${form.beneficiaryAccount}
${form.beneficiaryName.toUpperCase()}
${form.beneficiaryAddress.toUpperCase()}
:70:${form.purpose}
:71A:SHA
-}`;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="font-display text-2xl ">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ReceiptCard({
  title,
  subtitle,
  details,
  onDownload,
}: {
  title: string;
  subtitle: string;
  details: Array<{ label: string; value: string }>;
  onDownload?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  return (
    <Card className="rounded-[28px] border-emerald-200 bg-emerald-50/70">
      <CardContent className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="success-checkmark flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <p className="font-display text-2xl  text-emerald-900">{title}</p>
            <p className="text-sm text-emerald-900/70">{subtitle}</p>
          </div>
        </div>

        <div
          ref={cardRef}
          className="rounded-[24px] border border-emerald-200 bg-white p-6 shadow-sm"
        >
          {details.map((detail) => (
            <SummaryRow key={detail.label} label={detail.label} value={detail.value} />
          ))}
        </div>

        {onDownload ? (
          <div className="mt-5">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={async () => {
                if (!cardRef.current) {
                  return;
                }
                await downloadElementAsPng(cardRef.current, "panafrika-receipt.png");
                onDownload();
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Share Receipt
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PaymentsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Payments"
        title="Payments command center"
        description="Domestic transfers, bill payments, airtime, bulk disbursements, and SWIFT cross-border flows."
      />

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-3 rounded-[28px] border border-border/70 bg-white/70 p-2 shadow-sm dark:bg-white/5">
          {paymentsNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app/payments"}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground",
                  isActive && "bg-[#0A3D2E] text-[#F5F0E8]",
                )
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

export function PaymentsOverviewPage() {
  const { locale } = useI18n();
  const { data } = usePaymentsHistory({ page: 1, limit: 6, type: "all" });
  const history = data?.data ?? seededPaymentHistory.slice(0, 6);

  const metrics = useMemo(() => {
    const totalValue = history.reduce((sum, item) => sum + item.amount, 0);
    const successCount = history.filter((item) => item.status === "completed").length;
    const crossBorderCount = history.filter((item) => item.channel === "international").length;
    const bulkCount = history.filter((item) => item.channel === "bulk").length;

    return [
      {
        label: "Processed value",
        value: formatMoney(totalValue, "NGN", locale),
        tone: "positive" as const,
      },
      {
        label: "Success rate",
        value: `${Math.round((successCount / Math.max(history.length, 1)) * 100)}%`,
        tone: "info" as const,
      },
      {
        label: "Cross-border flows",
        value: `${crossBorderCount}`,
        tone: "warning" as const,
      },
      {
        label: "Bulk batches",
        value: `${bulkCount}`,
        tone: "neutral" as const,
      },
    ];
  }, [history, locale]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardContent className="p-6">
              <Badge tone={metric.tone}>{metric.label}</Badge>
              <p className="mt-4 font-display text-3xl ">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {paymentHubCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} to={card.to}>
              <Card className="h-full rounded-[28px] border-primary/10 bg-white/85 transition hover:-translate-y-1 hover:border-[#C9A84C]/40 dark:bg-white/5">
                <CardHeader>
                  <div className="rounded-2xl bg-[#0A3D2E] p-3 text-[#F5F0E8]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge tone="info">{card.badge}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardTitle className="text-2xl">{card.title}</CardTitle>
                  <CardDescription className="leading-6">{card.description}</CardDescription>
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-[#0A3D2E]">
                    Launch workflow
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader>
          <div>
            <CardTitle className="text-2xl">Recent payment activity</CardTitle>
            <CardDescription>Latest posted and pending items across all payment channels.</CardDescription>
          </div>
          <Link
            to="/app/payments/history"
            className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-medium transition hover:bg-surface-50"
          >
            Open full history
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3 pr-4">Description</th>
                <th className="pb-3 pr-4">Channel</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b border-border/60">
                  <td className="py-4 pr-4 font-medium">{item.reference}</td>
                  <td className="py-4 pr-4">{item.description}</td>
                  <td className="py-4 pr-4 capitalize">{item.channel}</td>
                  <td className="py-4 pr-4">{formatMoney(item.amount, item.currency, locale)}</td>
                  <td className="py-4 pr-4">
                    <Badge tone={item.status === "completed" ? "positive" : item.status === "pending" ? "warning" : "danger"}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-4">{formatDate(item.initiatedAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export function PaymentsTransferPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const user = useAuthStore((state) => state.user);
  const market = useAppStore((state) => state.market);
  const effectiveMarket = getEffectiveMarket(market, user?.market);
  const nameEnquiry = useNameEnquiryMutation();
  const transfer = useTransferMutation();
  const [step, setStep] = useState(1);
  const [lookupError, setLookupError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [success, setSuccess] = useState<TransferResponse["data"] | null>(null);
  const [lookupResult, setLookupResult] = useState<NameEnquiryResponse["data"] | null>(null);
  const [form, setForm] = useState({
    transferType: "own_account" as TransferType,
    sourceAccountId: accounts[0].id,
    ownDestinationId: accounts[1].id,
    accountNumber: "",
    bankCode: "",
    bankName: "",
    beneficiaryName: "",
    beneficiaryBankName: "",
    amount: "",
    sourceCurrency: "NGN" as CurrencyCode,
    targetCurrency: "NGN" as CurrencyCode,
    narration: "",
    pin: "",
    scheduleMode: "now" as "now" | "scheduled",
    scheduledFor: "",
    iban: "",
    swiftCode: "",
    beneficiaryCountry: "United States",
    correspondentBank: "",
  });

  const availableBanks = useMemo(() => getBanksForMarket(effectiveMarket), [effectiveMarket]);
  const fxPreview = useMemo(
    () => buildFxPreview(Number(form.amount), form.sourceCurrency, form.targetCurrency),
    [form.amount, form.sourceCurrency, form.targetCurrency],
  );

  useEffect(() => {
    const selectedAccount = accounts.find((account) => account.id === form.sourceAccountId);
    if (selectedAccount) {
      setForm((current) => ({
        ...current,
        sourceCurrency: selectedAccount.currency,
        targetCurrency: current.transferType === "international" ? current.targetCurrency : selectedAccount.currency,
      }));
    }
  }, [form.sourceAccountId, form.transferType]);

  const targetAccount =
    form.transferType === "own_account"
      ? accounts.find((account) => account.id === form.ownDestinationId)
      : null;

  async function handleLookup() {
    setLookupError("");
    setLookupResult(null);

    if (!form.accountNumber && form.transferType !== "own_account") {
      setLookupError("Enter an account number before running name enquiry.");
      return;
    }

    const start = Date.now();

    try {
      const response = await nameEnquiry.mutateAsync({
        market: effectiveMarket,
        accountNumber: form.transferType === "own_account" ? targetAccount?.accountNumber ?? "" : form.accountNumber,
        bankCode: form.bankCode,
        bankName: form.bankName,
        transferType: form.transferType,
      });

      const elapsed = Date.now() - start;
      if (elapsed < 1500) {
        await wait(1500 - elapsed);
      }

      setLookupResult(response.data);
      setForm((current) => ({
        ...current,
        beneficiaryName:
          current.transferType === "own_account"
            ? "Your linked PanAfrika account"
            : response.data.accountName,
        bankName: response.data.bankName,
        correspondentBank: response.data.correspondentBank ?? current.correspondentBank,
      }));
    } catch (error) {
      const elapsed = Date.now() - start;
      if (elapsed < 1500) {
        await wait(1500 - elapsed);
      }
      setLookupError(error instanceof Error ? error.message : "Unable to complete name enquiry.");
    }
  }

  function validateCurrentStep() {
    if (step === 1) {
      if (!form.sourceAccountId) {
        return "Select a debit account.";
      }

      if (form.transferType === "own_account" && !form.ownDestinationId) {
        return "Choose a destination account.";
      }

      if (form.transferType !== "own_account" && !form.accountNumber) {
        return "Enter the beneficiary account number.";
      }

      if (form.transferType === "international" && (!form.swiftCode || !form.beneficiaryCountry || !form.beneficiaryBankName)) {
        return "Complete beneficiary bank and SWIFT details for international transfers.";
      }

      if (form.transferType !== "own_account" && !form.beneficiaryName) {
        return "Run name enquiry to confirm the beneficiary.";
      }
    }

    if (step === 2) {
      if (!Number(form.amount) || Number(form.amount) <= 0) {
        return "Enter a valid transfer amount.";
      }

      if (!/^\d{4}$/.test(form.pin)) {
        return "Enter any 4-digit transaction PIN.";
      }

      if (form.narration.length > 100) {
        return "Narration must not exceed 100 characters.";
      }

      if (form.scheduleMode === "scheduled" && !form.scheduledFor) {
        return "Choose a future date and time for the scheduled transfer.";
      }
    }

    return "";
  }

  async function handleConfirm() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setSubmissionError(validationError);
      return;
    }

    setSubmissionError("");
    const start = Date.now();

    try {
      const response = await transfer.mutateAsync({
        market: effectiveMarket,
        transferType: form.transferType,
        sourceAccountId: form.sourceAccountId,
        beneficiaryName:
          form.transferType === "own_account"
            ? targetAccount?.type ?? "Own account"
            : form.beneficiaryName,
        accountNumber:
          form.transferType === "own_account"
            ? targetAccount?.accountNumber ?? ""
            : form.accountNumber,
        bankCode: form.bankCode,
        bankName:
          form.transferType === "own_account"
            ? "PanAfrika Bank"
            : form.bankName || form.beneficiaryBankName,
        beneficiaryBankName: form.beneficiaryBankName,
        amount: Number(form.amount),
        sourceCurrency: form.sourceCurrency,
        targetCurrency: form.targetCurrency,
        narration: form.narration,
        pin: form.pin,
        scheduleMode: form.scheduleMode,
        scheduledFor: form.scheduleMode === "scheduled" ? form.scheduledFor : undefined,
        iban: form.iban,
        swiftCode: form.swiftCode,
        beneficiaryCountry: form.beneficiaryCountry,
        correspondentBank: form.correspondentBank,
      });

      const elapsed = Date.now() - start;
      if (elapsed < 2000) {
        await wait(2000 - elapsed);
      }

      setSuccess(response.data);
    } catch (error) {
      const elapsed = Date.now() - start;
      if (elapsed < 2000) {
        await wait(2000 - elapsed);
      }
      setSubmissionError(error instanceof Error ? error.message : "Unable to send transfer.");
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <ReceiptCard
          title="Transfer successful"
          subtitle="Receipt ready for download or sharing."
          onDownload={() => undefined}
          details={[
            { label: "Transaction reference", value: success.reference },
            { label: "Status", value: success.status },
            { label: "Beneficiary", value: success.beneficiaryName },
            { label: "Bank", value: success.bankName },
            { label: "Account", value: success.accountNumber },
            { label: "Amount", value: formatMoney(success.amount, success.sourceCurrency, locale) },
            {
              label: "Recipient receives",
              value: success.fxPreview
                ? formatMoney(success.fxPreview.receiveAmount, success.targetCurrency, locale)
                : formatMoney(success.amount, success.targetCurrency, locale),
            },
            { label: "Narration", value: success.narration || "Not provided" },
            { label: "Timestamp", value: formatDate(success.timestamp, locale) },
          ]}
        />

        <div className="flex flex-wrap gap-3">
          <Button
            className="rounded-full"
            onClick={() => {
              setSuccess(null);
              setStep(1);
              setLookupResult(null);
              setSubmissionError("");
            }}
          >
            Transfer Again
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/app")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-5">
          <SectionHeading
            title="Funds transfer wizard"
            description="Simulate own-account, PanAfrika, interbank, and international transfers with name enquiry and FX previews."
          />
          <div className="grid w-full gap-3 md:grid-cols-3">
            {stepLabels.map((label, index) => (
              <div
                key={label}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm font-medium",
                  step === index + 1
                    ? "border-[#0A3D2E] bg-[#0A3D2E] text-[#F5F0E8]"
                    : "border-border bg-secondary/20 text-muted-foreground",
                )}
              >
                {index + 1}. {label}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {transferTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setForm((current) => ({
                        ...current,
                        transferType: option.value,
                        targetCurrency: option.value === "international" ? "USD" : current.sourceCurrency,
                        beneficiaryName: "",
                        bankCode: "",
                        bankName: "",
                        accountNumber: "",
                      }));
                      setLookupResult(null);
                      setLookupError("");
                    }}
                    className={cn(
                      "rounded-[24px] border p-4 text-left transition",
                      form.transferType === option.value
                        ? "border-[#0A3D2E] bg-[#0A3D2E] text-[#F5F0E8]"
                        : "border-border bg-secondary/20 hover:border-[#C9A84C]/40",
                    )}
                  >
                    <p className="font-medium">{option.label}</p>
                    <p className="mt-2 text-sm opacity-80">{option.description}</p>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Debit account">
                  <Select
                    value={form.sourceAccountId}
                    onChange={(event) => setForm((current) => ({ ...current, sourceAccountId: event.target.value }))}
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.type} · {maskAccountNumber(account.accountNumber)} · {account.currency}
                      </option>
                    ))}
                  </Select>
                </Field>

                {form.transferType === "own_account" ? (
                  <Field label="Destination account">
                    <Select
                      value={form.ownDestinationId}
                      onChange={(event) => setForm((current) => ({ ...current, ownDestinationId: event.target.value }))}
                    >
                      {accounts
                        .filter((account) => account.id !== form.sourceAccountId)
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.type} · {maskAccountNumber(account.accountNumber)} · {account.currency}
                          </option>
                        ))}
                    </Select>
                  </Field>
                ) : null}

                {form.transferType === "other_bank" ? (
                  <Field label="Destination bank">
                    <Select
                      value={form.bankCode}
                      onChange={(event) => {
                        const bank = availableBanks.find((entry) => entry.code === event.target.value);
                        setForm((current) => ({
                          ...current,
                          bankCode: event.target.value,
                          bankName: bank?.name ?? "",
                        }));
                      }}
                    >
                      <option value="">Select bank</option>
                      {availableBanks.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}

                {form.transferType === "international" ? (
                  <Field label="Beneficiary bank country">
                    <Select
                      value={form.beneficiaryCountry}
                      onChange={(event) => {
                        const selectedCountry = swiftCountries.find((entry) => entry.country === event.target.value);
                        setForm((current) => ({
                          ...current,
                          beneficiaryCountry: event.target.value,
                          targetCurrency: (selectedCountry?.currency ?? "USD") as CurrencyCode,
                          beneficiaryBankName: selectedCountry?.bankName ?? "",
                          swiftCode: selectedCountry?.swiftCode ?? "",
                          correspondentBank: selectedCountry?.correspondentBank ?? "",
                        }));
                      }}
                    >
                      {swiftCountries.map((entry) => (
                        <option key={entry.country} value={entry.country}>
                          {entry.country} · {entry.currency}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}

                {form.transferType !== "own_account" ? (
                  <Field label={form.transferType === "international" ? "IBAN / Account number" : "Account number"}>
                    <Input
                      value={form.accountNumber}
                      onChange={(event) => setForm((current) => ({ ...current, accountNumber: event.target.value }))}
                      placeholder={form.transferType === "international" ? "GB29NWBK60161331926819" : "0123456789"}
                    />
                  </Field>
                ) : null}

                {form.transferType === "international" ? (
                  <>
                    <Field label="Beneficiary bank name">
                      <Input
                        value={form.beneficiaryBankName}
                        onChange={(event) => setForm((current) => ({ ...current, beneficiaryBankName: event.target.value }))}
                        placeholder="Barclays London"
                      />
                    </Field>
                    <Field label="SWIFT / BIC">
                      <Input
                        value={form.swiftCode}
                        onChange={(event) => setForm((current) => ({ ...current, swiftCode: event.target.value.toUpperCase() }))}
                        placeholder="BARCGB22"
                      />
                    </Field>
                  </>
                ) : null}
              </div>

              {form.transferType !== "own_account" ? (
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="rounded-full"
                    onClick={() => {
                      void handleLookup();
                    }}
                    disabled={nameEnquiry.isPending}
                  >
                    {nameEnquiry.isPending ? "Looking up..." : "Lookup beneficiary"}
                  </Button>
                  {lookupResult ? (
                    <Badge tone="positive">
                      {lookupResult.accountName}
                    </Badge>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900">
                  Destination account ready: {targetAccount?.type} · {maskAccountNumber(targetAccount?.accountNumber ?? "")}
                </div>
              )}

              {form.transferType === "international" && form.correspondentBank ? (
                <div className="rounded-[24px] border border-[#C9A84C]/40 bg-[#C9A84C]/10 p-4 text-sm">
                  Correspondent bank: <span className="font-medium">{form.correspondentBank}</span>
                </div>
              ) : null}
            </>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Amount">
                  <Input
                    type="number"
                    min="1"
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="0.00"
                  />
                </Field>

                <Field label="Send currency">
                  <Select
                    value={form.sourceCurrency}
                    onChange={(event) => setForm((current) => ({ ...current, sourceCurrency: event.target.value as CurrencyCode }))}
                  >
                    <option value="NGN">NGN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </Select>
                </Field>

                <Field label="Receive currency">
                  <Select
                    value={form.targetCurrency}
                    onChange={(event) => setForm((current) => ({ ...current, targetCurrency: event.target.value as CurrencyCode }))}
                  >
                    <option value="NGN">NGN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </Select>
                </Field>
              </div>

              {fxPreview ? (
                <div className="rounded-[24px] border border-[#C9A84C]/40 bg-[#F5F0E8] p-5">
                  <p className="text-sm font-medium">
                    You send {formatMoney(fxPreview.sendAmount, fxPreview.sendCurrency, locale)} → Recipient gets{" "}
                    {formatMoney(fxPreview.receiveAmount, fxPreview.receiveCurrency, locale)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Exchange rate: 1 {fxPreview.receiveCurrency} = {fxPreview.rate.toLocaleString()} {fxPreview.sendCurrency} | Fee:{" "}
                    {formatMoney(fxPreview.fee, fxPreview.sendCurrency === "NGN" ? "NGN" : fxPreview.sendCurrency, locale)}
                  </p>
                </div>
              ) : null}

              <Field label="Narration">
                <Textarea
                  maxLength={100}
                  value={form.narration}
                  onChange={(event) => setForm((current) => ({ ...current, narration: event.target.value }))}
                  placeholder="Add transfer narration"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Transaction PIN">
                  <Input
                    type="password"
                    maxLength={4}
                    value={form.pin}
                    onChange={(event) => setForm((current) => ({ ...current, pin: event.target.value }))}
                    placeholder="Any 4 digits"
                  />
                </Field>

                <Field label="Schedule">
                  <Select
                    value={form.scheduleMode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        scheduleMode: event.target.value as "now" | "scheduled",
                      }))
                    }
                  >
                    <option value="now">Now</option>
                    <option value="scheduled">Scheduled</option>
                  </Select>
                </Field>
              </div>

              {form.scheduleMode === "scheduled" ? (
                <Field label="Scheduled date and time">
                  <Input
                    type="datetime-local"
                    value={form.scheduledFor}
                    onChange={(event) => setForm((current) => ({ ...current, scheduledFor: event.target.value }))}
                  />
                </Field>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <Card className="rounded-[28px] border-[#0A3D2E]/10 bg-secondary/20">
              <CardContent className="p-6">
                <SummaryRow label="Transfer type" value={form.transferType.replace(/_/g, " ")} />
                <SummaryRow label="Debit account" value={`${accountLabel(form.sourceAccountId)} · ${maskAccountNumber(accounts.find((account) => account.id === form.sourceAccountId)?.accountNumber ?? "")}`} />
                <SummaryRow
                  label="Beneficiary"
                  value={
                    form.transferType === "own_account"
                      ? `${targetAccount?.type ?? "Own account"} · ${maskAccountNumber(targetAccount?.accountNumber ?? "")}`
                      : form.beneficiaryName
                  }
                />
                <SummaryRow
                  label="Destination bank"
                  value={form.transferType === "own_account" ? "PanAfrika Bank" : form.bankName || form.beneficiaryBankName || "PanAfrika Bank"}
                />
                <SummaryRow label="Amount" value={formatMoney(Number(form.amount), form.sourceCurrency, locale)} />
                <SummaryRow
                  label="Recipient gets"
                  value={
                    fxPreview
                      ? formatMoney(fxPreview.receiveAmount, form.targetCurrency, locale)
                      : formatMoney(Number(form.amount), form.targetCurrency, locale)
                  }
                />
                <SummaryRow label="Narration" value={form.narration || "Not provided"} />
                <SummaryRow label="Schedule" value={form.scheduleMode === "now" ? "Now" : form.scheduledFor || "Scheduled"} />
              </CardContent>
            </Card>
          ) : null}

          {lookupError ? <p className="text-sm text-danger">{lookupError}</p> : null}
          {submissionError ? <p className="text-sm text-danger">{submissionError}</p> : null}

          <div className="flex flex-wrap gap-3">
            {step > 1 ? (
              <Button variant="outline" className="rounded-full" onClick={() => setStep((current) => current - 1)}>
                Back
              </Button>
            ) : null}

            {step < 3 ? (
              <Button
                className="rounded-full"
                onClick={() => {
                  const validationError = validateCurrentStep();
                  if (validationError) {
                    setSubmissionError(validationError);
                    return;
                  }
                  setSubmissionError("");
                  setStep((current) => current + 1);
                }}
              >
                Continue
              </Button>
            ) : (
              <Button className="rounded-full" onClick={() => void handleConfirm()} disabled={transfer.isPending}>
                {transfer.isPending ? "Confirming..." : "Confirm & Send"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
        <CardHeader className="flex-col items-start gap-3">
          <CardTitle className="text-2xl text-[#F5F0E8]">Transfer guidance</CardTitle>
          <CardDescription className="text-[#F5F0E8]/70">
            Step through beneficiary setup, amount capture, and review exactly like a retail digital-banking transfer journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-[24px] bg-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#F5F0E8]/60">Available accounts</p>
            <div className="mt-4 space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-2xl border border-white/10 p-4">
                  <p className="font-medium">{account.type}</p>
                  <p className="mt-1 text-sm text-[#F5F0E8]/70">
                    {maskAccountNumber(account.accountNumber)} · {formatMoney(account.availableBalance, account.currency, locale)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] bg-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#F5F0E8]/60">Routing note</p>
            <p className="mt-3 text-sm leading-7 text-[#F5F0E8]/80">
              PanAfrika-to-PanAfrika transfers complete on the internal rail. Other-bank transfers simulate domestic instant payment rails, while cross-border flows show correspondent-bank routing and FX margins before confirmation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BillsWorkflow({
  channel,
  title,
  description,
  defaultCategory,
}: {
  channel: "bill" | "airtime";
  title: string;
  description: string;
  defaultCategory: string;
}) {
  const { locale } = useI18n();
  const user = useAuthStore((state) => state.user);
  const appMarket = useAppStore((state) => state.market);
  const effectiveMarket = getEffectiveMarket(appMarket, user?.market);
  const payment = useBillPaymentMutation();
  const [validationLoading, setValidationLoading] = useState(false);
  const [validatedName, setValidatedName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<BillPaymentResponse["data"] | null>(null);
  const [form, setForm] = useState({
    category: defaultCategory,
    provider: buildProviderOptions(defaultCategory, effectiveMarket)[0] ?? "",
    referenceNumber: "",
    amount: "",
    debitAccountId: accounts[0].id,
    pin: "",
  });

  const providers = useMemo(() => {
    if (channel === "airtime") {
      return buildProviderOptions("Internet", effectiveMarket);
    }

    return buildProviderOptions(form.category, effectiveMarket);
  }, [channel, effectiveMarket, form.category]);

  async function handleValidate() {
    setError("");
    if (!form.referenceNumber) {
      setError("Enter a meter, smartcard, phone, or reference number to validate.");
      return;
    }

    setValidationLoading(true);
    await wait(1200);
    setValidatedName(getMockCustomerName(form.provider || "PanAfrika", form.referenceNumber));
    setValidationLoading(false);
  }

  async function handleSubmit() {
    setError("");
    if (!validatedName) {
      setError("Validate the beneficiary details before continuing.");
      return;
    }
    if (!Number(form.amount) || Number(form.amount) <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    if (!/^\d{4}$/.test(form.pin)) {
      setError("Enter any 4-digit PIN to confirm.");
      return;
    }

    try {
      const response = await payment.mutateAsync({
        market: effectiveMarket,
        channel,
        category: channel === "airtime" ? form.category : form.category,
        provider: form.provider,
        referenceNumber: form.referenceNumber,
        customerName: validatedName,
        debitAccountId: form.debitAccountId,
        amount: Number(form.amount),
        currency: accounts.find((account) => account.id === form.debitAccountId)?.currency ?? "NGN",
        pin: form.pin,
      });
      setSuccess(response.data);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to process payment.");
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <ReceiptCard
          title={`${channel === "airtime" ? "Top-up" : "Bill"} completed`}
          subtitle="Receipt generated in the payments switch emulator."
          details={[
            { label: "Reference", value: success.reference },
            { label: "Provider", value: success.provider },
            { label: "Customer", value: success.customerName },
            { label: "Category", value: success.category },
            { label: "Reference number", value: success.referenceNumber },
            { label: "Amount", value: formatMoney(success.amount, success.currency, locale) },
            { label: "Timestamp", value: formatDate(success.timestamp, locale) },
          ]}
        />

        <Button
          className="rounded-full"
          onClick={() => {
            setSuccess(null);
            setValidatedName("");
            setForm((current) => ({ ...current, referenceNumber: "", amount: "", pin: "" }));
          }}
        >
          Create Another
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-3">
          <SectionHeading title={title} description={description} />
        </CardHeader>
        <CardContent className="space-y-5">
          {channel === "bill" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Category">
                <Select
                  value={form.category}
                  onChange={(event) => {
                    const nextCategory = event.target.value;
                    const nextProviders = buildProviderOptions(nextCategory, effectiveMarket);
                    setForm((current) => ({
                      ...current,
                      category: nextCategory,
                      provider: nextProviders[0] ?? "",
                    }));
                    setValidatedName("");
                  }}
                >
                  {billCategories.map((category) => (
                    <option key={category.category} value={category.category}>
                      {category.category}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Provider">
                <Select
                  value={form.provider}
                  onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}
                >
                  {providers.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Product">
                <Select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                  {airtimeProducts.map((product) => (
                    <option key={product.value} value={product.value}>
                      {product.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Network">
                <Select
                  value={form.provider}
                  onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}
                >
                  {providers.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={channel === "airtime" ? "Phone number" : "Meter / reference number"}>
              <Input
                value={form.referenceNumber}
                onChange={(event) => setForm((current) => ({ ...current, referenceNumber: event.target.value }))}
                placeholder={channel === "airtime" ? "+2348031112290" : "Enter service reference"}
              />
            </Field>

            <Field label="Debit account">
              <Select
                value={form.debitAccountId}
                onChange={(event) => setForm((current) => ({ ...current, debitAccountId: event.target.value }))}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.type} · {maskAccountNumber(account.accountNumber)} · {account.currency}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="rounded-full" onClick={() => void handleValidate()} disabled={validationLoading}>
              {validationLoading ? "Validating..." : "Validate"}
            </Button>
            {validatedName ? <Badge tone="positive">{validatedName}</Badge> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Amount">
              <Input
                type="number"
                min="1"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0.00"
              />
            </Field>
            <Field label="Confirm PIN">
              <Input
                type="password"
                maxLength={4}
                value={form.pin}
                onChange={(event) => setForm((current) => ({ ...current, pin: event.target.value }))}
                placeholder="Any 4 digits"
              />
            </Field>
          </div>

          {channel === "airtime" ? (
            <div className="flex flex-wrap gap-3">
              {[1000, 2500, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="rounded-full border border-border px-4 py-2 text-sm transition hover:border-primary/40"
                  onClick={() => setForm((current) => ({ ...current, amount: String(preset) }))}
                >
                  {formatMoney(preset, "NGN", locale)}
                </button>
              ))}
            </div>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <Button className="rounded-full" onClick={() => void handleSubmit()} disabled={payment.isPending}>
            {payment.isPending ? "Processing..." : channel === "airtime" ? "Confirm Top-up" : "Pay Bill"}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
        <CardHeader className="flex-col items-start gap-3">
          <CardTitle className="text-2xl text-[#F5F0E8]">Operational notes</CardTitle>
          <CardDescription className="text-[#F5F0E8]/70">
            Validation simulates external provider lookups before the payment switch books the debit to the source account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-[#F5F0E8]/80">
          <div className="rounded-[24px] bg-white/10 p-4">
            <p className="font-medium">Primary market</p>
            <p className="mt-2">{effectiveMarket}</p>
          </div>
          <div className="rounded-[24px] bg-white/10 p-4">
            <p className="font-medium">Validation service</p>
            <p className="mt-2">Mock provider lookup returns a beneficiary name after a short delay.</p>
          </div>
          <div className="rounded-[24px] bg-white/10 p-4">
            <p className="font-medium">Settlement posture</p>
            <p className="mt-2">All bill and top-up requests settle immediately inside the emulator and append to payment history.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PaymentsBillsPage() {
  return (
    <BillsWorkflow
      channel="bill"
      title="Bills payment"
      description="Pay utilities, TV subscriptions, school fees, and government levies with reference validation and immediate confirmation."
      defaultCategory="Electricity"
    />
  );
}

export function PaymentsAirtimePage() {
  return (
    <BillsWorkflow
      channel="airtime"
      title="Airtime and data top-up"
      description="Simulate airtime and data bundle top-ups across the telco footprint of PanAfrika Bank markets."
      defaultCategory="Airtime"
    />
  );
}

export function PaymentsBulkPage() {
  const { locale } = useI18n();
  const user = useAuthStore((state) => state.user);
  const appMarket = useAppStore((state) => state.market);
  const effectiveMarket = getEffectiveMarket(appMarket, user?.market);
  const bulkPayment = useBulkPaymentMutation();
  const [rows, setRows] = useState<BulkPaymentRowPreview[]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BulkPaymentResponse["data"] | null>(null);
  const [debitAccountId, setDebitAccountId] = useState(accounts[0].id);

  function handleTemplateDownload() {
    const blob = new Blob(["account_number,amount,narration\n0234567891,25000,March vendor payout"], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "panafrika-bulk-template.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function handleFileUpload(file: File) {
    setError("");
    const text = await file.text();
    const parsedRows = parseCsv(text);
    setRows(parsedRows);
    setResult(null);
  }

  async function handleProcess() {
    setError("");
    if (!rows.length) {
      setError("Upload a CSV file before processing.");
      return;
    }

    const validRows = rows.filter((row) => row.validationStatus === "valid");
    if (!validRows.length) {
      setError("No valid rows were found in the CSV file.");
      return;
    }

    setProgress(10);
    const interval = window.setInterval(() => {
      setProgress((current) => (current >= 90 ? current : current + 12));
    }, 250);

    try {
      const response = await bulkPayment.mutateAsync({
        market: effectiveMarket,
        debitAccountId,
        rows: validRows,
      });
      window.clearInterval(interval);
      setProgress(100);
      setResult(response.data);
    } catch (processingError) {
      window.clearInterval(interval);
      setProgress(0);
      setError(processingError instanceof Error ? processingError.message : "Unable to process bulk file.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading
              title="Bulk payments"
              description="Upload beneficiary batches, validate row structures, and process each instruction through the emulator switch."
            />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-full" onClick={handleTemplateDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV template
              </Button>

              <Field label="Debit account">
                <Select value={debitAccountId} onChange={(event) => setDebitAccountId(event.target.value)}>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.type} · {maskAccountNumber(account.accountNumber)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-[#0A3D2E]/30 bg-[#F5F0E8] px-6 py-12 text-center">
              <Upload className="h-8 w-8 text-[#0A3D2E]" />
              <p className="mt-4 font-medium">Upload CSV file</p>
              <p className="mt-2 text-sm text-muted-foreground">Accepted columns: account_number, amount, narration</p>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  void handleFileUpload(file);
                }}
              />
            </label>

            {rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="pb-3 pr-4">Row</th>
                      <th className="pb-3 pr-4">Account</th>
                      <th className="pb-3 pr-4">Amount</th>
                      <th className="pb-3 pr-4">Narration</th>
                      <th className="pb-3">Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowNumber} className="border-b border-border/60">
                        <td className="py-4 pr-4">{row.rowNumber}</td>
                        <td className="py-4 pr-4 font-medium">{row.account_number}</td>
                        <td className="py-4 pr-4">{row.amount}</td>
                        <td className="py-4 pr-4">{row.narration}</td>
                        <td className="py-4">
                          <Badge tone={row.validationStatus === "valid" ? "positive" : "danger"}>{row.validationMessage}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {progress > 0 ? <Progress value={progress} className="h-3" /> : null}
            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <Button className="rounded-full" onClick={() => void handleProcess()} disabled={bulkPayment.isPending}>
              {bulkPayment.isPending ? "Processing batch..." : "Process Bulk Payment"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
          <CardHeader className="flex-col items-start gap-3">
            <CardTitle className="text-2xl text-[#F5F0E8]">Batch preview</CardTitle>
            <CardDescription className="text-[#F5F0E8]/70">
              Valid rows will be processed, while invalid rows will be rejected with reasons in the result set.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] bg-white/10 p-4 text-sm">
              <p className="font-medium">Market context</p>
              <p className="mt-2">{effectiveMarket}</p>
            </div>
            <div className="rounded-[24px] bg-white/10 p-4 text-sm">
              <p className="font-medium">Uploaded rows</p>
              <p className="mt-2">{rows.length}</p>
            </div>
            <div className="rounded-[24px] bg-white/10 p-4 text-sm">
              <p className="font-medium">Valid instructions</p>
              <p className="mt-2">{rows.filter((row) => row.validationStatus === "valid").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {result ? (
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader>
            <div>
              <CardTitle className="text-2xl">Bulk payment results</CardTitle>
              <CardDescription>
                Batch reference {result.batchReference} · processed {formatDate(result.processedAt, locale)}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="pb-3 pr-4">Row</th>
                  <th className="pb-3 pr-4">Account</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Reference</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((item) => (
                  <tr key={`${item.rowNumber}-${item.accountNumber}`} className="border-b border-border/60">
                    <td className="py-4 pr-4">{item.rowNumber}</td>
                    <td className="py-4 pr-4 font-medium">{item.accountNumber}</td>
                    <td className="py-4 pr-4">{formatMoney(item.amount, "NGN", locale)}</td>
                    <td className="py-4 pr-4">{item.reference ?? "Rejected"}</td>
                    <td className="py-4">
                      <Badge tone={item.status === "processed" ? "positive" : "danger"}>{item.message}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function PaymentsInternationalPage() {
  const { locale } = useI18n();
  const user = useAuthStore((state) => state.user);
  const appMarket = useAppStore((state) => state.market);
  const effectiveMarket = getEffectiveMarket(appMarket, user?.market);
  const transfer = useTransferMutation();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<TransferResponse["data"] | null>(null);
  const [form, setForm] = useState({
    reference: `TXN${Date.now()}`,
    orderingCustomerName: user?.name ?? "Adaobi Chukwu",
    orderingAddress: "14 Awolowo Road, Ikoyi, Lagos, Nigeria",
    orderingAccount: accounts[2].accountNumber,
    orderingBankName: "PanAfrika Bank Lagos",
    orderingBankSwift: "PABNNGLA",
    correspondentBankName: "Standard Chartered New York",
    correspondentSwift: "SCBLUS33",
    beneficiaryBankName: "Barclays London",
    beneficiaryBankSwift: "BARCGB22",
    beneficiaryBankCountry: "United Kingdom",
    beneficiaryName: "Ayo Fashola",
    beneficiaryAddress: "20 Finsbury Square, London, United Kingdom",
    beneficiaryAccount: "GB29NWBK60161331926819",
    amount: "1000",
    currency: "USD" as CurrencyCode,
    purpose: "Conference travel support",
  });

  const mt103Preview = useMemo(() => buildMt103Preview(form), [form]);

  async function handleSubmit() {
    setError("");
    if (!form.beneficiaryBankSwift || !form.beneficiaryAccount || !form.amount) {
      setError("Complete beneficiary bank and amount fields before sending.");
      return;
    }

    try {
      const response = await transfer.mutateAsync({
        market: effectiveMarket,
        transferType: "international",
        sourceAccountId: accounts[2].id,
        beneficiaryName: form.beneficiaryName,
        accountNumber: form.beneficiaryAccount,
        bankName: form.beneficiaryBankName,
        beneficiaryBankName: form.beneficiaryBankName,
        amount: Number(form.amount),
        sourceCurrency: "USD",
        targetCurrency: form.currency,
        narration: form.purpose,
        pin: "1234",
        scheduleMode: "now",
        swiftCode: form.beneficiaryBankSwift,
        beneficiaryCountry: form.beneficiaryBankCountry,
        correspondentBank: form.correspondentBankName,
      });
      setSuccess(response.data);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to submit SWIFT instruction.");
    }
  }

  if (success) {
    return (
      <ReceiptCard
        title="International payment queued"
        subtitle="SWIFT simulation completed with MT103 trail."
        details={[
          { label: "Reference", value: success.reference },
          { label: "Beneficiary", value: success.beneficiaryName },
          { label: "Beneficiary bank", value: success.bankName },
          { label: "Amount", value: formatMoney(success.amount, success.sourceCurrency, locale) },
          { label: "SWIFT / BIC", value: form.beneficiaryBankSwift },
          { label: "Timestamp", value: formatDate(success.timestamp, locale) },
        ]}
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-4">
          <SectionHeading
            title="Cross-border / SWIFT simulation"
            description="Compose a multi-step MT103-style instruction with ordering, correspondent, and beneficiary legs."
          />
          <div className="grid w-full gap-3 md:grid-cols-5">
            {swiftStepLabels.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index + 1)}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-sm font-medium",
                  step === index + 1 ? "border-[#0A3D2E] bg-[#0A3D2E] text-[#F5F0E8]" : "border-border bg-secondary/20",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 1 ? (
            <>
              <Field label="Ordering customer">
                <Input
                  value={form.orderingCustomerName}
                  onChange={(event) => setForm((current) => ({ ...current, orderingCustomerName: event.target.value }))}
                />
              </Field>
              <Field label="Ordering address">
                <Textarea
                  value={form.orderingAddress}
                  onChange={(event) => setForm((current) => ({ ...current, orderingAddress: event.target.value }))}
                />
              </Field>
              <Field label="Ordering account">
                <Input
                  value={form.orderingAccount}
                  onChange={(event) => setForm((current) => ({ ...current, orderingAccount: event.target.value }))}
                />
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Field label="Ordering bank">
                <Input
                  value={form.orderingBankName}
                  onChange={(event) => setForm((current) => ({ ...current, orderingBankName: event.target.value }))}
                />
              </Field>
              <Field label="Ordering bank SWIFT">
                <Input
                  value={form.orderingBankSwift}
                  onChange={(event) => setForm((current) => ({ ...current, orderingBankSwift: event.target.value.toUpperCase() }))}
                />
              </Field>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Field label="Correspondent bank">
                <Input
                  value={form.correspondentBankName}
                  onChange={(event) => setForm((current) => ({ ...current, correspondentBankName: event.target.value }))}
                />
              </Field>
              <Field label="Correspondent SWIFT">
                <Input
                  value={form.correspondentSwift}
                  onChange={(event) => setForm((current) => ({ ...current, correspondentSwift: event.target.value.toUpperCase() }))}
                />
              </Field>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <Field label="Beneficiary bank">
                <Input
                  value={form.beneficiaryBankName}
                  onChange={(event) => setForm((current) => ({ ...current, beneficiaryBankName: event.target.value }))}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Beneficiary bank SWIFT">
                  <Input
                    value={form.beneficiaryBankSwift}
                    onChange={(event) => setForm((current) => ({ ...current, beneficiaryBankSwift: event.target.value.toUpperCase() }))}
                  />
                </Field>
                <Field label="Beneficiary bank country">
                  <Input
                    value={form.beneficiaryBankCountry}
                    onChange={(event) => setForm((current) => ({ ...current, beneficiaryBankCountry: event.target.value }))}
                  />
                </Field>
              </div>
            </>
          ) : null}

          {step === 5 ? (
            <>
              <Field label="Beneficiary name">
                <Input
                  value={form.beneficiaryName}
                  onChange={(event) => setForm((current) => ({ ...current, beneficiaryName: event.target.value }))}
                />
              </Field>
              <Field label="Beneficiary address">
                <Textarea
                  value={form.beneficiaryAddress}
                  onChange={(event) => setForm((current) => ({ ...current, beneficiaryAddress: event.target.value }))}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Beneficiary account / IBAN">
                  <Input
                    value={form.beneficiaryAccount}
                    onChange={(event) => setForm((current) => ({ ...current, beneficiaryAccount: event.target.value }))}
                  />
                </Field>
                <Field label="Amount">
                  <Input
                    type="number"
                    min="1"
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Currency">
                  <Select
                    value={form.currency}
                    onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value as CurrencyCode }))}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </Select>
                </Field>
                <Field label="Payment purpose">
                  <Input
                    value={form.purpose}
                    onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))}
                  />
                </Field>
              </div>
            </>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            {step > 1 ? (
              <Button variant="outline" className="rounded-full" onClick={() => setStep((current) => current - 1)}>
                Back
              </Button>
            ) : null}
            {step < 5 ? (
              <Button className="rounded-full" onClick={() => setStep((current) => current + 1)}>
                Next
              </Button>
            ) : (
              <Button className="rounded-full" onClick={() => void handleSubmit()} disabled={transfer.isPending}>
                {transfer.isPending ? "Sending MT103..." : "Send SWIFT Instruction"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
        <CardHeader className="flex-col items-start gap-3">
          <CardTitle className="text-2xl text-[#F5F0E8]">MT103 preview</CardTitle>
          <CardDescription className="text-[#F5F0E8]/70">
            Read-only formatted SWIFT message based on the simulated instruction being composed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-[24px] bg-black/20 p-5 text-xs leading-6 text-[#F5F0E8]/90">
            {mt103Preview}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

export function PaymentsHistoryPage() {
  const { locale } = useI18n();
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<PaymentChannel | "all">("all");
  const { data, isLoading, isError, error } = usePaymentsHistory({
    page,
    limit: 8,
    from: from || undefined,
    to: to || undefined,
    type,
  });

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  useEffect(() => {
    setPage(1);
  }, [from, to, type]);

  return (
    <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
      <CardHeader className="flex-col items-start gap-4">
        <SectionHeading
          title="Payments history"
          description="Filter the full payment ledger by period and channel, then page through the emulator payment archive."
        />
        <div className="grid w-full gap-4 md:grid-cols-4">
          <Field label="From">
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </Field>
          <Field label="Type">
            <Select value={type} onChange={(event) => setType(event.target.value as PaymentChannel | "all")}>
              <option value="all">All channels</option>
              <option value="transfer">Transfer</option>
              <option value="bill">Bill</option>
              <option value="airtime">Airtime</option>
              <option value="bulk">Bulk</option>
              <option value="international">International</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button variant="outline" className="rounded-full" onClick={() => { setFrom(""); setTo(""); setType("all"); }}>
              Reset filters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isError ? <p className="text-sm text-danger">{error instanceof Error ? error.message : "Unable to load history."}</p> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3 pr-4">Description</th>
                <th className="pb-3 pr-4">Beneficiary</th>
                <th className="pb-3 pr-4">Channel</th>
                <th className="pb-3 pr-4">Rail</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="py-8 text-sm text-muted-foreground" colSpan={8}>
                    Loading payment history...
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item: PaymentsHistoryItem) => (
                  <tr key={item.id} className="border-b border-border/60">
                    <td className="py-4 pr-4 font-medium">{item.reference}</td>
                    <td className="py-4 pr-4">{item.description}</td>
                    <td className="py-4 pr-4">{item.beneficiary}</td>
                    <td className="py-4 pr-4 capitalize">{item.channel}</td>
                    <td className="py-4 pr-4">{item.rail}</td>
                    <td className="py-4 pr-4">{formatMoney(item.amount, item.currency, locale)}</td>
                    <td className="py-4 pr-4">
                      <Badge tone={item.status === "completed" ? "positive" : item.status === "pending" ? "warning" : "danger"}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-4">{formatDate(item.initiatedAt, locale)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-8 text-sm text-muted-foreground" colSpan={8}>
                    No payments matched the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                className="rounded-full"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
