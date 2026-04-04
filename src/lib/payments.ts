import type { CurrencyCode, MarketCode } from "@/lib/types";

export type TransferType = "own_account" | "panafrika" | "other_bank" | "international";
export type PaymentChannel = "transfer" | "bill" | "airtime" | "bulk" | "international";

export interface BankDirectoryEntry {
  code: string;
  name: string;
  market: Exclude<MarketCode, "ALL">;
}

export interface NameEnquiryRequest {
  market: Exclude<MarketCode, "ALL">;
  accountNumber: string;
  bankCode?: string;
  bankName?: string;
  transferType: TransferType;
}

export interface NameEnquiryResponse {
  success: boolean;
  data: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    reference: string;
    correspondentBank?: string;
  };
}

export interface FxPreview {
  sendAmount: number;
  sendCurrency: CurrencyCode;
  receiveAmount: number;
  receiveCurrency: CurrencyCode;
  rate: number;
  fee: number;
}

export interface TransferRequest {
  market: Exclude<MarketCode, "ALL">;
  transferType: TransferType;
  sourceAccountId: string;
  beneficiaryName: string;
  accountNumber: string;
  bankCode?: string;
  bankName?: string;
  beneficiaryBankName?: string;
  amount: number;
  sourceCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  narration: string;
  pin: string;
  scheduleMode: "now" | "scheduled";
  scheduledFor?: string;
  iban?: string;
  swiftCode?: string;
  beneficiaryCountry?: string;
  correspondentBank?: string;
}

export interface TransferResponse {
  success: boolean;
  data: {
    reference: string;
    status: "completed" | "pending_review";
    timestamp: string;
    fee: number;
    fxPreview?: FxPreview;
    transferType: TransferType;
    beneficiaryName: string;
    bankName: string;
    accountNumber: string;
    amount: number;
    sourceCurrency: CurrencyCode;
    targetCurrency: CurrencyCode;
    narration: string;
    scheduleMode: "now" | "scheduled";
    scheduledFor?: string;
  };
}

export interface BillValidationRequest {
  market: Exclude<MarketCode, "ALL">;
  category: string;
  provider: string;
  referenceNumber: string;
}

export interface BillValidationResponse {
  success: boolean;
  data: {
    customerName: string;
    provider: string;
    referenceNumber: string;
  };
}

export interface BillPaymentRequest {
  market: Exclude<MarketCode, "ALL">;
  channel: "bill" | "airtime";
  category: string;
  provider: string;
  referenceNumber: string;
  customerName: string;
  debitAccountId: string;
  amount: number;
  currency: CurrencyCode;
  pin: string;
}

export interface BillPaymentResponse {
  success: boolean;
  data: {
    reference: string;
    status: "completed";
    timestamp: string;
    provider: string;
    customerName: string;
    amount: number;
    currency: CurrencyCode;
    channel: "bill" | "airtime";
    category: string;
    referenceNumber: string;
  };
}

export interface BulkPaymentCsvRow {
  account_number: string;
  amount: string;
  narration: string;
}

export interface BulkPaymentRowPreview extends BulkPaymentCsvRow {
  rowNumber: number;
  validationStatus: "valid" | "invalid";
  validationMessage: string;
}

export interface BulkPaymentRequest {
  market: Exclude<MarketCode, "ALL">;
  debitAccountId: string;
  rows: BulkPaymentRowPreview[];
}

export interface BulkPaymentResponse {
  success: boolean;
  data: {
    batchReference: string;
    processedAt: string;
    results: Array<{
      rowNumber: number;
      accountNumber: string;
      amount: number;
      narration: string;
      status: "processed" | "failed";
      reference?: string;
      message: string;
    }>;
  };
}

export interface PaymentsHistoryItem {
  id: string;
  channel: PaymentChannel;
  type: "debit" | "credit";
  description: string;
  beneficiary: string;
  amount: number;
  currency: CurrencyCode;
  status: "completed" | "pending" | "failed";
  initiatedAt: string;
  reference: string;
  sourceAccount: string;
  destination: string;
  rail: "Instant" | "NIP" | "SWIFT" | "ACH" | "BillPay" | "Internal";
  narration: string;
}

export interface PaymentsHistoryQuery {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  type?: PaymentChannel | "all";
}

export interface PaginatedResponse<T> {
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
