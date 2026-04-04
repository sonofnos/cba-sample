import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ModuleLoadingSkeleton } from "@/components/layout/module-loading-skeleton";
import { ProtectedRoute } from "@/routes/protected-route";

const AppShell = lazy(() =>
  import("@/components/layout/app-shell").then((m) => ({ default: m.AppShell }))
);
const ArchitecturePage = lazy(() =>
  import("@/pages/architecture-page").then((m) => ({ default: m.ArchitecturePage }))
);
const ForgotPage = lazy(() =>
  import("@/pages/forgot-page").then((m) => ({ default: m.ForgotPage }))
);
const LandingPage = lazy(() =>
  import("@/pages/landing-page").then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import("@/pages/login-page").then((m) => ({ default: m.LoginPage }))
);
const MfaPage = lazy(() =>
  import("@/pages/mfa-page").then((m) => ({ default: m.MfaPage }))
);
const RegisterPage = lazy(() =>
  import("@/pages/register-page").then((m) => ({ default: m.RegisterPage }))
);
const DashboardPage = lazy(() =>
  import("@/pages/dashboard-page").then((m) => ({ default: m.DashboardPage }))
);
const CustomersPage = lazy(() =>
  import("@/pages/customers-page").then((m) => ({ default: m.CustomersPage }))
);
const AccountsPage = lazy(() =>
  import("@/pages/accounts-page").then((m) => ({ default: m.AccountsPage }))
);

// Cards module
const CardsPage = lazy(() =>
  import("@/pages/cards-page").then((m) => ({ default: m.CardsPage }))
);
const CardsOverviewPage = lazy(() =>
  import("@/pages/cards-page").then((m) => ({ default: m.CardsOverviewPage }))
);
const CardRequestPage = lazy(() =>
  import("@/pages/cards-page").then((m) => ({ default: m.CardRequestPage }))
);
const VirtualCardPage = lazy(() =>
  import("@/pages/cards-page").then((m) => ({ default: m.VirtualCardPage }))
);
const CardDetailPage = lazy(() =>
  import("@/pages/cards-page").then((m) => ({ default: m.CardDetailPage }))
);

// Payments module
const PaymentsPage = lazy(() =>
  import("@/pages/payments-page").then((m) => ({ default: m.PaymentsPage }))
);
const PaymentsOverviewPage = lazy(() =>
  import("@/pages/payments-page").then((m) => ({ default: m.PaymentsOverviewPage }))
);
const PaymentsTransferPage = lazy(() =>
  import("@/pages/payments-page").then((m) => ({ default: m.PaymentsTransferPage }))
);
const PaymentsBillsPage = lazy(() =>
  import("@/pages/payments-page").then((m) => ({ default: m.PaymentsBillsPage }))
);
const PaymentsAirtimePage = lazy(() =>
  import("@/pages/payments-page").then((m) => ({ default: m.PaymentsAirtimePage }))
);
const PaymentsBulkPage = lazy(() =>
  import("@/pages/payments-page").then((m) => ({ default: m.PaymentsBulkPage }))
);
const PaymentsInternationalPage = lazy(() =>
  import("@/pages/payments-page").then((m) => ({ default: m.PaymentsInternationalPage }))
);
const PaymentsHistoryPage = lazy(() =>
  import("@/pages/payments-page").then((m) => ({ default: m.PaymentsHistoryPage }))
);

// Loans module
const LoansPage = lazy(() =>
  import("@/pages/loans-page").then((m) => ({ default: m.LoansPage }))
);
const LoansOverviewPage = lazy(() =>
  import("@/pages/loans-page").then((m) => ({ default: m.LoansOverviewPage }))
);
const LoanApplicationPage = lazy(() =>
  import("@/pages/loans-page").then((m) => ({ default: m.LoanApplicationPage }))
);
const LoanCalculatorPage = lazy(() =>
  import("@/pages/loans-page").then((m) => ({ default: m.LoanCalculatorPage }))
);
const LoanDetailPage = lazy(() =>
  import("@/pages/loans-page").then((m) => ({ default: m.LoanDetailPage }))
);

// FX module
const FxPage = lazy(() =>
  import("@/pages/fx-page").then((m) => ({ default: m.FxPage }))
);
const FxOverviewPage = lazy(() =>
  import("@/pages/fx-page").then((m) => ({ default: m.FxOverviewPage }))
);
const FxConvertPage = lazy(() =>
  import("@/pages/fx-page").then((m) => ({ default: m.FxConvertPage }))
);
const FxTradingDeskPage = lazy(() =>
  import("@/pages/fx-page").then((m) => ({ default: m.FxTradingDeskPage }))
);
const FxRatesHistoryPage = lazy(() =>
  import("@/pages/fx-page").then((m) => ({ default: m.FxRatesHistoryPage }))
);

