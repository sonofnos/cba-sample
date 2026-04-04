import { seedData } from "@/lib/data";
import { formatCompactNumber, formatCurrency } from "@/lib/format";
import type {
  Account,
  AlertStatus,
  BankDataset,
  CurrencyCode,
  DashboardPayload,
  Loan,
  LoanStatus,
  MarketCode,
  OperationalIncident,
  Payment,
} from "@/lib/types";
import { SEED_ACCOUNTS } from "@/data/seed/accounts.seed";
import { SEED_AGENTS } from "@/data/seed/agents.seed";
import { SEED_AML_ALERTS } from "@/data/seed/amlAlerts.seed";
import { SEED_CARDS } from "@/data/seed/cards.seed";
import { SEED_CUSTOMERS } from "@/data/seed/customers.seed";
import { SEED_FX_RATES } from "@/data/seed/fxRates.seed";
import { SEED_LOANS } from "@/data/seed/loans.seed";
import { SEED_TRANSACTIONS } from "@/data/seed/transactions.seed";

export * from "@/data/seed/accounts.seed";
export * from "@/data/seed/agents.seed";
export * from "@/data/seed/amlAlerts.seed";
export * from "@/data/seed/cards.seed";
export * from "@/data/seed/customers.seed";
export * from "@/data/seed/fxRates.seed";
export * from "@/data/seed/loans.seed";
export * from "@/data/seed/transactions.seed";

export interface OpenBankingConsent {
  id: string;
  customerId: string;
  agentId: string;
  scopes: string[];
  status: "active" | "revoked" | "pending";
  createdAt: string;
  expiresAt: string;
}

interface MockState {
  bank: BankDataset;
  demoAccounts: typeof SEED_ACCOUNTS;
  demoTransactions: typeof SEED_TRANSACTIONS;
  demoCustomers: typeof SEED_CUSTOMERS;
  demoLoans: typeof SEED_LOANS;
  demoCards: typeof SEED_CARDS;
  demoFxRates: typeof SEED_FX_RATES;
  demoAmlAlerts: typeof SEED_AML_ALERTS;
  demoAgents: typeof SEED_AGENTS;
  openBankingConsents: OpenBankingConsent[];
}

function createInitialState(): MockState {
  return {
    bank: structuredClone(seedData),
    demoAccounts: structuredClone(SEED_ACCOUNTS),
    demoTransactions: structuredClone(SEED_TRANSACTIONS),
    demoCustomers: structuredClone(SEED_CUSTOMERS),
    demoLoans: structuredClone(SEED_LOANS),
    demoCards: structuredClone(SEED_CARDS),
    demoFxRates: structuredClone(SEED_FX_RATES),
    demoAmlAlerts: structuredClone(SEED_AML_ALERTS),
    demoAgents: structuredClone(SEED_AGENTS),
    openBankingConsents: [
      {
        id: "cons-001",
        customerId: "cust-demo-001",
        agentId: "agt-001",
        scopes: ["accounts.read", "transactions.read"],
        status: "active",
        createdAt: "2026-03-22T10:20:00Z",
        expiresAt: "2026-09-22T10:20:00Z",
      },
      {
        id: "cons-002",
        customerId: "cust-011",
        agentId: "agt-002",
        scopes: ["accounts.read", "payments.initiate"],
        status: "pending",
        createdAt: "2026-04-02T12:05:00Z",
        expiresAt: "2026-10-02T12:05:00Z",
      },
    ],
  };
}

export const mockState: MockState = createInitialState();

function filterByMarket<T extends { market: Exclude<MarketCode, "ALL"> }>(items: T[], market: MarketCode) {
  if (market === "ALL") {
    return items;
  }
  return items.filter((item) => item.market === market);
}

function findCustomerName(customerId: string) {
  return mockState.bank.customers.find((customer) => customer.id === customerId)?.name ?? "Unknown customer";
}

function getBankAccount(accountId: string) {
  return mockState.bank.accounts.find((account) => account.id === accountId);
}

function bankAccountToUsd(account: Account) {
  const fx = mockState.bank.treasury.find((position) => position.currency === account.currency);
  if (!fx || account.currency === "USD") {
    return account.balance;
  }
  return account.balance / fx.rateToUsd;
}

function bankLoanToUsd(loan: Loan) {
  const fx = mockState.bank.treasury.find((position) => position.currency === loan.currency);
  if (!fx || loan.currency === "USD") {
    return loan.amount;
  }
  return loan.amount / fx.rateToUsd;
}

