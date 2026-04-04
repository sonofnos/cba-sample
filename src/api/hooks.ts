import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
  CardMutationResponse,
  CardRevealResponse,
  PaginatedCardsResponse,
  PhysicalCardRequestPayload,
  PhysicalCardRequestResponse,
  VirtualCardCreatePayload,
  VirtualCardCreateResponse,
} from "@/lib/cards";
import type {
  AmlAlert,
  AuditTrailEntry,
  KycCase,
  RegulatoryReportRow,
  ReportType,
  SanctionsResult,
} from "@/lib/compliance";
import type {
  LoanApplicationPayload,
  LoanApplicationResponse,
  LoanDecisionMutationResponse,
  LoanPaymentResponse,
  ManagedLoan,
} from "@/lib/loans";
import type {
  BillPaymentRequest,
  BillPaymentResponse,
  BulkPaymentRequest,
  BulkPaymentResponse,
  NameEnquiryRequest,
  NameEnquiryResponse,
  PaginatedResponse,
  PaymentsHistoryItem,
  PaymentsHistoryQuery,
  TransferRequest,
  TransferResponse,
} from "@/lib/payments";
import { useAppStore } from "@/store/app-store";
import type {
  AccountRecord,
  AlertStatus,
  AppUser,
  ComplianceAlertRecord,
  CustomerRecord,
  DashboardPayload,
  LoanRecord,
  LoanStatus,
  Market,
  OperationalIncident,
  Payment,
  PaymentRecord,
  TreasuryPosition,
} from "@/lib/types";
import type { CardTransaction, ManagedCard } from "@/lib/cards";

function marketQuery() {
  const market = useAppStore.getState().market;
  return market === "ALL" ? "market=ALL" : `market=${market}`;
}

export function useMarkets() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: () => api<Market[]>("/api/markets"),
  });
}

export function useOverview() {
  const market = useAppStore((state) => state.market);
  return useQuery({
    queryKey: ["overview", market],
    queryFn: () => api<DashboardPayload>(`/api/overview?${marketQuery()}`),
  });
}

export function useCustomers() {
  const market = useAppStore((state) => state.market);
  return useQuery({
    queryKey: ["customers", market],
    queryFn: () => api<CustomerRecord[]>(`/api/customers?${marketQuery()}`),
  });
}

export function useAccounts() {
  const market = useAppStore((state) => state.market);
  return useQuery({
    queryKey: ["accounts", market],
    queryFn: () => api<AccountRecord[]>(`/api/accounts?${marketQuery()}`),
  });
}

export function useCards() {
  return useQuery({
    queryKey: ["cards"],
    queryFn: () => api<PaginatedCardsResponse<ManagedCard>>("/api/cards?page=1&limit=20"),
  });
}

export function useCard(cardId: string | undefined) {
  return useQuery({
    queryKey: ["card", cardId],
    enabled: Boolean(cardId),
    queryFn: () => api<{ success: boolean; data: ManagedCard }>(`/api/cards/${cardId}`),
  });
}

export function useCardTransactions(params: {
  cardId?: string;
  from?: string;
  to?: string;
  category?: string;
}) {
  const search = new URLSearchParams();
  if (params.cardId) {
    search.set("cardId", params.cardId);
  }
  if (params.from) {
    search.set("from", params.from);
  }
  if (params.to) {
    search.set("to", params.to);
  }
  if (params.category && params.category !== "all") {
    search.set("category", params.category);
  }

  return useQuery({
    queryKey: ["card-transactions", params],
    queryFn: () =>
      api<{ success: boolean; data: CardTransaction[] }>(`/api/cards/transactions?${search.toString()}`),
  });
}

export function useManagedLoans() {
  return useQuery({
    queryKey: ["managed-loans"],
    queryFn: () => api<{ success: boolean; data: ManagedLoan[] }>("/api/loans"),
  });
}

