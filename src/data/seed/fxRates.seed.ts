import type { CurrencyCode } from "@/lib/types";

export interface SeedFxRate {
  id: string;
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
  buyRate: number;
  sellRate: number;
  midRate: number;
  source: string;
  updatedAt: string;
}

export const SEED_FX_RATES: SeedFxRate[] = [
  { id: "fx-001", baseCurrency: "USD", quoteCurrency: "NGN", buyRate: 1492.5, sellRate: 1504.6, midRate: 1498.55, source: "Treasury Desk Lagos", updatedAt: "2026-04-04T09:15:00Z" },
  { id: "fx-002", baseCurrency: "USD", quoteCurrency: "GHS", buyRate: 14.55, sellRate: 14.83, midRate: 14.69, source: "Treasury Desk Accra", updatedAt: "2026-04-04T09:15:00Z" },
  { id: "fx-003", baseCurrency: "USD", quoteCurrency: "KES", buyRate: 129.1, sellRate: 130.4, midRate: 129.75, source: "Treasury Desk Nairobi", updatedAt: "2026-04-04T09:15:00Z" },
  { id: "fx-004", baseCurrency: "USD", quoteCurrency: "ZAR", buyRate: 18.32, sellRate: 18.69, midRate: 18.51, source: "Treasury Desk Johannesburg", updatedAt: "2026-04-04T09:15:00Z" },
  { id: "fx-005", baseCurrency: "USD", quoteCurrency: "XOF", buyRate: 601.4, sellRate: 608.2, midRate: 604.8, source: "Treasury Desk Dakar", updatedAt: "2026-04-04T09:15:00Z" },
  { id: "fx-006", baseCurrency: "USD", quoteCurrency: "RWF", buyRate: 1279.6, sellRate: 1293.1, midRate: 1286.35, source: "Treasury Desk Kigali", updatedAt: "2026-04-04T09:15:00Z" },
  { id: "fx-007", baseCurrency: "USD", quoteCurrency: "ZMW", buyRate: 25.9, sellRate: 26.45, midRate: 26.18, source: "Treasury Desk Lusaka", updatedAt: "2026-04-04T09:15:00Z" },
  { id: "fx-008", baseCurrency: "EUR", quoteCurrency: "NGN", buyRate: 1614.2, sellRate: 1629.4, midRate: 1621.8, source: "Treasury Desk Lagos", updatedAt: "2026-04-04T09:15:00Z" },
];
