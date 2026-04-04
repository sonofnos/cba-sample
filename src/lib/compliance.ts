
export type KycStatus =
  | "Pending Review"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Referred";
export type RiskTier = "Low" | "Medium" | "High";
export type VerificationResult = "VERIFIED" | "MISMATCH" | "UNCLEAR";
export type MatchResult = "CLEAR" | "POTENTIAL MATCH";
export type AmlAlertStatus = "Open" | "Investigating" | "Escalated" | "Dismissed" | "SAR Filed";
export type AmlAlertType =
  | "Structuring"
  | "Large Cash Transaction"
  | "Unusual Pattern"
  | "Sanctions Match"
  | "High-Risk Jurisdiction"
  | "Velocity Breach";
export type ReportType =
  | "CBN Returns"
  | "Large Value Transaction Report"
  | "Cash Transaction Report"
  | "Suspicious Transaction Report";

export interface KycCase {
  id: string;
  customerName: string;
  accountNumber: string;
  submissionDate: string;
  idType: string;
  riskTier: RiskTier;
  status: KycStatus;
  phone: string;
  email: string;
  nationality: string;
  address: string;
  bvn: string;
  idVerificationResult: VerificationResult;
  livenessCheckResult: "PASS" | "FAIL" | "REVIEW";
  riskScore: number;
  pepCheck: "No Match" | "Potential Match";
  adverseMediaCheck: "Clear" | "Potential Negative Media";
  documents: Array<{ id: string; label: string; type: string }>;
}

export interface AmlAlert {
  id: string;
  customerName: string;
  alertType: AmlAlertType;
  amount: number;
  currency: "NGN";
  date: string;
  riskScore: number;
  status: AmlAlertStatus;
  narrative: string;
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    direction: "credit" | "debit";
  }>;
  actionLog: Array<{
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    note: string;
  }>;
}

export interface SanctionsResult {
  id: string;
  query: string;
  result: MatchResult;
  matchName?: string;
  list?: string;
  score?: number;
  country?: string;
  note?: string;
}

export interface RegulatoryReportRow {
  id: string;
  market: string;
  customer: string;
  accountNumber: string;
  amount: number;
  reason: string;
  reportedAt: string;
  status: string;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  user: string;
  role: "customer" | "teller" | "compliance" | "admin";
  action: string;
  entity: string;
  ipAddress: string;
  status: "Success" | "Failed" | "Pending";
}

export async function exportRowsToExcel<T extends object>(filename: string, rows: T[]) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, filename);
}

export async function exportRowsToPdf<T extends object>(title: string, filename: string, rows: T[]) {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(title, 14, 18);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  const normalizedRows = rows as Array<Record<string, unknown>>;
  const headers = Object.keys(normalizedRows[0] ?? {});
  const columnWidth = 270 / Math.max(headers.length, 1);
  let y = 30;

  headers.forEach((header, index) => {
    pdf.text(header, 14 + index * columnWidth, y);
  });

  y += 8;
  normalizedRows.slice(0, 18).forEach((row) => {
    headers.forEach((header, index) => {
      const value = String(row[header] ?? "");
      pdf.text(value.slice(0, 28), 14 + index * columnWidth, y);
    });
    y += 7;
  });

  pdf.save(filename);
}
