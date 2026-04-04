import type {
  AmlAlert,
  AuditTrailEntry,
  KycCase,
  RegulatoryReportRow,
  ReportType,
  SanctionsResult,
} from "@/lib/compliance";

const kycNames = [
  "Adaeze Okonkwo",
  "Chinedu Balogun",
  "Amina Yusuf",
  "Ifeoma Eze",
  "Kwame Mensah",
  "Lerato Dlamini",
  "Aissatou Ndiaye",
  "Samuel Mutiso",
  "Olufunke Ajayi",
  "Bongani Maseko",
  "Naomi Wanjiku",
  "Jeanette Uwimana",
  "Fatou Sarr",
  "Tariro Moyo",
  "Chukwuemeka Obi",
  "Ruth Nakitende",
  "Kelechi Nwosu",
  "Musa Abdullahi",
  "Blessing Ofori",
  "Nomsa Khumalo",
];

const idTypes = ["National ID", "International Passport", "Driver's License", "Voter Card"];
const kycStatuses = ["Pending Review", "Under Review", "Approved", "Rejected", "Referred"] as const;
const riskTiers = ["Low", "Medium", "High"] as const;

export const seededKycQueue: KycCase[] = kycNames.map((name, index) => ({
  id: `kyc-${String(index + 1).padStart(3, "0")}`,
  customerName: name,
  accountNumber: `0123456${String(800 + index)}`,
  submissionDate: new Date(2026, 3, 1 + (index % 10), 9 + (index % 6), 15).toISOString(),
  idType: idTypes[index % idTypes.length],
  riskTier: riskTiers[index % riskTiers.length],
  status: kycStatuses[index % 3],
  phone: `+2348031112${String(index).padStart(3, "0")}`,
  email: `${name.toLowerCase().replace(/[^a-z]/g, ".")}@mail.com`,
  nationality: index % 4 === 0 ? "Nigeria" : index % 4 === 1 ? "Ghana" : index % 4 === 2 ? "Kenya" : "South Africa",
  address: `${index + 10} Marina Avenue, Lagos`,
  bvn: `22345678${String(100 + index)}`,
  idVerificationResult: index % 7 === 0 ? "MISMATCH" : index % 5 === 0 ? "UNCLEAR" : "VERIFIED",
  livenessCheckResult: index % 6 === 0 ? "REVIEW" : "PASS",
  riskScore: 28 + ((index * 11) % 67),
  pepCheck: index % 8 === 0 ? "Potential Match" : "No Match",
  adverseMediaCheck: index % 9 === 0 ? "Potential Negative Media" : "Clear",
  documents: [
    { id: `doc-${index}-1`, label: "Government ID", type: "image" },
    { id: `doc-${index}-2`, label: "Proof of Address", type: "image" },
    { id: `doc-${index}-3`, label: "Selfie Capture", type: "image" },
  ],
}));

const amlTypes = [
  "Structuring",
  "Large Cash Transaction",
  "Unusual Pattern",
  "Sanctions Match",
  "High-Risk Jurisdiction",
  "Velocity Breach",
] as const;

export const seededAmlAlerts: AmlAlert[] = Array.from({ length: 15 }, (_, index) => ({
  id: `AML-${20260404 + index}`,
  customerName: kycNames[index],
  alertType: amlTypes[index % amlTypes.length],
  amount: 1_500_000 + index * 620_000,
  currency: "NGN",
  date: new Date(2026, 3, 1 + (index % 12), 10 + (index % 5), 5).toISOString(),
  riskScore: 48 + ((index * 9) % 46),
  status: index % 5 === 0 ? "Escalated" : index % 4 === 0 ? "Investigating" : "Open",
  narrative:
    index % 2 === 0
      ? "Pattern indicates rapid movement of funds through newly opened retail accounts with limited underlying profile history."
      : "Transactions exceeded expected turnover and triggered scenario thresholds for jurisdictional and velocity review.",
  transactions: [
    {
      id: `tx-${index}-1`,
      date: new Date(2026, 3, 1 + (index % 12), 8, 14).toISOString(),
      description: "Incoming transfer",
      amount: 800_000 + index * 45_000,
      direction: "credit",
    },
    {
      id: `tx-${index}-2`,
      date: new Date(2026, 3, 1 + (index % 12), 10, 48).toISOString(),
      description: "Cash withdrawal",
      amount: 600_000 + index * 35_000,
      direction: "debit",
    },
    {
      id: `tx-${index}-3`,
      date: new Date(2026, 3, 1 + (index % 12), 12, 6).toISOString(),
      description: "Outbound transfer",
      amount: 540_000 + index * 30_000,
      direction: "debit",
    },
  ],
  actionLog: [
    {
      id: `act-${index}-1`,
      timestamp: new Date(2026, 3, 1 + (index % 12), 12, 30).toISOString(),
      actor: "Mariam Usman",
      action: "Alert opened",
      note: "Scenario breached initial threshold.",
    },
    {
      id: `act-${index}-2`,
      timestamp: new Date(2026, 3, 1 + (index % 12), 13, 5).toISOString(),
      actor: "David Mbeki",
      action: "Reviewed customer profile",
      note: "Waiting for enhanced due diligence notes.",
    },
  ],
}));