export function getOverview(market: MarketCode): DashboardPayload {
  const accounts = filterByMarket(mockState.bank.accounts, market);
  const loans = filterByMarket(mockState.bank.loans, market);
  const payments = filterByMarket(mockState.bank.payments, market);
  const alerts = filterByMarket(mockState.bank.alerts, market);
  const treasury = filterByMarket(mockState.bank.treasury, market);
  const incidents = filterByMarket(mockState.bank.incidents, market);

  const depositsUsd = accounts.reduce((sum, account) => sum + bankAccountToUsd(account), 0);
  const loanBookUsd = loans.reduce((sum, loan) => sum + bankLoanToUsd(loan), 0);
  const paymentsTodayUsd = payments.reduce((sum, payment) => {
    const fx = mockState.bank.treasury.find((position) => position.currency === payment.currency);
    if (!fx || payment.currency === "USD") {
      return sum + payment.amount;
    }
    return sum + payment.amount / fx.rateToUsd;
  }, 0);
  const liquidityRatio = treasury.length
    ? treasury.reduce((sum, item) => sum + item.utilization, 0) / treasury.length
    : 0;

  return {
    metrics: [
      { id: "deposits", label: "Deposits", value: formatCurrency(depositsUsd, "USD", "en"), delta: "+6.8% vs last week", tone: "positive" },
      { id: "payments", label: "Payments today", value: formatCurrency(paymentsTodayUsd, "USD", "en"), delta: `${payments.length} flows routed`, tone: "positive" },
      { id: "loans", label: "Loan book", value: formatCurrency(loanBookUsd, "USD", "en"), delta: `${loans.filter((loan) => loan.status === "Review").length} awaiting decisions`, tone: "neutral" },
      { id: "alerts", label: "Open alerts", value: formatCompactNumber(alerts.filter((alert) => alert.status !== "Cleared").length, "en"), delta: `${liquidityRatio.toFixed(0)}% treasury utilization`, tone: alerts.some((alert) => alert.severity === "High") ? "attention" : "neutral" },
    ],
    trend: [
      { label: "Mon", deposits: 72, payments: 54, loans: 18 },
      { label: "Tue", deposits: 76, payments: 58, loans: 22 },
      { label: "Wed", deposits: 78, payments: 62, loans: 21 },
      { label: "Thu", deposits: 81, payments: 65, loans: 26 },
      { label: "Fri", deposits: 86, payments: 69, loans: 24 },
      { label: "Sat", deposits: 83, payments: 61, loans: 17 },
      { label: "Sun", deposits: 88, payments: 71, loans: 19 },
    ],
    marketPerformance: mockState.bank.markets
      .filter((item) => market === "ALL" || item.code === market)
      .map((item) => {
        const marketAccounts = mockState.bank.accounts.filter((account) => account.market === item.code);
        const marketLoans = mockState.bank.loans.filter((loan) => loan.market === item.code);
        const marketAlerts = mockState.bank.alerts.filter((alert) => alert.market === item.code && alert.status !== "Cleared");
        const marketCustomers = mockState.bank.customers.filter((customer) => customer.market === item.code);
        const stage2Loans = marketLoans.filter((loan) => loan.stage === "Stage 2").length;
        return {
          market: item.name,
          deposits: Math.round(marketAccounts.reduce((sum, account) => sum + bankAccountToUsd(account), 0)),
          loans: Math.round(marketLoans.reduce((sum, loan) => sum + bankLoanToUsd(loan), 0)),
          customers: marketCustomers.length,
          alerts: marketAlerts.length,
          nplRatio: marketLoans.length ? Number(((stage2Loans / marketLoans.length) * 100).toFixed(1)) : 0,
        };
      }),
    paymentMix: [
      { name: "RTGS", value: payments.filter((payment) => payment.rail === "RTGS").length || 1 },
      { name: "Instant", value: payments.filter((payment) => payment.rail === "Instant").length || 1 },
      { name: "ACH", value: payments.filter((payment) => payment.rail === "ACH").length || 1 },
      { name: "SWIFT", value: payments.filter((payment) => payment.rail === "SWIFT").length || 1 },
    ],
    fxBoard: treasury,
    incidents,
  };
}

export function getBankCustomers(market: MarketCode) {
  return filterByMarket(mockState.bank.customers, market).map((customer) => ({
    ...customer,
    accounts: mockState.bank.accounts.filter((account) => account.customerId === customer.id).length,
    totalExposure: mockState.bank.loans
      .filter((loan) => loan.customerId === customer.id)
      .reduce((sum, loan) => sum + bankLoanToUsd(loan), 0),
  }));
}

export function getBankAccounts(market: MarketCode) {
  return filterByMarket(mockState.bank.accounts, market).map((account) => ({
    ...account,
    customerName: findCustomerName(account.customerId),
    branchName:
      mockState.bank.branches.find((branch) => branch.id === account.branchId)?.name ?? "Unknown branch",
  }));
}

