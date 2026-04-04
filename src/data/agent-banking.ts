export type AgentTier = "Bronze" | "Silver" | "Gold";
export type AgentStatus = "Active" | "Inactive" | "Suspended";
export type AgentMarket = "NG" | "GH" | "KE";

export interface AgentProfile {
  name: string;
  code: string;
  location: string;
  tier: AgentTier;
  market: AgentMarket;
  floatBalance: number;
  todayTransactions: number;
  todayVolume: number;
  todayCommission: number;
}

export interface AgentDailyPerformance {
  day: string;
  transactions: number;
  volume: number;
}

export interface FloatHistoryPoint {
  label: string;
  balance: number;
  topUps: number;
  dispensed: number;
}

export interface AgentNode {
  id: string;
  name: string;
  code: string;
  market: AgentMarket;
  location: string;
  status: AgentStatus;
  tier: AgentTier;
  todayVolume: number;
  floatBalance: number;
  x: number;
  y: number;
}

const nigeriaNodes = [
  { location: "Lagos Island", x: 336, y: 286 },
  { location: "Lekki", x: 350, y: 300 },
  { location: "Yaba", x: 326, y: 272 },
  { location: "Ikeja", x: 318, y: 258 },
  { location: "Abeokuta", x: 304, y: 246 },
  { location: "Ibadan", x: 292, y: 262 },
  { location: "Ilorin", x: 300, y: 226 },
  { location: "Akure", x: 324, y: 286 },
  { location: "Benin City", x: 356, y: 274 },
  { location: "Asaba", x: 372, y: 278 },
  { location: "Enugu", x: 404, y: 264 },
  { location: "Onitsha", x: 388, y: 286 },
  { location: "Owerri", x: 392, y: 302 },
  { location: "Port Harcourt", x: 382, y: 326 },
  { location: "Uyo", x: 414, y: 322 },
  { location: "Calabar", x: 434, y: 316 },
  { location: "Abuja", x: 334, y: 202 },
  { location: "Kaduna", x: 332, y: 170 },
  { location: "Kano", x: 350, y: 128 },
  { location: "Jos", x: 362, y: 216 },
] as const;

const ghanaNodes = [
  { location: "Accra", x: 176, y: 308 },
  { location: "Tema", x: 188, y: 304 },
  { location: "Kasoa", x: 166, y: 300 },
  { location: "Cape Coast", x: 156, y: 284 },
  { location: "Takoradi", x: 132, y: 274 },
  { location: "Kumasi", x: 164, y: 244 },
  { location: "Sunyani", x: 150, y: 232 },
  { location: "Techiman", x: 172, y: 222 },
  { location: "Tamale", x: 182, y: 170 },
  { location: "Bolgatanga", x: 190, y: 128 },
  { location: "Ho", x: 194, y: 252 },
  { location: "Koforidua", x: 182, y: 276 },
  { location: "Wa", x: 134, y: 162 },
  { location: "Sogakope", x: 188, y: 292 },
  { location: "Aflao", x: 204, y: 308 },
] as const;

const kenyaNodes = [
  { location: "Nairobi CBD", x: 782, y: 284 },
  { location: "Westlands", x: 770, y: 272 },
  { location: "Thika", x: 794, y: 250 },
  { location: "Machakos", x: 810, y: 294 },
  { location: "Mombasa", x: 838, y: 342 },
  { location: "Kisumu", x: 732, y: 280 },
  { location: "Nakuru", x: 756, y: 252 },
  { location: "Eldoret", x: 732, y: 218 },
  { location: "Kitale", x: 722, y: 188 },
  { location: "Nyeri", x: 792, y: 228 },
  { location: "Meru", x: 814, y: 230 },
  { location: "Embu", x: 804, y: 254 },
  { location: "Garissa", x: 860, y: 256 },
  { location: "Malindi", x: 850, y: 316 },
  { location: "Isiolo", x: 816, y: 208 },
] as const;

function buildAgentNodes(
  market: AgentMarket,
  prefix: string,
  nodes: ReadonlyArray<{ location: string; x: number; y: number }>,
) {
  const tierCycle: AgentTier[] = ["Bronze", "Silver", "Gold"];
  return nodes.map((node, index) => {
    const order = index + 1;
    const tier = market === "NG" && order === 1 ? "Silver" : tierCycle[index % tierCycle.length];
    const status: AgentStatus =
      order % 11 === 0 ? "Suspended" : order % 6 === 0 ? "Inactive" : "Active";

    return {
      id: `agent-${market.toLowerCase()}-${String(order).padStart(3, "0")}`,
      name: `PanAfrika ${node.location} Agent`,
      code: `PAN-${prefix}-${String(4521 + index).padStart(5, "0")}`,
      market,
      location: node.location,
      status,
      tier,
      todayVolume: 180_000 + order * 47_500,
      floatBalance: 95_000 + order * 41_000,
      x: node.x,
      y: node.y,
    } satisfies AgentNode;
  });
}

export const agentProfile: AgentProfile = {
  name: "Amina Yusuf Enterprise",
  code: "PAN-LG-04521",
  location: "Lagos Island, Nigeria",
  tier: "Silver",
  market: "NG",
  floatBalance: 850_000,
  todayTransactions: 47,
  todayVolume: 2_300_000,
  todayCommission: 18_400,
};

export const agentWeeklyPerformance: AgentDailyPerformance[] = [
  { day: "Mon", transactions: 38, volume: 1_760_000 },
  { day: "Tue", transactions: 42, volume: 1_940_000 },
  { day: "Wed", transactions: 44, volume: 2_080_000 },
  { day: "Thu", transactions: 49, volume: 2_210_000 },
  { day: "Fri", transactions: 55, volume: 2_580_000 },
  { day: "Sat", transactions: 51, volume: 2_420_000 },
  { day: "Sun", transactions: 47, volume: 2_300_000 },
];

export const floatHistory: FloatHistoryPoint[] = [
  { label: "08:00", balance: 1_180_000, topUps: 400_000, dispensed: 0 },
  { label: "10:00", balance: 1_040_000, topUps: 0, dispensed: 140_000 },
  { label: "12:00", balance: 930_000, topUps: 0, dispensed: 110_000 },
  { label: "14:00", balance: 870_000, topUps: 120_000, dispensed: 180_000 },
  { label: "16:00", balance: 850_000, topUps: 0, dispensed: 140_000 },
  { label: "18:00", balance: 850_000, topUps: 180_000, dispensed: 180_000 },
];

export const seededAgentNetwork: AgentNode[] = [
  ...buildAgentNodes("NG", "LG", nigeriaNodes),
  ...buildAgentNodes("GH", "AC", ghanaNodes),
  ...buildAgentNodes("KE", "NB", kenyaNodes),
];

export const agentTiers: AgentTier[] = ["Bronze", "Silver", "Gold"];
export const agentStatuses: AgentStatus[] = ["Active", "Inactive", "Suspended"];
export const agentMarkets: AgentMarket[] = ["NG", "GH", "KE"];