export function useManagedLoan(id: string | undefined) {
  return useQuery({
    queryKey: ["managed-loan", id],
    enabled: Boolean(id),
    queryFn: () => api<{ success: boolean; data: ManagedLoan }>(`/api/loans/${id}`),
  });
}

export function useKycQueue() {
  return useQuery({
    queryKey: ["kyc-queue"],
    queryFn: () => api<{ success: boolean; data: KycCase[] }>("/api/compliance/kyc-queue"),
  });
}

export function useKycCase(id: string | undefined) {
  return useQuery({
    queryKey: ["kyc-case", id],
    enabled: Boolean(id),
    queryFn: () => api<{ success: boolean; data: KycCase }>(`/api/compliance/kyc-queue/${id}`),
  });
}

export function useAmlAlertsModule() {
  return useQuery({
    queryKey: ["aml-alerts"],
    queryFn: () => api<{ success: boolean; data: AmlAlert[] }>("/api/compliance/aml-alerts"),
  });
}

export function useAmlAlert(id: string | undefined) {
  return useQuery({
    queryKey: ["aml-alert", id],
    enabled: Boolean(id),
    queryFn: () => api<{ success: boolean; data: AmlAlert }>(`/api/compliance/aml-alerts/${id}`),
  });
}

export function useAuditTrail(params: { page: number; limit: number; date?: string; role?: string; action?: string }) {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.date) search.set("date", params.date);
  if (params.role && params.role !== "all") search.set("role", params.role);
  if (params.action && params.action !== "all") search.set("action", params.action);

  return useQuery({
    queryKey: ["audit-trail", params],
    queryFn: () =>
      api<{
        success: boolean;
        data: AuditTrailEntry[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };
      }>(`/api/compliance/audit-trail?${search.toString()}`),
  });
}

export function usePayments() {
  const market = useAppStore((state) => state.market);
  return useQuery({
    queryKey: ["payments", market],
    queryFn: () => api<PaymentRecord[]>(`/api/payments?${marketQuery()}`),
  });
}

export function useLoans() {
  const market = useAppStore((state) => state.market);
  return useQuery({
    queryKey: ["loans", market],
    queryFn: () => api<LoanRecord[]>(`/api/loans?${marketQuery()}`),
  });
}

export function useCompliance() {
  const market = useAppStore((state) => state.market);
  return useQuery({
    queryKey: ["compliance", market],
    queryFn: () => api<ComplianceAlertRecord[]>(`/api/compliance?${marketQuery()}`),
  });
}

export function useTreasury() {
  const market = useAppStore((state) => state.market);
  return useQuery({
    queryKey: ["treasury", market],
    queryFn: () => api<TreasuryPosition[]>(`/api/treasury?${marketQuery()}`),
  });
}

export function useOperations() {
  const market = useAppStore((state) => state.market);
  return useQuery({
    queryKey: ["operations", market],
    queryFn: () => api<OperationalIncident[]>(`/api/operations?${marketQuery()}`),
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      api<{ token: string; user: AppUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

function buildPaymentHistoryQuery(params: PaymentsHistoryQuery, market: string) {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    market,
  });

  if (params.from) {
    search.set("from", params.from);
  }

  if (params.to) {
    search.set("to", params.to);
  }

  if (params.type && params.type !== "all") {
    search.set("type", params.type);
  }

  return search.toString();
}

export function useCreatePaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api<Payment>("/api/payments", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["overview"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useLoanApplicationMutation() {
  return useMutation({
    mutationFn: (payload: LoanApplicationPayload) =>
      api<LoanApplicationResponse>("/api/loans/apply", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useAcceptLoanOfferMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { applicationId: string }) =>
      api<LoanDecisionMutationResponse>(`/api/loans/${payload.applicationId}/accept-offer`, {
        method: "POST",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["managed-loans"] });
      void queryClient.invalidateQueries({ queryKey: ["managed-loan"] });
    },
  });
}

export function useLoanPaymentMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api<LoanPaymentResponse>(`/api/loans/${id}/payment`, {
        method: "POST",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["managed-loans"] });
      void queryClient.invalidateQueries({ queryKey: ["managed-loan", id] });
    },
  });
}

