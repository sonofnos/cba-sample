export type Locale = "en" | "fr";
export type MarketCode = "ALL" | "NG" | "GH" | "KE" | "ZA" | "SN" | "RW" | "ZM";
export type AuthRole = "customer" | "teller" | "compliance" | "admin";
export type CurrencyCode =
  | "NGN"
  | "GHS"
  | "KES"
  | "ZAR"
  | "XOF"
  | "RWF"
  | "ZMW"
  | "USD"
  | "EUR"
  | "GBP";

export type KycStatus = "Verified" | "Pending" | "Enhanced Review";
export type AccountStatus = "Active" | "Dormant" | "Watchlist";
export type PaymentStatus = "Completed" | "Pending" | "Flagged";
export type PaymentRail = "RTGS" | "SWIFT" | "Instant" | "ACH";
export type LoanStatus = "Disbursed" | "Review" | "Approved";
export type AlertStatus = "Open" | "Investigating" | "Cleared";
export type AlertSeverity = "Low" | "Medium" | "High";

export interface AppUser {
  id: string;
  name: string;
  role: string;
  market: MarketCode;
  team: string;
}

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: AuthRole;
  market: Exclude<MarketCode, "ALL">;
  currency: CurrencyCode;
}

export interface AuthTokenPayload {
  role: AuthRole;
  userId: string;
  name: string;
  market: Exclude<MarketCode, "ALL">;
  currency: CurrencyCode;
}

export interface Market {
  code: Exclude<MarketCode, "ALL">;
  name: string;
  region: string;
  regulator: string;
  currency: CurrencyCode;
  accent: string;
  language: Locale;
}

export interface Branch {
  id: string;
  market: Exclude<MarketCode, "ALL">;
  name: string;
  city: string;
  code: string;
  customers: number;
}

export interface Customer {
  id: string;
  market: Exclude<MarketCode, "ALL">;
  name: string;
  segment: "Retail" | "SME" | "Corporate" | "Institutional";
  riskScore: number;
  kycStatus: KycStatus;
  onboardingDate: string;
  relationshipManager: string;
  country: string;
}

export interface Account {
  id: string;
  customerId: string;
  market: Exclude<MarketCode, "ALL">;
  name: string;
  type: "Current" | "Savings" | "Domiciliary" | "Treasury";
  currency: CurrencyCode;
  balance: number;
  availableBalance: number;
  status: AccountStatus;
  branchId: string;
  ibanLike: string;
}

export interface Payment {
  id: string;
  market: Exclude<MarketCode, "ALL">;
  customerId: string;
  debitAccountId: string;
  creditAccount: string;
  beneficiary: string;
  amount: number;
  currency: CurrencyCode;
  corridor: string;
  rail: PaymentRail;
  status: PaymentStatus;
  initiatedAt: string;
  narrative: string;
}

export interface Loan {
  id: string;
  market: Exclude<MarketCode, "ALL">;
  customerId: string;
  product: string;
  amount: number;
  currency: CurrencyCode;
  status: LoanStatus;
  sector: string;
  tenorMonths: number;
  stage: "Stage 1" | "Stage 2";
  approvalRatio: number;
}

export interface ComplianceAlert {
  id: string;
  market: Exclude<MarketCode, "ALL">;
  customerId: string;
  severity: AlertSeverity;
  scenario: string;
  regulator: string;
  status: AlertStatus;
  openedAt: string;
}

export interface TreasuryPosition {
  id: string;
  market: Exclude<MarketCode, "ALL">;
  currency: CurrencyCode;
  nostroBalance: number;
  intradayLimit: number;
  utilization: number;
  rateToUsd: number;
  dailyChange: number;
}

export interface OperationalIncident {
  id: string;
  market: Exclude<MarketCode, "ALL">;
  title: string;
  queue: string;
  priority: "P1" | "P2" | "P3";
  status: "Open" | "Monitoring" | "Resolved";
  updatedAt: string;
}

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  delta: string;
  tone: "positive" | "neutral" | "attention";
}

export interface TrendPoint {
  label: string;
  deposits: number;
  payments: number;
  loans: number;
}

export interface MarketPerformance {
  market: string;
  deposits: number;
  loans: number;
  customers: number;
  alerts: number;
  nplRatio: number;
}

export interface PaymentMixPoint {
  name: string;
  value: number;
}

export interface DashboardPayload {
  metrics: MetricCard[];
  trend: TrendPoint[];
  marketPerformance: MarketPerformance[];
  paymentMix: PaymentMixPoint[];
  fxBoard: TreasuryPosition[];
  incidents: OperationalIncident[];
}

export interface CustomerRecord extends Customer {
  accounts: number;
  totalExposure: number;
}

export interface AccountRecord extends Account {
  customerName: string;
  branchName: string;
}

export interface PaymentRecord extends Payment {
  customerName: string;
}

export interface LoanRecord extends Loan {
  customerName: string;
}

export interface ComplianceAlertRecord extends ComplianceAlert {
  customerName: string;
}

export interface BankDataset {
  user: AppUser;
  markets: Market[];
  branches: Branch[];
  customers: Customer[];
  accounts: Account[];
  payments: Payment[];
  loans: Loan[];
  alerts: ComplianceAlert[];
  treasury: TreasuryPosition[];
  incidents: OperationalIncident[];
}
