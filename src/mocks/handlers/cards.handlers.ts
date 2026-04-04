import { HttpResponse, http } from "msw";
import { seededCards, seededCardTransactions } from "@/data/cards";
import type {
  CardNetwork,
  CardMutationResponse,
  CardRevealResponse,
  PhysicalCardRequestPayload,
  PhysicalCardRequestResponse,
  VirtualCardCreatePayload,
  VirtualCardCreateResponse,
} from "@/lib/cards";
import { withNetworkDiscipline } from "@/mocks/utils";

const cardsStore = structuredClone(seededCards);
const transactionsStore = structuredClone(seededCardTransactions);

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

function findCard(cardId: string) {
  const card = cardsStore.find((entry) => entry.id === cardId);
  if (!card) {
    throw new Error("Card not found");
  }
  return card;
}

function addMonths(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${year}`;
}

function generateFullPan(prefix: string) {
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix} ${String(Math.floor(1000 + Math.random() * 9000))} ${String(Math.floor(1000 + Math.random() * 9000))} ${suffix}`;
}

export const cardsHandlers = [
  http.get("/api/cards/transactions", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const url = new URL(request.url);
    const cardId = url.searchParams.get("cardId");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const category = url.searchParams.get("category");

    const filtered = transactionsStore.filter((transaction) => {
      const itemDate = transaction.date.slice(0, 10);
      if (cardId && transaction.cardId !== cardId) {
        return false;
      }
      if (from && itemDate < from) {
        return false;
      }
      if (to && itemDate > to) {
        return false;
      }
      if (category && category !== "all" && transaction.category !== category) {
        return false;
      }
      return true;
    });

    return HttpResponse.json(
      {
        success: true,
        data: filtered,
      },
      { status: 200 },
    );
  }),

  http.post("/api/cards/virtual", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const payload = (await request.json()) as VirtualCardCreatePayload;
    if (!payload.linkedAccountId || !payload.spendingLimit || !payload.expiryPresetMonths) {
      return HttpResponse.json(
        { success: false, message: "Virtual card payload is incomplete." },
        { status: 400 },
      );
    }

    const network: CardNetwork = payload.currency === "USD" ? "Visa" : "Mastercard";
    const prefix = network === "Visa" ? "4123" : "5399";
    const fullPan = generateFullPan(prefix);
    const card = {
      id: `card-virtual-${Date.now()}`,
      label: `${network} Virtual`,
      network,
      type: "Debit" as const,
      mode: "virtual" as const,
      linkedAccountId: payload.linkedAccountId,
      linkedAccountName: payload.currency === "USD" ? "Domiciliary USD" : "Current Account",
      linkedAccountNumber: payload.currency === "USD" ? "0123456791" : "0123456789",
      linkedCurrency: payload.currency,
      maskedPan: `**** **** **** ${fullPan.slice(-4)}`,
      fullPan,
      expiry: addMonths(payload.expiryPresetMonths),
      cvv: String(Math.floor(100 + Math.random() * 900)),
      holderName: "ADAOBI CHUKWU",
      status: "Active" as const,
      onlineEnabled: true,
      internationalEnabled: payload.currency === "USD",
      contactlessEnabled: false,
      dailySpendLimit: payload.spendingLimit,
      posLimit: payload.spendingLimit,
      atmLimit: 0,
      last4: fullPan.slice(-4),
    };

    cardsStore.unshift(card);

    const response: VirtualCardCreateResponse = {
      success: true,
      data: card,
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  http.post("/api/cards/request", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const payload = (await request.json()) as PhysicalCardRequestPayload;
    if (!payload.product || !payload.deliveryAddress || !payload.city || !payload.postalCode) {
      return HttpResponse.json(
        { success: false, message: "Delivery form is incomplete." },
        { status: 400 },
      );
    }

    const response: PhysicalCardRequestResponse = {
      success: true,
      data: {
        requestReference: `CRD${Date.now()}`,
        product: payload.product,
        timeline: "5-7 business days",
        trackingCode: `PAK-${Math.floor(100000 + Math.random() * 900000)}`,
        status: "Production queued",
      },
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  http.get("/api/cards", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const url = new URL(request.url);
    const { page, limit } = getPagination(url);
    const result = paginate(cardsStore, page, limit);

    return HttpResponse.json(
      {
        success: true,
        data: result.data,
        pagination: result.pagination,
      },
      { status: 200 },
    );
  }),

  http.get("/api/cards/:cardId", async ({ params }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    try {
      const card = findCard(String(params.cardId));
      return HttpResponse.json(
        {
          success: true,
          data: card,
        },
        { status: 200 },
      );
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "Card not found",
        },
        { status: 404 },
      );
    }
  }),

  http.post("/api/cards/:cardId/settings", async ({ params, request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    try {
      const card = findCard(String(params.cardId));
      const payload = (await request.json()) as Partial<typeof card>;
      Object.assign(card, payload);

      const response: CardMutationResponse = {
        success: true,
        data: card,
      };
      return HttpResponse.json(response, { status: 200 });
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "Unable to update card settings",
        },
        { status: 404 },
      );
    }
  }),

  http.post("/api/cards/:cardId/reveal-number", async ({ params, request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const payload = (await request.json()) as { pin: string };
    if (!/^\d{4}$/.test(payload.pin)) {
      return HttpResponse.json(
        {
          success: false,
          message: "PIN must be 4 digits.",
        },
        { status: 400 },
      );
    }

    try {
      const card = findCard(String(params.cardId));
      const response: CardRevealResponse = {
        success: true,
        data: {
          fullPan: card.fullPan,
          cvv: card.cvv,
          expiresInSeconds: 30,
        },
      };
      return HttpResponse.json(response, { status: 200 });
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "Card not found",
        },
        { status: 404 },
      );
    }
  }),

  http.post("/api/cards/:cardId/report", async ({ params }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    try {
      const card = findCard(String(params.cardId));
      card.status = "Blocked";
      card.onlineEnabled = false;
      card.internationalEnabled = false;
      card.contactlessEnabled = false;

      const response: CardMutationResponse = {
        success: true,
        data: card,
      };

      return HttpResponse.json(response, { status: 200 });
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "Card not found",
        },
        { status: 404 },
      );
    }
  }),

  http.post("/api/cards/:cardId/pin-change", async ({ params, request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const payload = (await request.json()) as { currentPin: string; newPin: string };
    if (!/^\d{4}$/.test(payload.currentPin) || !/^\d{4}$/.test(payload.newPin)) {
      return HttpResponse.json(
        {
          success: false,
          message: "Current and new PIN values must both be 4 digits.",
        },
        { status: 400 },
      );
    }

    try {
      findCard(String(params.cardId));
      return HttpResponse.json(
        {
          success: true,
          message: "PIN change request submitted. New PIN will apply after overnight card-service sync.",
        },
        { status: 200 },
      );
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "Card not found",
        },
        { status: 404 },
      );
    }
  }),
];
