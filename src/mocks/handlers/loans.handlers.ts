import { HttpResponse, http } from "msw";
import { loanProducts, seededLoans } from "@/data/loans";
import {
  calculateDebtToIncomeRatio,
  calculateLoan,
} from "@/lib/loans";
import type {
  LoanApplicationPayload,
  LoanApplicationResponse,
  LoanDecisionMutationResponse,
  ManagedLoan,
} from "@/lib/loans";
import { withNetworkDiscipline } from "@/mocks/utils";

const loansStore: ManagedLoan[] = structuredClone(seededLoans);
const pendingOffers = new Map<string, ManagedLoan>();

function findLoan(id: string) {
  const loan = loansStore.find((entry) => entry.id === id);
  if (!loan) {
    throw new Error("Loan not found");
  }
  return loan;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export const loansHandlers = [
  http.get("/api/loans", async () => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    return HttpResponse.json(
      {
        success: true,
        data: loansStore,
      },
      { status: 200 },
    );
  }),

  http.get("/api/loans/:id", async ({ params }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    try {
      return HttpResponse.json(
        {
          success: true,
          data: findLoan(String(params.id)),
        },
        { status: 200 },
      );
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "Loan not found",
        },
        { status: 404 },
      );
    }
  }),

  http.post("/api/loans/apply", async ({ request }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const payload = (await request.json()) as LoanApplicationPayload;
    const product = loanProducts.find((entry) => entry.type === payload.type);
    if (!product) {
      return HttpResponse.json(
        {
          success: false,
          message: "Invalid loan product.",
        },
        { status: 400 },
      );
    }

    const dti = calculateDebtToIncomeRatio(
      payload.monthlyIncome,
      payload.monthlyExpenses,
      payload.existingLoanObligations,
    );
    const needsCollateral =
      (payload.type === "Asset Finance" || payload.type === "Mortgage") &&
      (!payload.collateralValue || !payload.collateralDocumentUploaded);

    const referred =
      dti > 55 ||
      !payload.bankStatementsUploaded ||
      needsCollateral ||
      payload.amount > product.maxAmount;

    const applicationId = `loan-app-${Date.now()}`;

    if (referred) {
      const response: LoanApplicationResponse = {
        success: true,
        data: {
          applicationId,
          decision: "referred",
          reason: "Additional documents needed. Review collateral support, statement quality, or affordability metrics.",
        },
      };

      return HttpResponse.json(response, { status: 200 });
    }

    const tenorMonths =
      payload.type === "Salary Advance"
        ? Math.min(3, product.maxTenorMonths)
        : Math.min(Math.max(24, product.minTenorMonths), product.maxTenorMonths);
    const calculation = calculateLoan(
      payload.amount,
      product.baseRate,
      tenorMonths,
      new Date().toISOString(),
      0,
      Boolean(product.flatRate),
    );
    const approvedAmount =
      payload.type === "Business Loan" || payload.type === "Asset Finance"
        ? Math.round(payload.amount * 0.9)
        : payload.amount;
    const offerExpiryDate = addMonths(new Date(), 1).toISOString().slice(0, 10);
    const managedLoan: ManagedLoan = {
      id: applicationId,
      type: payload.type,
      purpose: payload.purpose,
      currency: product.currency,
      originalAmount: approvedAmount,
      disbursedAmount: approvedAmount,
      outstandingBalance: approvedAmount,
      interestRate: product.baseRate,
      tenorMonths,
      monthsRemaining: tenorMonths,
      monthlyRepayment: calculation.monthlyRepayment,
      nextPaymentDueDate: addMonths(new Date(), 1).toISOString(),
      disbursedAt: new Date().toISOString(),
      status: "Offer Ready",
      repaymentProgressPercent: 0,
      linkedAccountId: "cust-acct-current",
      linkedAccountBalance: 2_430_000,
      offerExpiryDate,
      amortization: calculation.amortization,
    };

    pendingOffers.set(applicationId, managedLoan);

    const response: LoanApplicationResponse = {
      success: true,
      data: {
        applicationId,
        decision: "approved",
        approvedAmount,
        interestRate: product.baseRate,
        tenorMonths,
        monthlyRepayment: calculation.monthlyRepayment,
        offerExpiryDate,
      },
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  http.post("/api/loans/:id/accept-offer", async ({ params }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    const id = String(params.id);
    const offerLoan = pendingOffers.get(id);

    if (!offerLoan) {
      return HttpResponse.json(
        {
          success: false,
          message: "Loan offer not found or already accepted.",
        },
        { status: 404 },
      );
    }

    const disbursedLoan = {
      ...offerLoan,
      status: "Active" as const,
    };
    loansStore.unshift(disbursedLoan);
    pendingOffers.delete(id);

    const response: LoanDecisionMutationResponse = {
      success: true,
      data: disbursedLoan,
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  http.post("/api/loans/:id/payment", async ({ params }) => {
    const failure = await withNetworkDiscipline();
    if (failure) {
      return failure;
    }

    try {
      const loan = findLoan(String(params.id));
      const dueRow = loan.amortization.find((row) => row.status === "due") ?? loan.amortization.find((row) => row.status === "upcoming");

      if (!dueRow) {
        return HttpResponse.json(
          {
            success: false,
            message: "No repayment installment is currently available.",
          },
          { status: 400 },
        );
      }

      if (loan.linkedAccountBalance < loan.monthlyRepayment) {
        return HttpResponse.json(
          {
            success: false,
            message: "Insufficient account balance for repayment debit.",
          },
          { status: 422 },
        );
      }

      loan.linkedAccountBalance -= loan.monthlyRepayment;
      dueRow.status = "paid";
      const nextRow = loan.amortization.find((row) => row.installmentNumber === dueRow.installmentNumber + 1);
      if (nextRow && nextRow.status === "upcoming") {
        nextRow.status = "due";
        loan.nextPaymentDueDate = nextRow.dueDate;
      }

      loan.outstandingBalance = dueRow.closingBalance;
      loan.monthsRemaining = Math.max(0, loan.monthsRemaining - 1);
      const paidCount = loan.amortization.filter((row) => row.status === "paid").length;
      loan.repaymentProgressPercent = Math.round((paidCount / loan.tenorMonths) * 100);

      return HttpResponse.json(
        {
          success: true,
          data: {
            loan,
            debitedAmount: loan.monthlyRepayment,
            remainingAccountBalance: loan.linkedAccountBalance,
            paymentReference: `LPM${Date.now()}`,
          },
        },
        { status: 200 },
      );
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : "Unable to process repayment.",
        },
        { status: 404 },
      );
    }
  }),
];
