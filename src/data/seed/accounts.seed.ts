import type { CurrencyCode } from "@/lib/types";

export interface SeedAccount {
  id: string;
  accountNumber: string;
  type: "Current" | "Savings" | "Domiciliary";
  currency: CurrencyCode;
  balance: number;
  ledgerBalance: number;
  availableBalance: number;
  status: "Active" | "Dormant" | "Restricted";
  openDate: string;
  bvn: string;
  customerId: string;
  branchCode: string;
  interestRate: number;
}

export const DEMO_CUSTOMER_ID = "cust-demo-001";
export const DEMO_CUSTOMER_BVN = "22345678901";

export const SEED_ACCOUNTS: SeedAccount[] = [
  {
    id: "acct-demo-current-ngn",
    accountNumber: "0123456789",
    type: "Current",
    currency: "NGN",
    balance: 2_450_000,
    ledgerBalance: 2_450_000,
    availableBalance: 2_430_000,
    status: "Active",
    openDate: "2023-09-12T09:15:00Z",
    bvn: DEMO_CUSTOMER_BVN,
    customerId: DEMO_CUSTOMER_ID,
    branchCode: "NG001",
    interestRate: 0,
  },
  {
    id: "acct-demo-savings-ngn",
    accountNumber: "2233445566",
    type: "Savings",
    currency: "NGN",
    balance: 850_000,
    ledgerBalance: 850_000,
    availableBalance: 850_000,
    status: "Active",
    openDate: "2024-02-20T11:30:00Z",
    bvn: DEMO_CUSTOMER_BVN,
    customerId: DEMO_CUSTOMER_ID,
    branchCode: "NG001",
    interestRate: 3.5,
  },
  {
    id: "acct-demo-domiciliary-usd",
    accountNumber: "3001122457",
    type: "Domiciliary",
    currency: "USD",
    balance: 4_200,
    ledgerBalance: 4_200,
    availableBalance: 4_050,
    status: "Active",
    openDate: "2024-06-18T14:05:00Z",
    bvn: DEMO_CUSTOMER_BVN,
    customerId: DEMO_CUSTOMER_ID,
    branchCode: "NG001",
    interestRate: 0.25,
  },
];
