import type { CurrencyCode } from "@/lib/types";

export type LoanType =
  | "Personal Loan"
  | "Business Loan"
  | "Asset Finance"
  | "Salary Advance"
  | "Mortgage"
  | "SME Credit Line";

export type EmploymentType = "Employed" | "Self-employed" | "Business Owner";
export type CollateralType = "Property" | "Vehicle" | "Fixed Deposit" | "Equipment";

export interface LoanProduct {
  type: LoanType;
  minAmount: number;
  maxAmount: number;
  minTenorMonths: number;
  maxTenorMonths: number;
  rateRange: string;
  baseRate: number;
  currency: CurrencyCode;
  flatRate?: boolean;
  revolving?: boolean;
}

export interface AmortizationRow {
  installmentNumber: number;
  dueDate: string;
  openingBalance: number;
  principal: number;
  interest: number;
  payment: number;
  closingBalance: number;
  status: "paid" | "due" | "upcoming";
}

export interface LoanComputation {
  monthlyRepayment: number;
  totalInterest: number;
  totalRepayment: number;
  effectiveAnnualRate: number;
  amortization: AmortizationRow[];
}

export interface ManagedLoan {
  id: string;
  type: LoanType;
  purpose: string;
  currency: CurrencyCode;
  originalAmount: number;
  disbursedAmount: number;
  outstandingBalance: number;
  interestRate: number;
  tenorMonths: number;
  monthsRemaining: number;
  monthlyRepayment: number;
  nextPaymentDueDate: string;
  disbursedAt: string;
  status: "Active" | "Offer Ready" | "Referred" | "Closed";
  repaymentProgressPercent: number;
  linkedAccountId: string;
  linkedAccountBalance: number;
  offerExpiryDate?: string;
  amortization: AmortizationRow[];
}

export interface LoanApplicationPayload {
  type: LoanType;
  amount: number;
  purpose: string;
  employmentType: EmploymentType;
  employerName: string;
  monthlyIncome: number;
  yearsEmployed: number;
  monthlyExpenses: number;
  existingLoanObligations: number;
  bankStatementsUploaded: boolean;
  collateralType?: CollateralType;
  collateralValue?: number;
  collateralDocumentUploaded?: boolean;
}

export interface LoanOffer {
  applicationId: string;
  decision: "approved" | "referred";
  approvedAmount?: number;
  interestRate?: number;
  tenorMonths?: number;
  monthlyRepayment?: number;
  offerExpiryDate?: string;
  reason?: string;
}

export interface LoanApplicationResponse {
  success: boolean;
  data: LoanOffer;
}

export interface LoanPaymentResponse {
  success: boolean;
  data: {
    loan: ManagedLoan;
    debitedAmount: number;
    remainingAccountBalance: number;
    paymentReference: string;
  };
}

export interface LoanDecisionMutationResponse {
  success: boolean;
  data: ManagedLoan;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function flatLoanSchedule(principal: number, tenorMonths: number, flatRate: number, startDate: string, paidInstallments = 0): LoanComputation {
  const interestPerMonth = (principal * (flatRate / 100)) / tenorMonths;
  const principalPerMonth = principal / tenorMonths;
  const payment = principalPerMonth + interestPerMonth;
  const start = new Date(startDate);
  let outstanding = principal;
  const amortization: AmortizationRow[] = [];

  for (let month = 1; month <= tenorMonths; month += 1) {
    const openingBalance = outstanding;
    const principalComponent = month === tenorMonths ? outstanding : principalPerMonth;
    outstanding = Math.max(0, outstanding - principalComponent);

    amortization.push({
      installmentNumber: month,
      dueDate: addMonths(start, month).toISOString(),
      openingBalance,
      principal: principalComponent,
      interest: interestPerMonth,
      payment,
      closingBalance: outstanding,
      status: month <= paidInstallments ? "paid" : month === paidInstallments + 1 ? "due" : "upcoming",
    });
  }

  const totalInterest = interestPerMonth * tenorMonths;

  return {
    monthlyRepayment: payment,
    totalInterest,
    totalRepayment: principal + totalInterest,
    effectiveAnnualRate: flatRate * 12,
    amortization,
  };
}

export function calculateLoan(principal: number, annualRate: number, tenorMonths: number, startDate = new Date().toISOString(), paidInstallments = 0, flatRate = false): LoanComputation {
  if (principal <= 0 || tenorMonths <= 0) {
    return {
      monthlyRepayment: 0,
      totalInterest: 0,
      totalRepayment: 0,
      effectiveAnnualRate: 0,
      amortization: [],
    };
  }

  if (flatRate) {
    return flatLoanSchedule(principal, tenorMonths, annualRate, startDate, paidInstallments);
  }

  const monthlyRate = annualRate / 100 / 12;
  const payment =
    monthlyRate === 0
      ? principal / tenorMonths
      : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -tenorMonths));
  const start = new Date(startDate);
  let balance = principal;
  let totalInterest = 0;
  const amortization: AmortizationRow[] = [];

  for (let month = 1; month <= tenorMonths; month += 1) {
    const openingBalance = balance;
    const interest = openingBalance * monthlyRate;
    let principalPaid = payment - interest;

    if (month === tenorMonths) {
      principalPaid = openingBalance;
    }

    balance = Math.max(0, openingBalance - principalPaid);
    totalInterest += interest;

    amortization.push({
      installmentNumber: month,
      dueDate: addMonths(start, month).toISOString(),
      openingBalance,
      principal: principalPaid,
      interest,
      payment: principalPaid + interest,
      closingBalance: balance,
      status: month <= paidInstallments ? "paid" : month === paidInstallments + 1 ? "due" : "upcoming",
    });
  }

  return {
    monthlyRepayment: payment,
    totalInterest,
    totalRepayment: principal + totalInterest,
    effectiveAnnualRate: Math.pow(1 + monthlyRate, 12) * 100 - 100,
    amortization,
  };
}

export function calculateDebtToIncomeRatio(monthlyIncome: number, monthlyExpenses: number, existingLoanObligations: number) {
  if (monthlyIncome <= 0) {
    return 0;
  }

  return ((monthlyExpenses + existingLoanObligations) / monthlyIncome) * 100;
}
