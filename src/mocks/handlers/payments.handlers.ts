import { HttpResponse, http } from "msw";
import { accounts } from "@/data/seed";
import { seededPaymentHistory } from "@/data/payments";
import type {
  BillPaymentRequest,
  BillPaymentResponse,
  BulkPaymentRequest,
  NameEnquiryRequest,
  NameEnquiryResponse,
  PaymentsHistoryItem,
  TransferRequest,
  TransferResponse,
} from "@/lib/payments";
import { withNetworkDiscipline } from "@/mocks/utils";

const paymentHistoryStore: PaymentsHistoryItem[] = structuredClone(seededPaymentHistory);

function getPagination(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.max(1, Number(url.searchParams.get("limit") ?? url.searchParams.get("pageSize") ?? 10));
  return { page, limit };
}

function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

function buildNameEnquiry(payload: NameEnquiryRequest): NameEnquiryResponse["data"] {
  if (payload.transferType === "panafrika") {
    return {
      accountName: "ADAEZE OKONKWO",
      accountNumber: payload.accountNumber,
      bankName: "PanAfrika Bank",
      reference: `NEQ${Date.now()}`,
    };
  }

  if (payload.transferType === "international") {
    return {
      accountName: "AYO FASHOLA",
      accountNumber: payload.accountNumber,
      bankName: payload.bankName ?? "Barclays London",
      reference: `NEQ${Date.now()}`,
      correspondentBank: "Standard Chartered New York",
    };
  }

  return {
    accountName: "TEMITOPE AJAYI",
    accountNumber: payload.accountNumber,
    bankName: payload.bankName ?? "Other Bank",
    reference: `NEQ${Date.now()}`,
  };
}

function sourceAccountLabel(accountId: string) {
  return accounts.find((account) => account.id === accountId)?.accountNumber ?? accountId;
}

function addHistoryItem(item: PaymentsHistoryItem) {
  paymentHistoryStore.unshift(item);
}

