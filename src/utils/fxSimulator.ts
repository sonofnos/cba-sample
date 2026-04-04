import { useCallback, useEffect, useMemo, useState } from "react";
import { fxBasePairs } from "@/data/fx";
import type { CurrencyCode } from "@/lib/types";

export interface SimulatedFxRate {
  pair: string;
  base: CurrencyCode;
  quote: CurrencyCode;
  buy: number;
  sell: number;
  mid: number;
  change: number;
  changePercent: number;
  updatedAt: string;
}

type RatesMap = Record<string, SimulatedFxRate>;

function buildInitialRates(): RatesMap {
  return Object.fromEntries(
    fxBasePairs.map((entry) => {
      const mid = (entry.buy + entry.sell) / 2;
      return [
        entry.pair,
        {
          pair: entry.pair,
          base: entry.base,
          quote: entry.quote,
          buy: entry.buy,
          sell: entry.sell,
          mid,
          change: 0,
          changePercent: 0,
          updatedAt: new Date("2026-04-04T12:00:00Z").toISOString(),
        },
      ];
    }),
  );
}

function invertRate(rate: number) {
  return rate === 0 ? 0 : 1 / rate;
}

export function useFxRates() {
  const [rates, setRates] = useState<RatesMap>(buildInitialRates);
  const [previousRates, setPreviousRates] = useState<RatesMap>(buildInitialRates);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRates((current) => {
        setPreviousRates(current);

        const nextEntries = Object.values(current).map((rate) => {
          const drift = (Math.random() * 0.002 - 0.001);
          const nextMid = rate.mid * (1 + drift);
          const spreadWidth = Math.max(rate.sell - rate.buy, rate.mid * 0.0025);
          const nextBuy = nextMid - spreadWidth / 2;
          const nextSell = nextMid + spreadWidth / 2;

          return [
            rate.pair,
            {
              ...rate,
              mid: Number(nextMid.toFixed(4)),
              buy: Number(nextBuy.toFixed(4)),
              sell: Number(nextSell.toFixed(4)),
              change: Number((nextMid - rate.mid).toFixed(4)),
              changePercent: Number((((nextMid - rate.mid) / rate.mid) * 100).toFixed(3)),
              updatedAt: new Date().toISOString(),
            },
          ] as const;
        });

        return Object.fromEntries(nextEntries);
      });
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  const getRate = useCallback(
    (from: CurrencyCode, to: CurrencyCode) => {
      if (from === to) {
        return 1;
      }

      const direct = rates[`${from}/${to}`];
      if (direct) {
        return direct.sell;
      }

      const inverse = rates[`${to}/${from}`];
      if (inverse) {
        return invertRate(inverse.buy);
      }

      if (from !== "USD" && to !== "USD") {
        const fromToUsd = rates[`USD/${from}`];
        const usdToTo = rates[`USD/${to}`];
        if (fromToUsd && usdToTo) {
          return invertRate(fromToUsd.buy) * usdToTo.sell;
        }
      }

      if (from === "USD") {
        const viaUsd = rates[`USD/${to}`];
        return viaUsd ? viaUsd.sell : 1;
      }

      if (to === "USD") {
        const viaUsd = rates[`USD/${from}`];
        return viaUsd ? invertRate(viaUsd.buy) : 1;
      }

      return 1;
    },
    [rates],
  );

  const convert = useCallback(
    (amount: number, from: CurrencyCode, to: CurrencyCode) => {
      const rate = getRate(from, to);
      return Number((amount * rate).toFixed(2));
    },
    [getRate],
  );

  return useMemo(
    () => ({
      rates,
      previousRates,
      getRate,
      convert,
    }),
    [convert, getRate, previousRates, rates],
  );
}
