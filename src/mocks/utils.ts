import { delay, HttpResponse } from "msw";

export async function withNetworkDiscipline() {
  await delay(800 + Math.random() * 500);
  if (Math.random() < 0.05) {
    return HttpResponse.json(
      {
        success: false,
        message: "PanAfrika emulator transient upstream failure",
      },
      { status: 500 },
    );
  }

  return null;
}

export function getPagination(url: URL, fallbackPageSize = 10) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? fallbackPageSize));
  return { page, pageSize };
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
