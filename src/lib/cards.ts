import type { CurrencyCode } from "@/lib/types";

export type CardNetwork = "Mastercard" | "Visa";
export type CardStatus = "Active" | "Frozen" | "Blocked";
export type CardMode = "physical" | "virtual";
export type CardProduct = "Classic" | "Gold" | "Platinum" | "World Elite";
export type CardMerchantCategory =
  | "Restaurants"
  | "Petrol"
  | "Supermarket"
  | "Online Shopping"
  | "Travel"
  | "Entertainment"
  | "Utilities";

export interface ManagedCard {
  id: string;
  label: string;
  network: CardNetwork;
  type: "Debit";
  mode: CardMode;
  linkedAccountId: string;
  linkedAccountName: string;
  linkedAccountNumber: string;
  linkedCurrency: CurrencyCode;
  maskedPan: string;
  fullPan: string;
  expiry: string;
  cvv: string;
  holderName: string;
  status: CardStatus;
  onlineEnabled: boolean;
  internationalEnabled: boolean;
  contactlessEnabled: boolean;
  dailySpendLimit: number;
  posLimit: number;
  atmLimit: number;
  last4: string;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  date: string;
  merchant: string;
  category: CardMerchantCategory;
  amount: number;
  currency: CurrencyCode;
  status: "completed" | "pending" | "reversed";
}

export interface PaginatedCardsResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CardRevealResponse {
  success: boolean;
  data: {
    fullPan: string;
    cvv: string;
    expiresInSeconds: number;
  };
}

export interface CardMutationResponse {
  success: boolean;
  data: ManagedCard;
}

export interface VirtualCardCreatePayload {
  linkedAccountId: string;
  spendingLimit: number;
  expiryPresetMonths: 1 | 3 | 12;
  currency: Extract<CurrencyCode, "NGN" | "USD">;
}

export interface VirtualCardCreateResponse {
  success: boolean;
  data: ManagedCard;
}

export interface PhysicalCardRequestPayload {
  product: CardProduct;
  deliveryAddress: string;
  city: string;
  market: string;
  postalCode: string;
  deliveryNote?: string;
}

export interface PhysicalCardRequestResponse {
  success: boolean;
  data: {
    requestReference: string;
    product: CardProduct;
    timeline: string;
    trackingCode: string;
    status: string;
  };
}
