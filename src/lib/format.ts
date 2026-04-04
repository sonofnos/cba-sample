import type { CurrencyCode, Locale } from "@/lib/types";

const localeMap: Record<Locale, string> = {
  en: "en-GB",
  fr: "fr-FR",
};

export function formatCurrency(value: number, currency: CurrencyCode, locale: Locale) {
  return new Intl.NumberFormat(localeMap[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(localeMap[locale], {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(localeMap[locale], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatPercent(value: number, locale: Locale) {
  return new Intl.NumberFormat(localeMap[locale], {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / 100);
}
