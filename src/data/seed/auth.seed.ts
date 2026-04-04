import type { AuthRole, AuthUser } from "@/lib/types";

export interface SeedAuthAccount extends AuthUser {
  password: string;
}

export const SEED_AUTH_ACCOUNTS: SeedAuthAccount[] = [
  {
    userId: "auth-customer-001",
    name: "Adaobi Chukwu",
    email: "customer@panafrika.com",
    password: "Demo1234!",
    role: "customer",
    market: "NG",
    currency: "NGN",
  },
  {
    userId: "auth-teller-001",
    name: "Tosin Balogun",
    email: "teller@panafrika.com",
    password: "Demo1234!",
    role: "teller",
    market: "NG",
    currency: "NGN",
  },
  {
    userId: "auth-compliance-001",
    name: "Aissatou Ndiaye",
    email: "compliance@panafrika.com",
    password: "Demo1234!",
    role: "compliance",
    market: "SN",
    currency: "XOF",
  },
  {
    userId: "auth-admin-001",
    name: "Amaka Okonkwo",
    email: "admin@panafrika.com",
    password: "Demo1234!",
    role: "admin",
    market: "NG",
    currency: "NGN",
  },
];

export const AUTH_ROLE_LABELS: Record<AuthRole, string> = {
  customer: "Customer",
  teller: "Teller",
  compliance: "Compliance",
  admin: "Admin",
};
