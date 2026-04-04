import { authHandlers } from "@/mocks/handlers/auth.handlers";
import { accountsHandlers } from "@/mocks/handlers/accounts.handlers";
import { paymentsHandlers } from "@/mocks/handlers/payments.handlers";
import { cardsHandlers } from "@/mocks/handlers/cards.handlers";
import { loansHandlers } from "@/mocks/handlers/loans.handlers";
import { fxHandlers } from "@/mocks/handlers/fx.handlers";
import { complianceHandlers } from "@/mocks/handlers/compliance.handlers";
import { openBankingHandlers } from "@/mocks/handlers/openbanking.handlers";

export const handlers = [
  ...authHandlers,
  ...accountsHandlers,
  ...paymentsHandlers,
  ...cardsHandlers,
  ...loansHandlers,
  ...fxHandlers,
  ...complianceHandlers,
  ...openBankingHandlers,
];
