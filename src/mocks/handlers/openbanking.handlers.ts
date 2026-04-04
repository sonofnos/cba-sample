import { HttpResponse, http } from "msw";
import { accounts, customers, transactions } from "@/data/seed";
import { fxBasePairs } from "@/data/fx";
import { createOpenBankingConsent, getDemoAgents, getOpenBankingConsents } from "@/data";
import { getPagination, paginate, withNetworkDiscipline } from "@/mocks/utils";

const paymentStore = [
  {
    id: "obp-10001",
    status: "completed",
    amount: 125000,
    currency: "NGN",
    sourceAccountId: "cust-acct-current",
    destinationAccount: "0234567891",
    beneficiaryName: "Adaeze Okonkwo",
    narration: "Vendor settlement",
    createdAt: "2026-04-04T09:15:00Z",
  },
];

function getSandboxRate(fromCurrency: string, toCurrency: string) {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const direct = fxBasePairs.find((pair) => pair.base === fromCurrency && pair.quote === toCurrency);
  if (direct) {
    return direct.sell;
  }

  const inverse = fxBasePairs.find((pair) => pair.base === toCurrency && pair.quote === fromCurrency);
  if (inverse) {
    return 1 / inverse.buy;
  }

  const fromLeg = fxBasePairs.find((pair) => pair.base === "USD" && pair.quote === fromCurrency);
  const toLeg = fxBasePairs.find((pair) => pair.base === "USD" && pair.quote === toCurrency);

  if (fromCurrency === "USD" && toLeg) {
    return toLeg.sell;
  }

  if (toCurrency === "USD" && fromLeg) {
    return 1 / fromLeg.buy;
  }

  if (fromLeg && toLeg) {
    return (1 / fromLeg.buy) * toLeg.sell;
  }

  return 1;
}

function authorize(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer sandbox_")) {
    return HttpResponse.json(
      {
        success: false,
        message: "Missing or invalid bearer token",
      },
      { status: 401 },
    );
  }

  return null;
}

