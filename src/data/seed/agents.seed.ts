export interface SeedAgent {
  id: string;
  name: string;
  type: "TPP" | "Aggregator" | "Merchant";
  status: "Active" | "Suspended" | "Pending";
  environment: "Sandbox" | "Production";
  scopes: string[];
  webhookUrl: string;
  lastHeartbeat: string;
}

export const SEED_AGENTS: SeedAgent[] = [
  {
    id: "agt-001",
    name: "Mono Connect",
    type: "Aggregator",
    status: "Active",
    environment: "Sandbox",
    scopes: ["accounts.read", "transactions.read", "identity.read"],
    webhookUrl: "https://mono.demo/webhooks/panafrika",
    lastHeartbeat: "2026-04-04T08:59:00Z",
  },
  {
    id: "agt-002",
    name: "Okra Gateway",
    type: "Aggregator",
    status: "Active",
    environment: "Sandbox",
    scopes: ["accounts.read", "payments.initiate"],
    webhookUrl: "https://okra.demo/webhooks/panafrika",
    lastHeartbeat: "2026-04-04T09:02:00Z",
  },
  {
    id: "agt-003",
    name: "Paystack Treasury Apps",
    type: "Merchant",
    status: "Pending",
    environment: "Sandbox",
    scopes: ["payments.initiate"],
    webhookUrl: "https://paystack.demo/webhooks/panafrika",
    lastHeartbeat: "2026-04-04T08:40:00Z",
  },
  {
    id: "agt-004",
    name: "OnePipe Business Hub",
    type: "TPP",
    status: "Suspended",
    environment: "Production",
    scopes: ["accounts.read", "transactions.read", "payments.initiate"],
    webhookUrl: "https://onepipe.demo/webhooks/panafrika",
    lastHeartbeat: "2026-04-03T18:15:00Z",
  },
];