export const seededSanctionsMatches: SanctionsResult[] = [
  {
    id: "san-001",
    query: "Musa Abdullahi",
    result: "POTENTIAL MATCH",
    matchName: "Musa Abdullahi Musa",
    list: "CBN Watchlist",
    score: 91,
    country: "Nigeria",
    note: "High phonetic similarity with linked regional watchlist profile.",
  },
  {
    id: "san-002",
    query: "22345678118",
    result: "POTENTIAL MATCH",
    matchName: "Kelechi Nwosu",
    list: "OFAC",
    score: 87,
    country: "Nigeria",
    note: "Account-linked identifier returned a probable alias match requiring manual review.",
  },
  {
    id: "san-003",
    query: "Nomsa Khumalo",
    result: "POTENTIAL MATCH",
    matchName: "Nomsa Khumalo Dlamini",
    list: "UN Consolidated List",
    score: 84,
    country: "South Africa",
    note: "Name, date-of-birth fragment, and jurisdiction aligned above screening threshold.",
  },
];

export const seededReportRows: Record<ReportType, RegulatoryReportRow[]> = {
  "CBN Returns": Array.from({ length: 12 }, (_, index) => ({
    id: `cbr-${index + 1}`,
    market: "Nigeria",
    customer: kycNames[index],
    accountNumber: `0123457${String(100 + index)}`,
    amount: 2_400_000 + index * 120_000,
    reason: index % 2 === 0 ? "Weekly prudential return" : "Monthly prudential return",
    reportedAt: new Date(2026, 2, 25 + (index % 5)).toISOString(),
    status: "Prepared",
  })),
  "Large Value Transaction Report": Array.from({ length: 12 }, (_, index) => ({
    id: `lvt-${index + 1}`,
    market: "Nigeria",
    customer: kycNames[index],
    accountNumber: `0123458${String(200 + index)}`,
    amount: 5_400_000 + index * 600_000,
    reason: "Single transaction above NGN 5M threshold",
    reportedAt: new Date(2026, 3, 2 + (index % 6)).toISOString(),
    status: "Queued",
  })),
  "Cash Transaction Report": Array.from({ length: 12 }, (_, index) => ({
    id: `ctr-${index + 1}`,
    market: "Nigeria",
    customer: kycNames[index],
    accountNumber: `0123459${String(300 + index)}`,
    amount: 5_100_000 + index * 350_000,
    reason: "Cash transaction above reporting threshold",
    reportedAt: new Date(2026, 3, 1 + (index % 7)).toISOString(),
    status: "Prepared",
  })),
  "Suspicious Transaction Report": Array.from({ length: 12 }, (_, index) => ({
    id: `str-${index + 1}`,
    market: index % 2 === 0 ? "Nigeria" : "Ghana",
    customer: kycNames[index],
    accountNumber: `0123460${String(400 + index)}`,
    amount: 1_800_000 + index * 520_000,
    reason: amlTypes[index % amlTypes.length],
    reportedAt: new Date(2026, 3, 3 + (index % 6)).toISOString(),
    status: "Draft",
  })),
};

const auditActions = [
  "User login",
  "KYC status updated",
  "AML alert escalated",
  "Report exported",
  "Sanctions screening executed",
  "Audit filter applied",
  "Customer profile viewed",
];

export const seededAuditTrail: AuditTrailEntry[] = Array.from({ length: 100 }, (_, index) => ({
  id: `aud-${String(index + 1).padStart(3, "0")}`,
  timestamp: new Date(2026, 3, 1 + (index % 10), 8 + (index % 10), index % 60).toISOString(),
  user: index % 3 === 0 ? "Mariam Usman" : index % 3 === 1 ? "David Mbeki" : "Admin Console",
  role: index % 4 === 0 ? "admin" : "compliance",
  action: auditActions[index % auditActions.length],
  entity: index % 2 === 0 ? "Customer" : index % 3 === 0 ? "AML Alert" : "Report",
  ipAddress: `10.24.8.${20 + (index % 70)}`,
  status: index % 9 === 0 ? "Failed" : index % 5 === 0 ? "Pending" : "Success",
}));
