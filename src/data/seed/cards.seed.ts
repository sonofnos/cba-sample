import { SEED_ACCOUNTS } from "@/data/seed/accounts.seed";
import type { CurrencyCode } from "@/lib/types";

export interface SeedCard {
  id: string;
  customerId: string;
  accountId: string;
  accountNumber: string;
  cardType: "Debit" | "Virtual";
  network: "Verve" | "Visa" | "Mastercard";
  currency: CurrencyCode;
  maskedPan: string;
  status: "Active" | "Blocked" | "Expired";
  expiryMonth: string;
  expiryYear: string;
  spendLimit: number;
}

export const SEED_CARDS: SeedCard[] = [
  {
    id: "card-001",
    customerId: SEED_ACCOUNTS[0].customerId,
    accountId: SEED_ACCOUNTS[0].id,
    accountNumber: SEED_ACCOUNTS[0].accountNumber,
    cardType: "Debit",
    network: "Verve",
    currency: "NGN",
    maskedPan: "5061 2400 1144 8890",
    status: "Active",
    expiryMonth: "08",
    expiryYear: "28",
    spendLimit: 500_000,
  },
  {
    id: "card-002",
    customerId: SEED_ACCOUNTS[0].customerId,
    accountId: SEED_ACCOUNTS[1].id,
    accountNumber: SEED_ACCOUNTS[1].accountNumber,
    cardType: "Debit",
    network: "Visa",
    currency: "NGN",
    maskedPan: "4120 99XX XXXX 1022",
    status: "Active",
    expiryMonth: "03",
    expiryYear: "29",
    spendLimit: 250_000,
  },
  {
    id: "card-003",
    customerId: SEED_ACCOUNTS[0].customerId,
    accountId: SEED_ACCOUNTS[2].id,
    accountNumber: SEED_ACCOUNTS[2].accountNumber,
    cardType: "Virtual",
    network: "Mastercard",
    currency: "USD",
    maskedPan: "5355 77XX XXXX 4412",
    status: "Blocked",
    expiryMonth: "11",
    expiryYear: "27",
    spendLimit: 1_500,
  },
];
