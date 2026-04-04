export type ApiMethod = "GET" | "POST" | "DELETE";

export interface ApiField {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface ApiEndpointDoc {
  id: string;
  tag: "Accounts" | "Payments" | "Identity" | "FX";
  method: ApiMethod;
  path: string;
  description: string;
  pathParams?: ApiField[];
  queryParams?: ApiField[];
  requestBody?: ApiField[];
  responseSchema: ApiField[];
  sampleBody?: Record<string, unknown>;
}

export const sandboxCredentials = {
  clientId: "pab_sandbox_client",
  clientSecret: "pab_sandbox_secret",
};

export const apiEndpoints: ApiEndpointDoc[] = [
  {
    id: "accounts-list",
    tag: "Accounts",
    method: "GET",
    path: "/v1/accounts",
    description: "List accounts available under the customer consent.",
    responseSchema: [
      { name: "data", type: "Account[]", description: "Authorized accounts" },
      { name: "meta", type: "object", description: "Pagination and consent metadata" },
    ],
  },
  {
    id: "account-detail",
    tag: "Accounts",
    method: "GET",
    path: "/v1/accounts/{id}",
    description: "Fetch a single account profile by identifier.",
    pathParams: [{ name: "id", type: "string", description: "Account identifier", required: true }],
    responseSchema: [{ name: "data", type: "Account", description: "Account detail payload" }],
  },
  {
    id: "account-transactions",
    tag: "Accounts",
    method: "GET",
    path: "/v1/accounts/{id}/transactions",
    description: "Return booked transactions for a consented account.",
    pathParams: [{ name: "id", type: "string", description: "Account identifier", required: true }],
    responseSchema: [{ name: "data", type: "Transaction[]", description: "Account transactions" }],
  },
  {
    id: "account-balance",
    tag: "Accounts",
    method: "GET",
    path: "/v1/accounts/{id}/balance",
    description: "Get current and available balance for an account.",
    pathParams: [{ name: "id", type: "string", description: "Account identifier", required: true }],
    responseSchema: [{ name: "data", type: "Balance", description: "Balance payload" }],
  },
  {
    id: "payment-initiate",
    tag: "Payments",
    method: "POST",
    path: "/v1/payments/initiate",
    description: "Initiate a single payment under an active customer consent.",
    requestBody: [
      { name: "sourceAccountId", type: "string", description: "Debiting account id", required: true },
      { name: "destinationAccount", type: "string", description: "Beneficiary account number", required: true },
      { name: "beneficiaryName", type: "string", description: "Beneficiary account name", required: true },
      { name: "amount", type: "number", description: "Payment amount", required: true },
      { name: "currency", type: "string", description: "Settlement currency", required: true },
      { name: "narration", type: "string", description: "Payment narration" },
    ],
    responseSchema: [{ name: "data", type: "Payment", description: "Payment initiation response" }],
    sampleBody: {
      sourceAccountId: "cust-acct-current",
      destinationAccount: "0234567891",
      beneficiaryName: "Adaeze Okonkwo",
      amount: 125000,
      currency: "NGN",
      narration: "Vendor settlement",
    },
  },
  {
    id: "payment-status",
    tag: "Payments",
    method: "GET",
    path: "/v1/payments/{id}",
    description: "Check the current status of an initiated payment.",
    pathParams: [{ name: "id", type: "string", description: "Payment identifier", required: true }],
    responseSchema: [{ name: "data", type: "PaymentStatus", description: "Payment status resource" }],
  },
  {
    id: "payment-bulk",
    tag: "Payments",
    method: "POST",
    path: "/v1/payments/bulk",
    description: "Submit a bulk payment instruction batch.",
    requestBody: [
      { name: "sourceAccountId", type: "string", description: "Debiting account id", required: true },
      { name: "payments", type: "BulkPayment[]", description: "Bulk payment rows", required: true },
    ],
    responseSchema: [{ name: "data", type: "BulkPaymentResult", description: "Batch processing result" }],
    sampleBody: {
      sourceAccountId: "cust-acct-current",
      payments: [
        { destinationAccount: "0581459032", beneficiaryName: "Temitope Ajayi", amount: 25000, narration: "Payroll batch 1" },
        { destinationAccount: "0119012034", beneficiaryName: "Ifeanyi Okafor", amount: 32000, narration: "Payroll batch 2" },
      ],
    },
  },
  {
    id: "identity-profile",
    tag: "Identity",
    method: "GET",
    path: "/v1/identity",
    description: "Fetch the consented customer profile.",
    responseSchema: [{ name: "data", type: "IdentityProfile", description: "Customer identity payload" }],
  },
  {
    id: "identity-kyc",
    tag: "Identity",
    method: "GET",
    path: "/v1/identity/kyc-status",
    description: "Fetch the current customer KYC state and risk tier.",
    responseSchema: [{ name: "data", type: "KycStatus", description: "Current KYC result" }],
  },
  {
    id: "fx-rates",
    tag: "FX",
    method: "GET",
    path: "/v1/fx/rates",
    description: "Return current FX rates available through the sandbox.",
    responseSchema: [{ name: "data", type: "FxRate[]", description: "Current rates board" }],
  },
  {
    id: "fx-convert",
    tag: "FX",
    method: "POST",
    path: "/v1/fx/convert",
    description: "Generate a conversion quote and indicative settlement amount.",
    requestBody: [
      { name: "fromCurrency", type: "string", description: "Source currency", required: true },
      { name: "toCurrency", type: "string", description: "Target currency", required: true },
      { name: "amount", type: "number", description: "Amount to convert", required: true },
    ],
    responseSchema: [{ name: "data", type: "FxQuote", description: "Indicative conversion result" }],
    sampleBody: {
      fromCurrency: "USD",
      toCurrency: "NGN",
      amount: 1000,
    },
  },
];

export const webhookDocs = [
  {
    event: "payment.completed",
    payload: {
      event: "payment.completed",
      id: "evt_001",
      data: { paymentId: "pay_1001", status: "completed", amount: 125000, currency: "NGN" },
    },
  },
  {
    event: "payment.failed",
    payload: {
      event: "payment.failed",
      id: "evt_002",
      data: { paymentId: "pay_1002", status: "failed", reason: "insufficient_funds" },
    },
  },
  {
    event: "account.credited",
    payload: {
      event: "account.credited",
      id: "evt_003",
      data: { accountId: "cust-acct-current", amount: 475000, currency: "NGN" },
    },
  },
  {
    event: "account.debited",
    payload: {
      event: "account.debited",
      id: "evt_004",
      data: { accountId: "cust-acct-current", amount: 18500, currency: "NGN" },
    },
  },
  {
    event: "kyc.approved",
    payload: {
      event: "kyc.approved",
      id: "evt_005",
      data: { customerId: "cust-001", status: "approved", riskTier: "Low" },
    },
  },
  {
    event: "kyc.rejected",
    payload: {
      event: "kyc.rejected",
      id: "evt_006",
      data: { customerId: "cust-002", status: "rejected", reason: "id_mismatch" },
    },
  },
  {
    event: "card.transaction",
    payload: {
      event: "card.transaction",
      id: "evt_007",
      data: { cardId: "card-mastercard-4521", merchant: "Shoprite Lekki", amount: 32800, currency: "NGN" },
    },
  },
];

export function getMethodTone(method: ApiMethod) {
  if (method === "GET") return "bg-sky-100 text-sky-700";
  if (method === "POST") return "bg-emerald-100 text-emerald-700";
  return "bg-orange-100 text-orange-700";
}
