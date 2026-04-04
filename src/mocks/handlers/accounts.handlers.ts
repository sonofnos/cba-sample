import { HttpResponse, http } from "msw";
import {
  getBankAccounts,
  getBankCustomers,
  getDemoTransactions,
  getOperationalIncidents,
  getOverview,
  mockState,
} from "@/data";
import type { MarketCode } from "@/lib/types";
import { getPagination, paginate, withNetworkDiscipline } from "@/mocks/utils";

function getMarket(request: Request) {
  const url = new URL(request.url);
  return (url.searchParams.get("market") ?? "ALL") as MarketCode;
}

export const accountsHandlers = [
  http.get("/api/markets", async () => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    return HttpResponse.json(mockState.bank.markets, { status: 200 });
  }),

  http.get("/api/overview", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    return HttpResponse.json(getOverview(getMarket(request)), { status: 200 });
  }),

  http.get("/api/customers", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    return HttpResponse.json(getBankCustomers(getMarket(request)), { status: 200 });
  }),

  http.get("/api/accounts", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    return HttpResponse.json(getBankAccounts(getMarket(request)), { status: 200 });
  }),

  http.get("/api/operations", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    return HttpResponse.json(getOperationalIncidents(getMarket(request)), { status: 200 });
  }),

  http.get("/api/teller/customers", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const url = new URL(request.url);
    const { page, pageSize } = getPagination(url, 10);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const filtered = mockState.demoCustomers.filter((customer) =>
      `${customer.firstName} ${customer.lastName} ${customer.bvn}`.toLowerCase().includes(search),
    );
    const result = paginate(filtered, page, pageSize);

    return HttpResponse.json(
      {
        success: true,
        data: result.data,
        pagination: result.pagination,
      },
      { status: 200 },
    );
  }),

  http.get("/api/accounts/:accountId/transactions", async ({ params, request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const accountId = String(params.accountId);
    const url = new URL(request.url);
    const { page, pageSize } = getPagination(url, 15);
    const transactions = getDemoTransactions(accountId);

    if (!transactions.length) {
      return HttpResponse.json(
        {
          success: false,
          message: "Account transactions not found",
        },
        { status: 404 },
      );
    }

    const result = paginate(transactions, page, pageSize);

    return HttpResponse.json(
      {
        success: true,
        data: result.data,
        pagination: result.pagination,
      },
      { status: 200 },
    );
  }),
];
