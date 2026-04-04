import { useMemo } from "react";
import { t } from "@/lib/translations";
import { useAppStore } from "@/store/app-store";

export function useI18n() {
  const locale = useAppStore((state) => state.locale);

  return useMemo(
    () => ({
      locale,
      t: (key: string) => t(locale, key),
    }),
    [locale],
  );
}
