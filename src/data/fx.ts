import type { CurrencyCode } from "@/lib/types";

export interface FxPairSeed {
  pair: string;
  base: CurrencyCode;
  quote: CurrencyCode;
  buy: number;
  sell: number;
}

export const fxBasePairs: FxPairSeed[] = [
  { pair: "USD/NGN", base: "USD", quote: "NGN", buy: 1578, sell: 1582 },
  { pair: "EUR/NGN", base: "EUR", quote: "NGN", buy: 1706, sell: 1714 },
  { pair: "GBP/NGN", base: "GBP", quote: "NGN", buy: 2004, sell: 2016 },
  { pair: "USD/GHS", base: "USD", quote: "GHS", buy: 15.32, sell: 15.48 },
  { pair: "USD/KES", base: "USD", quote: "KES", buy: 129.4, sell: 130.6 },
  { pair: "USD/ZAR", base: "USD", quote: "ZAR", buy: 18.42, sell: 18.66 },
  { pair: "USD/XOF", base: "USD", quote: "XOF", buy: 603.3, sell: 607.8 },
  { pair: "USD/RWF", base: "USD", quote: "RWF", buy: 1282.4, sell: 1291.2 },
  { pair: "USD/ZMW", base: "USD", quote: "ZMW", buy: 26.04, sell: 26.29 },
  { pair: "EUR/USD", base: "EUR", quote: "USD", buy: 1.0842, sell: 1.0874 },
  { pair: "GBP/USD", base: "GBP", quote: "USD", buy: 1.2648, sell: 1.2689 },
];

export const supportedFxCurrencies: CurrencyCode[] = [
  "NGN",
  "GHS",
  "KES",
  "ZAR",
  "XOF",
  "RWF",
  "ZMW",
  "USD",
  "EUR",
  "GBP",
];

export function generateHistoricalSeries(
  pair: string,
  midRate: number,
  days: number,
) {
  const now = new Date("2026-04-04T12:00:00Z");
  const series: Array<{
    label: string;
    rate: number;
    volume: number;
  }> = [];
  let current = midRate * (1 - days * 0.00035);

  for (let index = days; index >= 0; index -= 1) {
    const pointDate = new Date(now);
    pointDate.setDate(now.getDate() - index);

    const drift = Math.sin(index / 3.4) * 0.0024 + Math.cos(index / 5.1) * 0.0013;
    current = current * (1 + drift);

    series.push({
      label: pointDate.toISOString().slice(5, 10),
      rate: Number(current.toFixed(4)),
      volume: Math.round(500 + ((days - index + 1) * 37) % 340 + Math.abs(Math.sin(index)) * 150),
    });
  }

  return series;
}
