import { HttpResponse, http } from "msw";
import { getDemoFxRates, getTreasuryPositions } from "@/data";
import type { CurrencyCode, MarketCode } from "@/lib/types";
import { withNetworkDiscipline } from "@/mocks/utils";

function getMarket(request: Request) {
  const url = new URL(request.url);
  return (url.searchParams.get("market") ?? "ALL") as MarketCode;
}

export const fxHandlers = [
  http.get("/api/treasury", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    return HttpResponse.json(getTreasuryPositions(getMarket(request)), { status: 200 });
  }),

  http.get("/api/fx/rates", async () => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    return HttpResponse.json(
      {
        success: true,
        data: getDemoFxRates(),
      },
      { status: 200 },
    );
  }),

  http.post("/api/fx/quote", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const body = (await request.json()) as {
      baseCurrency?: CurrencyCode;
      quoteCurrency?: CurrencyCode;
      amount?: number;
    };

    if (!body.baseCurrency || !body.quoteCurrency || !body.amount) {
      return HttpResponse.json(
        {
          success: false,
          message: "baseCurrency, quoteCurrency and amount are required",
        },
        { status: 400 },
      );
    }

    const rate = getDemoFxRates().find(
      (item) => item.baseCurrency === body.baseCurrency && item.quoteCurrency === body.quoteCurrency,
    );

    if (!rate) {
      return HttpResponse.json(
        {
          success: false,
          message: "Requested currency pair is unavailable",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json(
      {
        success: true,
        data: {
          amount: body.amount,
          baseCurrency: body.baseCurrency,
          quoteCurrency: body.quoteCurrency,
          rate: rate.midRate,
          convertedAmount: Number((body.amount * rate.midRate).toFixed(2)),
          quoteId: `FXQ${Date.now()}`,
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        },
      },
      { status: 200 },
    );
  }),
];
