import { accounts } from "@/data/seed";
import { calculateLoan } from "@/lib/loans";
import type { LoanProduct, ManagedLoan } from "@/lib/loans";

export const loanProducts: LoanProduct[] = [
  {
    type: "Personal Loan",
    minAmount: 50_000,
    maxAmount: 5_000_000,
    minTenorMonths: 3,
    maxTenorMonths: 36,
    rateRange: "24% p.a.",
    baseRate: 24,
    currency: "NGN",
  },
  {
    type: "Business Loan",
    minAmount: 500_000,
    maxAmount: 50_000_000,
    minTenorMonths: 6,
    maxTenorMonths: 60,
    rateRange: "18–22% p.a.",
    baseRate: 20,
    currency: "NGN",
  },
  {
    type: "Asset Finance",
    minAmount: 1_000_000,
    maxAmount: 100_000_000,
    minTenorMonths: 12,
    maxTenorMonths: 84,
    rateRange: "16–20% p.a.",
    baseRate: 18,
    currency: "NGN",
  },
  {
    type: "Salary Advance",
    minAmount: 50_000,
    maxAmount: 3_000_000,
    minTenorMonths: 1,
    maxTenorMonths: 3,
    rateRange: "4% flat",
    baseRate: 4,
    currency: "NGN",
    flatRate: true,
  },
  {
    type: "Mortgage",
    minAmount: 5_000_000,
    maxAmount: 500_000_000,
    minTenorMonths: 60,
    maxTenorMonths: 300,
    rateRange: "12–15% p.a.",
    baseRate: 13.5,
    currency: "NGN",
  },
  {
    type: "SME Credit Line",
    minAmount: 500_000,
    maxAmount: 100_000_000,
    minTenorMonths: 12,
    maxTenorMonths: 12,
    rateRange: "Prime + 3%",
    baseRate: 21,
    currency: "NGN",
    revolving: true,
  },
];

const activeLoanSchedule = calculateLoan(2_000_000, 24, 24, "2025-10-04T00:00:00Z", 6);

export const seededLoans: ManagedLoan[] = [
  {
    id: "loan-ngn-personal-2000",
    type: "Personal Loan",
    purpose: "Home improvement and family support",
    currency: "NGN",
    originalAmount: 2_000_000,
    disbursedAmount: 2_000_000,
    outstandingBalance: Number(activeLoanSchedule.amortization[5].closingBalance.toFixed(2)),
    interestRate: 24,
    tenorMonths: 24,
    monthsRemaining: 18,
    monthlyRepayment: 104_000,
    nextPaymentDueDate: "2026-04-28T00:00:00Z",
    disbursedAt: "2025-10-04T00:00:00Z",
    status: "Active",
    repaymentProgressPercent: 25,
    linkedAccountId: accounts[0].id,
    linkedAccountBalance: accounts[0].availableBalance,
    amortization: activeLoanSchedule.amortization.map((row) => ({
      ...row,
      payment: row.installmentNumber <= 6 ? 104_000 : row.payment,
    })),
  },
];

export const loanHighlights = [
  { label: "Loan ID", value: "loan-ngn-personal-2000" },
  { label: "Original amount", value: "NGN 2,000,000" },
  { label: "Monthly repayment", value: "NGN 104,000" },
  { label: "Months remaining", value: "18" },
];