export function useKycDecisionMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { status: KycCase["status"] }) =>
      api<{ success: boolean; data: KycCase }>(`/api/compliance/kyc-queue/${id}/decision`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kyc-queue"] });
      void queryClient.invalidateQueries({ queryKey: ["kyc-case", id] });
    },
  });
}

export function useAmlAlertActionMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { status: AmlAlert["status"]; action: string; note: string }) =>
      api<{ success: boolean; data: AmlAlert }>(`/api/compliance/aml-alerts/${id}/action`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["aml-alerts"] });
      void queryClient.invalidateQueries({ queryKey: ["aml-alert", id] });
    },
  });
}

export function useSanctionsSearchMutation() {
  return useMutation({
    mutationFn: (payload: { query: string }) =>
      api<{ success: boolean; data: SanctionsResult }>(`/api/compliance/sanctions/search`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useGenerateComplianceReportMutation() {
  return useMutation({
    mutationFn: (payload: { reportType: ReportType; from: string; to: string }) =>
      api<{ success: boolean; data: RegulatoryReportRow[] }>(`/api/compliance/reports/generate`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useCardSettingsMutation(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<ManagedCard>) =>
      api<CardMutationResponse>(`/api/cards/${cardId}/settings`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cards"] });
      void queryClient.invalidateQueries({ queryKey: ["card", cardId] });
    },
  });
}

export function useRevealCardMutation(cardId: string) {
  return useMutation({
    mutationFn: (payload: { pin: string }) =>
      api<CardRevealResponse>(`/api/cards/${cardId}/reveal-number`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useReportCardMutation(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { reason: string }) =>
      api<CardMutationResponse>(`/api/cards/${cardId}/report`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cards"] });
      void queryClient.invalidateQueries({ queryKey: ["card", cardId] });
    },
  });
}

export function usePinChangeMutation(cardId: string) {
  return useMutation({
    mutationFn: (payload: { currentPin: string; newPin: string }) =>
      api<{ success: boolean; message: string }>(`/api/cards/${cardId}/pin-change`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useCreateVirtualCardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VirtualCardCreatePayload) =>
      api<VirtualCardCreateResponse>("/api/cards/virtual", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useRequestPhysicalCardMutation() {
  return useMutation({
    mutationFn: (payload: PhysicalCardRequestPayload) =>
      api<PhysicalCardRequestResponse>("/api/cards/request", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function usePaymentsHistory(params: PaymentsHistoryQuery) {
  const market = useAppStore((state) => state.market);
  const effectiveMarket = market === "ALL" ? "NG" : market;

  return useQuery({
    queryKey: ["payments-history", effectiveMarket, params],
    queryFn: () =>
      api<PaginatedResponse<PaymentsHistoryItem>>(
        `/api/payments/history?${buildPaymentHistoryQuery(params, effectiveMarket)}`,
      ),
  });
}

export function useNameEnquiryMutation() {
  return useMutation({
    mutationFn: (payload: NameEnquiryRequest) =>
      api<NameEnquiryResponse>("/api/payments/name-enquiry", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useTransferMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TransferRequest) =>
      api<TransferResponse>("/api/payments/transfer", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments-history"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["overview"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useBillPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BillPaymentRequest) =>
      api<BillPaymentResponse>("/api/payments/bills", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments-history"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useBulkPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkPaymentRequest) =>
      api<BulkPaymentResponse>("/api/payments/bulk", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments-history"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useLoanDecisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LoanStatus }) =>
      api(`/api/loans/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["loans"] });
      void queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}

export function useAlertMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AlertStatus }) =>
      api(`/api/compliance/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["compliance"] });
      void queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}
