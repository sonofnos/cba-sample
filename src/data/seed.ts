import type { CurrencyCode, MarketCode } from "@/lib/types";

export interface DashboardSeedAccount {
  id: string;
  type: "Current Account" | "Savings Account" | "Domiciliary USD";
  accountNumber: string;
  currency: CurrencyCode;
  balance: number;
  availableBalance: number;
  market: Exclude<MarketCode, "ALL">;
}

export interface DashboardSeedTransaction {
  id: string;
  date: string;
  description: string;
  type: "debit" | "credit";
  amount: number;
  runningBalance: number;
  status: "completed" | "pending";
  category: "Food" | "Transport" | "Bills" | "Shopping" | "Transfers";
}

export interface DashboardSeedCustomer {
  id: string;
  fullName: string;
  accountNumber: string;
  bvn: string;
  phone: string;
  segment: string;
}

export interface DashboardFxRate {
  id: string;
  pair: string;
  rate: number;
}

export interface DashboardAlert {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
}

export const accounts: DashboardSeedAccount[] = [
  {
    id: "cust-acct-current",
    type: "Current Account",
    accountNumber: "0123456789",
    currency: "NGN",
    balance: 2_450_000,
    availableBalance: 2_430_000,
    market: "NG",
  },
  {
    id: "cust-acct-savings",
    type: "Savings Account",
    accountNumber: "0123456790",
    currency: "NGN",
    balance: 850_000,
    availableBalance: 850_000,
    market: "NG",
  },
  {
    id: "cust-acct-domiciliary",
    type: "Domiciliary USD",
    accountNumber: "0123456791",
    currency: "USD",
    balance: 4_200,
    availableBalance: 4_050,
    market: "NG",
  },
];

export const transactions: DashboardSeedTransaction[] = [
  { id: "txn-001", date: "2026-04-04", description: "Monthly salary credit", type: "credit", amount: 475_000, runningBalance: 2_450_000, status: "completed", category: "Transfers" },
  { id: "txn-002", date: "2026-04-03", description: "Eko Electricity prepaid token", type: "debit", amount: 18_500, runningBalance: 1_975_000, status: "completed", category: "Bills" },
  { id: "txn-003", date: "2026-04-03", description: "POS purchase at Shoprite Lekki", type: "debit", amount: 32_800, runningBalance: 1_993_500, status: "completed", category: "Shopping" },
  { id: "txn-004", date: "2026-04-02", description: "Transfer to Chidinma Okeke", type: "debit", amount: 120_000, runningBalance: 2_026_300, status: "completed", category: "Transfers" },
  { id: "txn-005", date: "2026-04-02", description: "Uber rides Lagos", type: "debit", amount: 9_750, runningBalance: 2_146_300, status: "completed", category: "Transport" },
  { id: "txn-006", date: "2026-04-01", description: "Airtime and data recharge", type: "debit", amount: 7_500, runningBalance: 2_156_050, status: "completed", category: "Bills" },
  { id: "txn-007", date: "2026-04-01", description: "Transfer from Ifeanyi Okafor", type: "credit", amount: 90_000, runningBalance: 2_163_550, status: "completed", category: "Transfers" },
  { id: "txn-008", date: "2026-03-31", description: "Chicken Republic Victoria Island", type: "debit", amount: 11_900, runningBalance: 2_073_550, status: "completed", category: "Food" },
  { id: "txn-009", date: "2026-03-31", description: "DSTV subscription renewal", type: "debit", amount: 24_500, runningBalance: 2_085_450, status: "completed", category: "Bills" },
  { id: "txn-010", date: "2026-03-30", description: "Transfer to landlord", type: "debit", amount: 350_000, runningBalance: 2_109_950, status: "pending", category: "Transfers" },
];

export const customers: DashboardSeedCustomer[] = [
  { id: "cust-001", fullName: "Adaobi Chukwu", accountNumber: "0123456789", bvn: "22345678901", phone: "+2348031112290", segment: "Retail" },
  { id: "cust-002", fullName: "Ifeanyi Okafor", accountNumber: "0123456792", bvn: "22345678902", phone: "+2348031112291", segment: "Retail" },
  { id: "cust-003", fullName: "Ngozi Umeh", accountNumber: "0123456793", bvn: "22345678903", phone: "+2348031112292", segment: "SME" },
  { id: "cust-004", fullName: "Tosin Balogun", accountNumber: "0123456794", bvn: "22345678904", phone: "+2348031112293", segment: "Retail" },
  { id: "cust-005", fullName: "Lerato Khumalo", accountNumber: "0123456795", bvn: "22345678905", phone: "+27821112293", segment: "Corporate" },
  { id: "cust-006", fullName: "Aissatou Ndiaye", accountNumber: "0123456796", bvn: "22345678906", phone: "+22177112293", segment: "SME" },
];

export const fxRates: DashboardFxRate[] = [
  { id: "fx-001", pair: "USD/NGN", rate: 1580 },
  { id: "fx-002", pair: "EUR/NGN", rate: 1710 },
  { id: "fx-003", pair: "GBP/NGN", rate: 2010 },
  { id: "fx-004", pair: "USD/GHS", rate: 15.4 },
  { id: "fx-005", pair: "USD/KES", rate: 130 },
];

export const alerts: DashboardAlert[] = [
  {
    id: "alert-001",
    title: "Large transfer pending review",
    message: "A NGN 350,000 landlord payment is awaiting secondary approval.",
    timestamp: "2 mins ago",
    severity: "warning",
  },
  {
    id: "alert-002",
    title: "FX board refreshed",
    message: "Treasury desk published the latest midday indicative rates.",
    timestamp: "18 mins ago",
    severity: "info",
  },
  {
    id: "alert-003",
    title: "AML escalation raised",
    message: "One sanctions screening case has been escalated to compliance.",
    timestamp: "41 mins ago",
    severity: "critical",
  },
];

export const marketOptions = [
  { code: "NG", label: "Nigeria", flag: "🇳🇬", currency: "NGN" },
  { code: "GH", label: "Ghana", flag: "🇬🇭", currency: "GHS" },
  { code: "KE", label: "Kenya", flag: "🇰🇪", currency: "KES" },
  { code: "ZA", label: "South Africa", flag: "🇿🇦", currency: "ZAR" },
  { code: "SN", label: "Senegal", flag: "🇸🇳", currency: "XOF" },
  { code: "RW", label: "Rwanda", flag: "🇷🇼", currency: "RWF" },
  { code: "ZM", label: "Zambia", flag: "🇿🇲", currency: "ZMW" },
] as const;
