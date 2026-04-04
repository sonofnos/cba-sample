import { HttpResponse, http } from "msw";
import {
  seededAmlAlerts,
  seededAuditTrail,
  seededKycQueue,
  seededReportRows,
  seededSanctionsMatches,
} from "@/data/compliance";
import type { AmlAlert, AmlAlertStatus, KycCase, ReportType } from "@/lib/compliance";
import { withNetworkDiscipline } from "@/mocks/utils";

const kycStore: KycCase[] = structuredClone(seededKycQueue);
const amlStore: AmlAlert[] = structuredClone(seededAmlAlerts);
const auditStore = structuredClone(seededAuditTrail);

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

export const complianceHandlers = [
  http.get("/api/compliance/kyc-queue", async () => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;

    return HttpResponse.json({ success: true, data: kycStore }, { status: 200 });
  }),

  http.get("/api/compliance/kyc-queue/:id", async ({ params }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;

    const record = kycStore.find((item) => item.id === String(params.id));
    if (!record) {
      return HttpResponse.json({ success: false, message: "KYC case not found" }, { status: 404 });
    }

    return HttpResponse.json({ success: true, data: record }, { status: 200 });
  }),

  http.post("/api/compliance/kyc-queue/:id/decision", async ({ params, request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;

    const record = kycStore.find((item) => item.id === String(params.id));
    if (!record) {
      return HttpResponse.json({ success: false, message: "KYC case not found" }, { status: 404 });
    }

    const body = (await request.json()) as { status: KycCase["status"] };
    record.status = body.status;

    return HttpResponse.json({ success: true, data: record }, { status: 200 });
  }),

  http.get("/api/compliance/aml-alerts", async () => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;

    return HttpResponse.json({ success: true, data: amlStore }, { status: 200 });
  }),

  http.get("/api/compliance/aml-alerts/:id", async ({ params }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;

    const alert = amlStore.find((item) => item.id === String(params.id));
    if (!alert) {
      return HttpResponse.json({ success: false, message: "AML alert not found" }, { status: 404 });
    }

    return HttpResponse.json({ success: true, data: alert }, { status: 200 });
  }),

  http.post("/api/compliance/aml-alerts/:id/action", async ({ params, request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;

    const alert = amlStore.find((item) => item.id === String(params.id));
    if (!alert) {
      return HttpResponse.json({ success: false, message: "AML alert not found" }, { status: 404 });
    }

    const body = (await request.json()) as { status: AmlAlertStatus; action: string; note: string };
    alert.status = body.status;
    alert.actionLog.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Compliance Officer",
      action: body.action,
      note: body.note,
    });

    return HttpResponse.json({ success: true, data: alert }, { status: 200 });
  }),

  http.post("/api/compliance/sanctions/search", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;

    const body = (await request.json()) as { query: string };
    const normalizedQuery = body.query.trim().toLowerCase();
    const match =
      seededSanctionsMatches.find((item) => item.query.toLowerCase() === normalizedQuery) ??
      seededSanctionsMatches.find((item) => normalizedQuery.includes(item.query.toLowerCase()) || item.query.toLowerCase().includes(normalizedQuery));

    return HttpResponse.json(
      {
        success: true,
        data: match ?? {
          id: `san-${Date.now()}`,
          query: body.query,
          result: "CLEAR",
          note: "No records returned from OFAC, EU, UN, or CBN watchlists.",
        },
      },
      { status: 200 },
    );
  }),

  http.post("/api/compliance/reports/generate", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;

    const body = (await request.json()) as { reportType: ReportType; from: string; to: string };
    const rows = seededReportRows[body.reportType] ?? [];
    const filtered = rows.filter((row) => {
      const date = row.reportedAt.slice(0, 10);
      return (!body.from || date >= body.from) && (!body.to || date <= body.to);
    });

    return HttpResponse.json({ success: true, data: filtered }, { status: 200 });
  }),

  http.get("/api/compliance/audit-trail", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(url.searchParams.get("limit") ?? 12));
    const date = url.searchParams.get("date");
    const role = url.searchParams.get("role");
    const action = url.searchParams.get("action");

    const filtered = auditStore.filter((row) => {
      const rowDate = row.timestamp.slice(0, 10);
      if (date && rowDate !== date) return false;
      if (role && role !== "all" && row.role !== role) return false;
      if (action && action !== "all" && row.action !== action) return false;
      return true;
    });

    const result = paginate(filtered, page, limit);
    return HttpResponse.json({ success: true, data: result.data, pagination: result.pagination }, { status: 200 });
  }),

  http.get("/api/compliance", async () => {
    const failure = await withNetworkDiscipline();
    if (failure) return failure;

    return HttpResponse.json(
      amlStore.map((alert) => ({
        id: alert.id,
        customerName: alert.customerName,
        scenario: alert.alertType,
        market: "NG",
        regulator: "CBN",
        severity: alert.riskScore >= 75 ? "High" : alert.riskScore >= 45 ? "Medium" : "Low",
        status: alert.status === "Dismissed" ? "Cleared" : alert.status === "Investigating" ? "Investigating" : "Open",
        openedAt: alert.date,
      })),
      { status: 200 },
    );
  }),
];
