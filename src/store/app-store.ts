import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale, MarketCode } from "@/lib/types";

interface AppState {
  locale: Locale;
  market: MarketCode;
  setLocale: (locale: Locale) => void;
  setMarket: (market: MarketCode) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: "en",
      market: "ALL",
      setLocale: (locale) => set({ locale }),
      setMarket: (market) => set({ market }),
    }),
    {
      name: "panafrika-cba",
      partialize: (state) => ({
        locale: state.locale,
        market: state.market,
      }),
    },
  ),
);