export const openBankingHandlers = [
  http.post("/oauth/token", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const body = (await request.json()) as {
      client_id?: string;
      client_secret?: string;
      grant_type?: string;
    };

    if (
      body.client_id !== "pab_sandbox_client" ||
      body.client_secret !== "pab_sandbox_secret" ||
      body.grant_type !== "client_credentials"
    ) {
      return HttpResponse.json(
        {
          message: "Invalid sandbox client credentials",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(
      {
        access_token: `sandbox_${Date.now()}`,
        token_type: "Bearer",
        expires_in: 3600,
        scope: "accounts.read transactions.read identity.read payments.initiate fx.read",
      },
      { status: 200 },
    );
  }),

  http.get("/v1/accounts", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    return HttpResponse.json(
      {
        data: accounts.map((account) => ({
          id: account.id,
          account_number: account.accountNumber,
          account_type: account.type,
          currency: account.currency,
          status: "active",
          available_balance: account.availableBalance,
        })),
        meta: {
          consent_id: "cons-001",
          total: accounts.length,
        },
      },
      { status: 200 },
    );
  }),

  http.get("/v1/accounts/:id", async ({ params, request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    const account = accounts.find((entry) => entry.id === String(params.id));
    if (!account) {
      return HttpResponse.json({ message: "Account not found" }, { status: 404 });
    }

    return HttpResponse.json(
      {
        data: {
          id: account.id,
          account_number: account.accountNumber,
          account_type: account.type,
          currency: account.currency,
          balance: account.balance,
          available_balance: account.availableBalance,
          status: "active",
          market: account.market,
        },
      },
      { status: 200 },
    );
  }),

  http.get("/v1/accounts/:id/transactions", async ({ params, request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    const account = accounts.find((entry) => entry.id === String(params.id));
    if (!account) {
      return HttpResponse.json({ message: "Account not found" }, { status: 404 });
    }

    return HttpResponse.json(
      {
        data: transactions.map((transaction) => ({
          id: transaction.id,
          booking_date: transaction.date,
          description: transaction.description,
          type: transaction.type,
          amount: transaction.amount,
          currency: account.currency,
          status: transaction.status,
          running_balance: transaction.runningBalance,
        })),
      },
      { status: 200 },
    );
  }),

  http.get("/v1/accounts/:id/balance", async ({ params, request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    const account = accounts.find((entry) => entry.id === String(params.id));
    if (!account) {
      return HttpResponse.json({ message: "Account not found" }, { status: 404 });
    }

    return HttpResponse.json(
      {
        data: {
          account_id: account.id,
          currency: account.currency,
          current_balance: account.balance,
          available_balance: account.availableBalance,
          as_of: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  }),

  http.post("/v1/payments/initiate", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    const body = (await request.json()) as {
      sourceAccountId?: string;
      destinationAccount?: string;
      beneficiaryName?: string;
      amount?: number;
      currency?: string;
      narration?: string;
    };

    if (!body.sourceAccountId || !body.destinationAccount || !body.beneficiaryName || !body.amount || !body.currency) {
      return HttpResponse.json({ message: "Incomplete payment initiation payload" }, { status: 400 });
    }

    const payment = {
      id: `obp-${Date.now()}`,
      status: body.amount > 250000 ? "pending" : "completed",
      amount: body.amount,
      currency: body.currency,
      sourceAccountId: body.sourceAccountId,
      destinationAccount: body.destinationAccount,
      beneficiaryName: body.beneficiaryName,
      narration: body.narration ?? "",
      createdAt: new Date().toISOString(),
    };
    paymentStore.unshift(payment);

    return HttpResponse.json(
      {
        data: payment,
      },
      { status: 201 },
    );
  }),

  http.get("/v1/payments/:id", async ({ params, request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    const payment = paymentStore.find((entry) => entry.id === String(params.id));
    if (!payment) {
      return HttpResponse.json({ message: "Payment not found" }, { status: 404 });
    }

    return HttpResponse.json(
      {
        data: payment,
      },
      { status: 200 },
    );
  }),

  http.post("/v1/payments/bulk", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    const body = (await request.json()) as {
      sourceAccountId?: string;
      payments?: Array<{
        destinationAccount: string;
        beneficiaryName: string;
        amount: number;
        narration?: string;
      }>;
    };

    if (!body.sourceAccountId || !body.payments?.length) {
      return HttpResponse.json({ message: "Bulk payment payload is incomplete" }, { status: 400 });
    }

    const results = body.payments.map((payment, index) => ({
      row: index + 1,
      payment_id: `obp-bulk-${Date.now()}-${index + 1}`,
      destination_account: payment.destinationAccount,
      beneficiary_name: payment.beneficiaryName,
      amount: payment.amount,
      status: payment.amount > 200000 ? "pending" : "completed",
    }));

    return HttpResponse.json(
      {
        data: {
          batch_id: `ob-batch-${Date.now()}`,
          source_account_id: body.sourceAccountId,
          results,
        },
      },
      { status: 201 },
    );
  }),

  http.get("/v1/identity", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    const customer = customers[0];
    return HttpResponse.json(
      {
        data: {
          customer_id: customer.id,
          full_name: customer.fullName,
          email: "customer@panafrika.com",
          phone: customer.phone,
          bvn: customer.bvn,
          segment: customer.segment,
          market: "NG",
        },
      },
      { status: 200 },
    );
  }),

  http.get("/v1/identity/kyc-status", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    return HttpResponse.json(
      {
        data: {
          status: "approved",
          risk_tier: "Low",
          review_date: "2026-04-02T11:30:00Z",
          consent_status: "active",
        },
      },
      { status: 200 },
    );
  }),

  http.get("/v1/fx/rates", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    return HttpResponse.json(
      {
        data: fxBasePairs.map((pair) => ({
          pair: pair.pair,
          buy: pair.buy,
          sell: pair.sell,
          updated_at: new Date().toISOString(),
        })),
      },
      { status: 200 },
    );
  }),

  http.post("/v1/fx/convert", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    const body = (await request.json()) as {
      fromCurrency?: string;
      toCurrency?: string;
      amount?: number;
    };

    if (!body.fromCurrency || !body.toCurrency || !body.amount) {
      return HttpResponse.json({ message: "fromCurrency, toCurrency and amount are required" }, { status: 400 });
    }

    const rate = getSandboxRate(body.fromCurrency, body.toCurrency);
    return HttpResponse.json(
      {
        data: {
          quote_id: `fxq_${Date.now()}`,
          from_currency: body.fromCurrency,
          to_currency: body.toCurrency,
          amount: body.amount,
          rate,
          converted_amount: Number((body.amount * rate).toFixed(2)),
          expires_at: new Date(Date.now() + 60_000).toISOString(),
        },
      },
      { status: 200 },
    );
  }),

  http.get("/api/openbanking/agents", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const url = new URL(request.url);
    const { page, pageSize } = getPagination(url, 10);
    const result = paginate(getDemoAgents(), page, pageSize);

    return HttpResponse.json(
      {
        success: true,
        data: result.data,
        pagination: result.pagination,
      },
      { status: 200 },
    );
  }),

  http.get("/api/openbanking/consents", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const url = new URL(request.url);
    const { page, pageSize } = getPagination(url, 10);
    const result = paginate(getOpenBankingConsents(), page, pageSize);

    return HttpResponse.json(
      {
        success: true,
        data: result.data,
        pagination: result.pagination,
      },
      { status: 200 },
    );
  }),

  http.post("/api/openbanking/consents", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const body = (await request.json()) as {
      customerId?: string;
      agentId?: string;
      scopes?: string[];
    };

    if (!body.customerId || !body.agentId || !body.scopes?.length) {
      return HttpResponse.json(
        {
          success: false,
          message: "customerId, agentId and scopes are required",
        },
        { status: 400 },
      );
    }

    const consent = createOpenBankingConsent({
      customerId: body.customerId,
      agentId: body.agentId,
      scopes: body.scopes,
    });

    return HttpResponse.json(
      {
        success: true,
        data: consent,
      },
      { status: 201 },
    );
  }),
];
