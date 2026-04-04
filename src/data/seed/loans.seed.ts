import { DEMO_CUSTOMER_ID } from "@/data/seed/accounts.seed";
import type { CurrencyCode } from "@/lib/types";

export interface SeedLoan {
  id: string;
  customerId: string;
  product: string;
  principal: number;
  outstanding: number;
  currency: CurrencyCode;
  status: "Performing" | "Review" | "Approved" | "Past Due";
  interestRate: number;
  tenorMonths: number;
  nextDueDate: string;
  collateral: string;
}

export const SEED_LOANS: SeedLoan[] = [
  {
    id: "loan-demo-001",
    customerId: DEMO_CUSTOMER_ID,
    product: "Salary Advance",
    principal: 650_000,
    outstanding: 420_000,
    currency: "NGN",
    status: "Performing",
    interestRate: 22,
    tenorMonths: 12,
    nextDueDate: "2026-04-28T00:00:00Z",
    collateral: "Salary domiciliation",
  },
  {
    id: "loan-demo-002",
    customerId: DEMO_CUSTOMER_ID,
    product: "Travel Credit Line",
    principal: 2_500,
    outstanding: 1_900,
    currency: "USD",
    status: "Review",
    interestRate: 11,
    tenorMonths: 18,
    nextDueDate: "2026-05-03T00:00:00Z",
    collateral: "FX inflow history",
  },
  {
    id: "loan-portfolio-003",
    customerId: "cust-011",
    product: "SME Overdraft",
    principal: 950_000,
    outstanding: 740_000,
    currency: "GHS",
    status: "Approved",
    interestRate: 17,
    tenorMonths: 9,
    nextDueDate: "2026-04-22T00:00:00Z",
    collateral: "Receivables",
  },
  {
    id: "loan-portfolio-004",
    customerId: "cust-014",
    product: "Mobility Asset Finance",
    principal: 6_400_000,
    outstanding: 5_980_000,
    currency: "KES",
    status: "Performing",
    interestRate: 15.5,
    tenorMonths: 24,
    nextDueDate: "2026-05-10T00:00:00Z",
    collateral: "Vehicle logbook",
  },
  {
    id: "loan-portfolio-005",
    customerId: "cust-016",
    product: "Mining Equipment Facility",
    principal: 1_850_000,
    outstanding: 1_530_000,
    currency: "ZAR",
    status: "Past Due",
    interestRate: 13.8,
    tenorMonths: 36,
    nextDueDate: "2026-04-18T00:00:00Z",
    collateral: "Equipment debenture",
  },
  {
    id: "loan-portfolio-006",
    customerId: "cust-018",
    product: "Retail Working Capital",
    principal: 48_000_000,
    outstanding: 31_000_000,
    currency: "XOF",
    status: "Performing",
    interestRate: 12.4,
    tenorMonths: 18,
    nextDueDate: "2026-05-01T00:00:00Z",
    collateral: "Inventory lien",
  },
];