export function getBankPayments(market: MarketCode) {
  return filterByMarket(mockState.bank.payments, market).map((payment) => ({
    ...payment,
    customerName: findCustomerName(payment.customerId),
  }));
}

export function createBankPayment(payload: {
  market: Exclude<MarketCode, "ALL">;
  customerId: string;
  debitAccountId: string;
  beneficiary: string;
  creditAccount: string;
  amount: number;
  currency: CurrencyCode;
  corridor: string;
  narrative: string;
}) {
  const account = getBankAccount(payload.debitAccountId);
  if (!account) {
    throw new Error("Debit account not found");
  }
  const availableBalanceBeforeDebit = account.availableBalance;
  if (payload.amount <= 0 || payload.amount > availableBalanceBeforeDebit) {
    throw new Error("Insufficient available balance");
  }

  account.balance -= payload.amount;
  account.availableBalance -= payload.amount;

  const payment: Payment = {
    id: `pay-${Date.now()}`,
    market: payload.market,
    customerId: payload.customerId,
    debitAccountId: payload.debitAccountId,
    creditAccount: payload.creditAccount,
    beneficiary: payload.beneficiary,
    amount: payload.amount,
    currency: payload.currency,
    corridor: payload.corridor,
    rail: payload.currency === "USD" || payload.currency === "EUR" || payload.currency === "GBP" ? "SWIFT" : "Instant",
    status: payload.amount > availableBalanceBeforeDebit * 0.25 ? "Pending" : "Completed",
    initiatedAt: new Date().toISOString(),
    narrative: payload.narrative,
  };

  mockState.bank.payments.unshift(payment);
  return payment;
}

export function getBankLoans(market: MarketCode) {
  return filterByMarket(mockState.bank.loans, market).map((loan) => ({
    ...loan,
    customerName: findCustomerName(loan.customerId),
  }));
}

export function updateBankLoanStatus(id: string, status: LoanStatus) {
  const loan = mockState.bank.loans.find((entry) => entry.id === id);
  if (!loan) {
    throw new Error("Loan not found");
  }
  loan.status = status;
  return loan;
}

export function getComplianceAlerts(market: MarketCode) {
  return filterByMarket(mockState.bank.alerts, market).map((alert) => ({
    ...alert,
    customerName: findCustomerName(alert.customerId),
  }));
}

export function updateComplianceAlertStatus(id: string, status: AlertStatus) {
  const alert = mockState.bank.alerts.find((entry) => entry.id === id);
  if (!alert) {
    throw new Error("Alert not found");
  }
  alert.status = status;
  return alert;
}

export function getTreasuryPositions(market: MarketCode) {
  return filterByMarket(mockState.bank.treasury, market);
}

export function getOperationalIncidents(market: MarketCode): OperationalIncident[] {
  return filterByMarket(mockState.bank.incidents, market);
}

export function getDemoAccount(accountId: string) {
  return mockState.demoAccounts.find((account) => account.id === accountId);
}

export function getDemoTransactions(accountId?: string) {
  if (!accountId) {
    return mockState.demoTransactions;
  }
  return mockState.demoTransactions.filter((transaction) => transaction.accountId === accountId);
}

export function getDemoCards() {
  return mockState.demoCards;
}

export function updateDemoCardStatus(id: string, status: "Active" | "Blocked" | "Expired") {
  const card = mockState.demoCards.find((entry) => entry.id === id);
  if (!card) {
    throw new Error("Card not found");
  }
  card.status = status;
  return card;
}

export function getDemoLoans() {
  return mockState.demoLoans;
}

export function getDemoFxRates() {
  return mockState.demoFxRates;
}

export function getDemoAmlAlerts() {
  return mockState.demoAmlAlerts;
}

export function updateDemoAmlAlertStatus(id: string, status: "Open" | "Investigating" | "Escalated" | "Cleared") {
  const alert = mockState.demoAmlAlerts.find((entry) => entry.id === id);
  if (!alert) {
    throw new Error("AML alert not found");
  }
  alert.status = status;
  return alert;
}

export function getDemoAgents() {
  return mockState.demoAgents;
}

export function getOpenBankingConsents() {
  return mockState.openBankingConsents;
}

export function createOpenBankingConsent(payload: {
  customerId: string;
  agentId: string;
  scopes: string[];
}) {
  const consent: OpenBankingConsent = {
    id: `cons-${Date.now()}`,
    customerId: payload.customerId,
    agentId: payload.agentId,
    scopes: payload.scopes,
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
  };
  mockState.openBankingConsents.unshift(consent);
  return consent;
}