export const paymentsHandlers = [
  http.get("/api/payments", async () => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    return HttpResponse.json(paymentHistoryStore, { status: 200 });
  }),

  http.get("/api/payments/history", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const url = new URL(request.url);
    const { page, limit } = getPagination(url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const type = url.searchParams.get("type");

    const filtered = paymentHistoryStore.filter((item) => {
      const itemDate = item.initiatedAt.slice(0, 10);
      if (from && itemDate < from) {
        return false;
      }
      if (to && itemDate > to) {
        return false;
      }
      if (type && type !== "all" && item.channel !== type) {
        return false;
      }
      return true;
    });

    const result = paginate(filtered, page, limit);

    return HttpResponse.json(
      {
        success: true,
        data: result.data,
        pagination: result.pagination,
      },
      { status: 200 },
    );
  }),

  http.post("/api/payments/name-enquiry", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const payload = (await request.json()) as NameEnquiryRequest;

    if (!payload.accountNumber || !payload.transferType) {
      return HttpResponse.json(
        {
          success: false,
          message: "Account number and transfer type are required.",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      {
        success: true,
        data: buildNameEnquiry(payload),
      },
      { status: 200 },
    );
  }),

  http.post("/api/payments/transfer", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const payload = (await request.json()) as TransferRequest;
    const sourceAccount = accounts.find((account) => account.id === payload.sourceAccountId);

    if (!sourceAccount) {
      return HttpResponse.json(
        {
          success: false,
          message: "Debit account not found.",
        },
        { status: 404 },
      );
    }

    if (!payload.amount || payload.amount <= 0 || !payload.beneficiaryName || !payload.accountNumber) {
      return HttpResponse.json(
        {
          success: false,
          message: "Transfer payload is incomplete.",
        },
        { status: 400 },
      );
    }

    if (payload.amount > sourceAccount.availableBalance) {
      return HttpResponse.json(
        {
          success: false,
          message: "Insufficient available balance.",
        },
        { status: 422 },
      );
    }

    const reference = `TXN${Date.now()}`;
    const isInternational = payload.transferType === "international";
    const status = payload.amount > 1_000_000 ? "pending_review" : "completed";
    const fee = isInternational ? 2000 : 50;
    const timestamp = new Date().toISOString();
    const fxPreview =
      payload.sourceCurrency === payload.targetCurrency
        ? undefined
        : {
            sendAmount: payload.amount,
            sendCurrency: payload.sourceCurrency,
            receiveAmount:
              payload.sourceCurrency === "NGN" && payload.targetCurrency === "USD"
                ? Number((payload.amount / 1580).toFixed(2))
                : payload.sourceCurrency === "NGN" && payload.targetCurrency === "EUR"
                  ? Number((payload.amount / 1710).toFixed(2))
                  : payload.amount,
            receiveCurrency: payload.targetCurrency,
            rate: payload.targetCurrency === "USD" ? 1580 : 1710,
            fee,
          };

    addHistoryItem({
      id: reference,
      channel: isInternational ? "international" : "transfer",
      type: "debit",
      description:
        payload.transferType === "own_account"
          ? `Own account transfer to ${payload.accountNumber}`
          : `Transfer to ${payload.beneficiaryName}`,
      beneficiary: payload.beneficiaryName,
      amount: payload.amount,
      currency: payload.sourceCurrency,
      status: status === "completed" ? "completed" : "pending",
      initiatedAt: timestamp,
      reference,
      sourceAccount: sourceAccountLabel(payload.sourceAccountId),
      destination: payload.accountNumber,
      rail: isInternational ? "SWIFT" : payload.transferType === "panafrika" || payload.transferType === "own_account" ? "Internal" : "Instant",
      narration: payload.narration,
    });

    const response: TransferResponse = {
      success: true,
      data: {
        reference,
        status,
        timestamp,
        fee,
        fxPreview,
        transferType: payload.transferType,
        beneficiaryName: payload.beneficiaryName,
        bankName: payload.bankName ?? payload.beneficiaryBankName ?? "PanAfrika Bank",
        accountNumber: payload.accountNumber,
        amount: payload.amount,
        sourceCurrency: payload.sourceCurrency,
        targetCurrency: payload.targetCurrency,
        narration: payload.narration,
        scheduleMode: payload.scheduleMode,
        scheduledFor: payload.scheduledFor,
      },
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  http.post("/api/payments/bills", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const payload = (await request.json()) as BillPaymentRequest;
    const sourceAccount = accounts.find((account) => account.id === payload.debitAccountId);

    if (!sourceAccount) {
      return HttpResponse.json(
        {
          success: false,
          message: "Debit account not found.",
        },
        { status: 404 },
      );
    }

    if (!payload.referenceNumber || !payload.provider || !payload.amount || !payload.customerName) {
      return HttpResponse.json(
        {
          success: false,
          message: "Bill payment payload is incomplete.",
        },
        { status: 400 },
      );
    }

    const reference = `${payload.channel === "airtime" ? "AIR" : "BIL"}${Date.now()}`;
    const timestamp = new Date().toISOString();

    addHistoryItem({
      id: reference,
      channel: payload.channel,
      type: "debit",
      description:
        payload.channel === "airtime"
          ? `${payload.provider} ${payload.category.toLowerCase()} purchase`
          : `${payload.category} payment to ${payload.provider}`,
      beneficiary: payload.provider,
      amount: payload.amount,
      currency: payload.currency,
      status: "completed",
      initiatedAt: timestamp,
      reference,
      sourceAccount: sourceAccount.accountNumber,
      destination: payload.referenceNumber,
      rail: "BillPay",
      narration: payload.category,
    });

    const response: BillPaymentResponse = {
      success: true,
      data: {
        reference,
        status: "completed",
        timestamp,
        provider: payload.provider,
        customerName: payload.customerName,
        amount: payload.amount,
        currency: payload.currency,
        channel: payload.channel,
        category: payload.category,
        referenceNumber: payload.referenceNumber,
      },
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  http.post("/api/payments/bulk", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const payload = (await request.json()) as BulkPaymentRequest;
    const sourceAccount = accounts.find((account) => account.id === payload.debitAccountId);

    if (!sourceAccount) {
      return HttpResponse.json(
        {
          success: false,
          message: "Debit account not found.",
        },
        { status: 404 },
      );
    }

    if (!payload.rows.length) {
      return HttpResponse.json(
        {
          success: false,
          message: "No payment rows supplied.",
        },
        { status: 400 },
      );
    }

    const results = payload.rows.map((row) => {
      const amount = Number(row.amount);
      const valid = row.validationStatus === "valid" && amount > 0 && amount <= 250000;
      const reference = valid ? `TXN${Date.now()}${row.rowNumber}` : undefined;

      return {
        rowNumber: row.rowNumber,
        accountNumber: row.account_number,
        amount,
        narration: row.narration,
        status: valid ? ("processed" as const) : ("failed" as const),
        reference,
        message: valid ? "Processed successfully" : "Rejected during validation or limit check",
      };
    });

    const processedRows = results.filter((row) => row.status === "processed");
    const batchReference = `BLK${Date.now()}`;
    const processedAt = new Date().toISOString();

    if (processedRows.length) {
      addHistoryItem({
        id: batchReference,
        channel: "bulk",
        type: "debit",
        description: `Bulk payment batch (${processedRows.length} beneficiaries)`,
        beneficiary: `${processedRows.length} beneficiaries`,
        amount: processedRows.reduce((sum, row) => sum + row.amount, 0),
        currency: sourceAccount.currency,
        status: processedRows.length === results.length ? "completed" : "pending",
        initiatedAt: processedAt,
        reference: batchReference,
        sourceAccount: sourceAccount.accountNumber,
        destination: "Batch disbursement",
        rail: "ACH",
        narration: "Bulk payment processing",
      });
    }

    return HttpResponse.json(
      {
        success: true,
        data: {
          batchReference,
          processedAt,
          results,
        },
      },
      { status: 200 },
    );
  }),

  http.post("/api/payments", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const payload = (await request.json()) as { beneficiary?: string; amount?: number };
    if (!payload.beneficiary || !payload.amount) {
      return HttpResponse.json(
        {
          success: false,
          message: "Invalid payment request.",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      {
        success: true,
        data: {
          reference: `TXN${Date.now()}`,
        },
      },
      { status: 201 },
    );
  }),
];