// Compliance module
const CompliancePage = lazy(() =>
  import("@/pages/compliance-page").then((m) => ({ default: m.CompliancePage }))
);
const ComplianceKycQueuePage = lazy(() =>
  import("@/pages/compliance-page").then((m) => ({ default: m.ComplianceKycQueuePage }))
);
const ComplianceAmlAlertsPage = lazy(() =>
  import("@/pages/compliance-page").then((m) => ({ default: m.ComplianceAmlAlertsPage }))
);
const ComplianceSanctionsPage = lazy(() =>
  import("@/pages/compliance-page").then((m) => ({ default: m.ComplianceSanctionsPage }))
);
const ComplianceReportsPage = lazy(() =>
  import("@/pages/compliance-page").then((m) => ({ default: m.ComplianceReportsPage }))
);
const ComplianceAuditTrailPage = lazy(() =>
  import("@/pages/compliance-page").then((m) => ({ default: m.ComplianceAuditTrailPage }))
);

// Agent module
const AgentPage = lazy(() =>
  import("@/pages/agent-page").then((m) => ({ default: m.AgentPage }))
);
const AgentDashboardPage = lazy(() =>
  import("@/pages/agent-page").then((m) => ({ default: m.AgentDashboardPage }))
);
const AgentTransactionsPage = lazy(() =>
  import("@/pages/agent-page").then((m) => ({ default: m.AgentTransactionsPage }))
);
const AgentFloatPage = lazy(() =>
  import("@/pages/agent-page").then((m) => ({ default: m.AgentFloatPage }))
);
const AgentNetworkPage = lazy(() =>
  import("@/pages/agent-page").then((m) => ({ default: m.AgentNetworkPage }))
);

const OpenBankingPage = lazy(() =>
  import("@/pages/openbanking-page").then((m) => ({ default: m.OpenBankingPage }))
);
const OperationsPage = lazy(() =>
  import("@/pages/operations-page").then((m) => ({ default: m.OperationsPage }))
);

export default function App() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/mfa" element={<MfaPage />} />
        <Route path="/forgot" element={<ForgotPage />} />
        <Route path="/developer" element={<OpenBankingPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="cards" element={<CardsPage />}>
            <Route index element={<CardsOverviewPage />} />
            <Route path="request" element={<CardRequestPage />} />
            <Route path="virtual" element={<VirtualCardPage />} />
            <Route path=":id" element={<CardDetailPage />} />
          </Route>
          <Route path="payments" element={<PaymentsPage />}>
            <Route index element={<PaymentsOverviewPage />} />
            <Route path="transfer" element={<PaymentsTransferPage />} />
            <Route path="bills" element={<PaymentsBillsPage />} />
            <Route path="airtime" element={<PaymentsAirtimePage />} />
            <Route path="bulk" element={<PaymentsBulkPage />} />
            <Route path="international" element={<PaymentsInternationalPage />} />
            <Route path="history" element={<PaymentsHistoryPage />} />
          </Route>
          <Route path="loans" element={<LoansPage />}>
            <Route index element={<LoansOverviewPage />} />
            <Route path="apply" element={<LoanApplicationPage />} />
            <Route path="calculator" element={<LoanCalculatorPage />} />
            <Route path=":id" element={<LoanDetailPage />} />
          </Route>
          <Route path="fx" element={<FxPage />}>
            <Route index element={<FxOverviewPage />} />
            <Route path="convert" element={<FxConvertPage />} />
            <Route path="trading-desk" element={<FxTradingDeskPage />} />
            <Route path="rates-history" element={<FxRatesHistoryPage />} />
          </Route>
          <Route path="treasury" element={<Navigate to="/app/fx" replace />} />
          <Route path="openbanking" element={<OpenBankingPage embedded />} />
          <Route path="agent" element={<AgentPage />}>
            <Route index element={<AgentDashboardPage />} />
            <Route path="transactions" element={<AgentTransactionsPage />} />
            <Route path="float" element={<AgentFloatPage />} />
            <Route path="network" element={<AgentNetworkPage />} />
          </Route>
          <Route path="compliance" element={<CompliancePage />}>
            <Route index element={<Navigate to="/app/compliance/kyc-queue" replace />} />
            <Route path="kyc-queue" element={<ComplianceKycQueuePage />} />
            <Route path="aml-alerts" element={<ComplianceAmlAlertsPage />} />
            <Route path="sanctions" element={<ComplianceSanctionsPage />} />
            <Route path="reports" element={<ComplianceReportsPage />} />
            <Route path="audit-trail" element={<ComplianceAuditTrailPage />} />
          </Route>
          <Route path="operations" element={<OperationsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
