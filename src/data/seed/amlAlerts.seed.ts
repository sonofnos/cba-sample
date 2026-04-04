export interface SeedAmlAlert {
  id: string;
  customerId: string;
  customerName: string;
  scenario: string;
  severity: "Low" | "Medium" | "High";
  status: "Open" | "Investigating" | "Escalated" | "Cleared";
  market: "NG" | "GH" | "KE" | "ZA" | "SN" | "RW" | "ZM";
  regulator: string;
  openedAt: string;
  assignedTo: string;
}

export const SEED_AML_ALERTS: SeedAmlAlert[] = [
  { id: "aml-001", customerId: "cust-demo-001", customerName: "Adaobi Chukwu", scenario: "Multiple rapid inbound transfers", severity: "Medium", status: "Investigating", market: "NG", regulator: "CBN", openedAt: "2026-04-04T08:10:00Z", assignedTo: "Temi Oladipo" },
  { id: "aml-002", customerId: "cust-009", customerName: "Emeka Obi", scenario: "Source of wealth refresh overdue", severity: "High", status: "Open", market: "NG", regulator: "CBN", openedAt: "2026-04-03T16:55:00Z", assignedTo: "Bola Ilesanmi" },
  { id: "aml-003", customerId: "cust-011", customerName: "Kojo Mensah", scenario: "Unexpected corridor concentration", severity: "Medium", status: "Escalated", market: "GH", regulator: "BoG", openedAt: "2026-04-04T07:45:00Z", assignedTo: "Efua Mensah" },
  { id: "aml-004", customerId: "cust-014", customerName: "Akinyi Otieno", scenario: "Cash deposit spike pattern", severity: "Low", status: "Open", market: "KE", regulator: "CBK", openedAt: "2026-04-04T06:30:00Z", assignedTo: "Peter Njoroge" },
  { id: "aml-005", customerId: "cust-016", customerName: "Lerato Khumalo", scenario: "Dormant account reactivation", severity: "High", status: "Investigating", market: "ZA", regulator: "SARB", openedAt: "2026-04-04T05:50:00Z", assignedTo: "Thabo Maseko" },
  { id: "aml-006", customerId: "cust-018", customerName: "Aissatou Ndiaye", scenario: "Large cross-border retail pattern", severity: "Medium", status: "Cleared", market: "SN", regulator: "BCEAO", openedAt: "2026-04-03T14:05:00Z", assignedTo: "Mamadou Diouf" },
  { id: "aml-007", customerId: "cust-020", customerName: "Claude Uwimana", scenario: "High frequency wallet sweep", severity: "Low", status: "Open", market: "RW", regulator: "NBR", openedAt: "2026-04-04T09:05:00Z", assignedTo: "Ange Mukamana" },
  { id: "aml-008", customerId: "cust-022", customerName: "Mutale Phiri", scenario: "Sanctions screening partial match", severity: "High", status: "Escalated", market: "ZM", regulator: "BoZ", openedAt: "2026-04-04T08:35:00Z", assignedTo: "Ruth Banda" },
];
