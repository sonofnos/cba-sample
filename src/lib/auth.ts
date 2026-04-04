import { SEED_AUTH_ACCOUNTS } from "@/data/seed/auth.seed";
import type { AuthUser, CurrencyCode, MarketCode } from "@/lib/types";

export function authenticateSeedUser(email: string, password: string): AuthUser | null {
  const account = SEED_AUTH_ACCOUNTS.find(
    (entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password,
  );

  if (!account) {
    return null;
  }

  const { password: _password, ...user } = account;
  return user;
}

export function buildRegisteredUser(input: {
  firstName: string;
  lastName: string;
  market: Exclude<MarketCode, "ALL">;
  currency: CurrencyCode;
}): AuthUser {
  return {
    userId: `reg-${Date.now()}`,
    name: `${input.firstName} ${input.lastName}`,
    email: `${input.firstName}.${input.lastName}`.toLowerCase().replace(/\s+/g, "") + "@panafrika.demo",
    role: "customer",
    market: input.market,
    currency: input.currency,
  };
}
