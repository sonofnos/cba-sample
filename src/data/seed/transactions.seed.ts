import { SEED_ACCOUNTS } from "@/data/seed/accounts.seed";
import type { CurrencyCode } from "@/lib/types";

export interface SeedTransaction {
  id: string;
  accountId: string;
  accountNumber: string;
  type: "credit" | "debit";
  amount: number;
  currency: CurrencyCode;
  channel: "NIP" | "POS" | "ATM" | "WEB" | "SWIFT" | "USSD";
  category:
    | "salary"
    | "transfer"
    | "pos"
    | "atm"
    | "utility"
    | "airtime"
    | "international"
    | "savings"
    | "cashback";
  merchantName: string;
  description: string;
  reference: string;
  postedAt: string;
  balanceAfter: number;
}

type Template = Omit<SeedTransaction, "id" | "accountNumber" | "reference" | "balanceAfter">;

const current = SEED_ACCOUNTS[0];
const savings = SEED_ACCOUNTS[1];
const domiciliary = SEED_ACCOUNTS[2];

const templates: Template[] = [
  { accountId: current.id, type: "credit", amount: 475_000, currency: "NGN", channel: "NIP", category: "salary", merchantName: "PanAfrika Payroll", description: "April salary credit", postedAt: "2026-04-01T07:12:00Z" },
  { accountId: current.id, type: "debit", amount: 35_500, currency: "NGN", channel: "POS", category: "pos", merchantName: "Shoprite Ikeja", description: "POS purchase at Shoprite Ikeja City Mall", postedAt: "2026-04-01T18:11:00Z" },
  { accountId: current.id, type: "debit", amount: 12_000, currency: "NGN", channel: "USSD", category: "airtime", merchantName: "MTN Nigeria", description: "Airtime top-up via USSD", postedAt: "2026-04-02T08:41:00Z" },
  { accountId: current.id, type: "debit", amount: 18_750, currency: "NGN", channel: "WEB", category: "utility", merchantName: "Eko Electricity", description: "Prepaid meter token purchase", postedAt: "2026-04-02T13:16:00Z" },
  { accountId: current.id, type: "credit", amount: 95_000, currency: "NGN", channel: "NIP", category: "transfer", merchantName: "Kuda Bank", description: "Transfer from Ifeanyi Okafor", postedAt: "2026-04-02T17:23:00Z" },
  { accountId: current.id, type: "debit", amount: 5_000, currency: "NGN", channel: "ATM", category: "atm", merchantName: "GTBank ATM Lekki", description: "Cash withdrawal at GTBank ATM Lekki", postedAt: "2026-04-03T09:02:00Z" },
  { accountId: current.id, type: "debit", amount: 44_200, currency: "NGN", channel: "POS", category: "pos", merchantName: "Domino's Pizza VI", description: "Card payment at Domino's Pizza Victoria Island", postedAt: "2026-04-03T20:14:00Z" },
  { accountId: current.id, type: "credit", amount: 250_000, currency: "NGN", channel: "NIP", category: "transfer", merchantName: "Access Bank", description: "Project reimbursement from Kemi Afolabi", postedAt: "2026-04-04T10:05:00Z" },
  { accountId: current.id, type: "debit", amount: 120_000, currency: "NGN", channel: "WEB", category: "transfer", merchantName: "JumiaPay", description: "Transfer to landlord via JumiaPay", postedAt: "2026-04-04T15:31:00Z" },
  { accountId: current.id, type: "debit", amount: 8_500, currency: "NGN", channel: "POS", category: "pos", merchantName: "Chicken Republic Yaba", description: "POS payment at Chicken Republic Yaba", postedAt: "2026-04-05T12:18:00Z" },
  { accountId: current.id, type: "debit", amount: 55_000, currency: "NGN", channel: "NIP", category: "transfer", merchantName: "Sterling Bank", description: "Transfer to Chidinma Nnaji", postedAt: "2026-04-05T16:22:00Z" },
  { accountId: current.id, type: "credit", amount: 30_000, currency: "NGN", channel: "NIP", category: "cashback", merchantName: "Moniepoint", description: "Refund from merchant dispute", postedAt: "2026-04-06T11:04:00Z" },
  { accountId: current.id, type: "debit", amount: 15_250, currency: "NGN", channel: "WEB", category: "utility", merchantName: "IKEDC Quickteller", description: "Electricity bill via Quickteller", postedAt: "2026-04-06T19:37:00Z" },
  { accountId: current.id, type: "debit", amount: 4_000, currency: "NGN", channel: "ATM", category: "atm", merchantName: "UBA ATM Allen", description: "Cash withdrawal at UBA Allen Avenue", postedAt: "2026-04-07T07:42:00Z" },
  { accountId: current.id, type: "credit", amount: 68_000, currency: "NGN", channel: "NIP", category: "transfer", merchantName: "First Bank", description: "Transfer from Ngozi Umeh", postedAt: "2026-04-07T15:55:00Z" },
  { accountId: current.id, type: "debit", amount: 23_500, currency: "NGN", channel: "POS", category: "pos", merchantName: "Market Square Lekki", description: "Groceries at Market Square Lekki", postedAt: "2026-04-08T18:10:00Z" },
  { accountId: current.id, type: "debit", amount: 9_800, currency: "NGN", channel: "USSD", category: "airtime", merchantName: "Airtel Nigeria", description: "Airtime and data purchase", postedAt: "2026-04-09T08:09:00Z" },
  { accountId: current.id, type: "credit", amount: 180_000, currency: "NGN", channel: "NIP", category: "transfer", merchantName: "Zenith Bank", description: "Transfer from Tunde Bello", postedAt: "2026-04-09T17:32:00Z" },
  { accountId: current.id, type: "debit", amount: 65_500, currency: "NGN", channel: "WEB", category: "utility", merchantName: "Lagos Water Corp", description: "Water utility settlement", postedAt: "2026-04-10T09:28:00Z" },
  { accountId: current.id, type: "debit", amount: 14_600, currency: "NGN", channel: "POS", category: "pos", merchantName: "MedPlus Pharmacy", description: "Card payment at MedPlus Pharmacy", postedAt: "2026-04-10T19:12:00Z" },
  { accountId: savings.id, type: "credit", amount: 120_000, currency: "NGN", channel: "NIP", category: "savings", merchantName: "Internal Transfer", description: "Standing order from current account", postedAt: "2026-03-03T06:15:00Z" },
  { accountId: savings.id, type: "credit", amount: 85_000, currency: "NGN", channel: "NIP", category: "savings", merchantName: "PalmPay", description: "Savings sweep from wallet", postedAt: "2026-03-07T06:45:00Z" },
  { accountId: savings.id, type: "credit", amount: 50_000, currency: "NGN", channel: "NIP", category: "savings", merchantName: "OPay", description: "Goal savings transfer", postedAt: "2026-03-09T07:10:00Z" },
  { accountId: savings.id, type: "debit", amount: 40_000, currency: "NGN", channel: "NIP", category: "transfer", merchantName: "Access Bank", description: "Transfer to current account", postedAt: "2026-03-12T13:31:00Z" },
  { accountId: savings.id, type: "credit", amount: 2_500, currency: "NGN", channel: "WEB", category: "cashback", merchantName: "PanAfrika Bank", description: "Monthly interest accrual", postedAt: "2026-03-31T23:50:00Z" },
  { accountId: savings.id, type: "credit", amount: 70_000, currency: "NGN", channel: "NIP", category: "savings", merchantName: "Internal Transfer", description: "Top-up from salary account", postedAt: "2026-04-01T07:15:00Z" },
  { accountId: savings.id, type: "debit", amount: 25_000, currency: "NGN", channel: "NIP", category: "transfer", merchantName: "GTBank", description: "School fees support transfer", postedAt: "2026-04-02T16:55:00Z" },
  { accountId: savings.id, type: "credit", amount: 90_000, currency: "NGN", channel: "NIP", category: "savings", merchantName: "Internal Transfer", description: "Emergency fund contribution", postedAt: "2026-04-04T08:40:00Z" },
  { accountId: savings.id, type: "debit", amount: 15_000, currency: "NGN", channel: "ATM", category: "atm", merchantName: "First Bank ATM Surulere", description: "Cardless withdrawal", postedAt: "2026-04-05T09:33:00Z" },
  { accountId: savings.id, type: "credit", amount: 5_400, currency: "NGN", channel: "WEB", category: "cashback", merchantName: "PanAfrika Bank", description: "Bonus saver interest", postedAt: "2026-04-05T23:50:00Z" },
  { accountId: savings.id, type: "debit", amount: 12_500, currency: "NGN", channel: "POS", category: "pos", merchantName: "Prince Ebeano Supermarket", description: "POS payment at Ebeano", postedAt: "2026-04-06T17:11:00Z" },
  { accountId: savings.id, type: "credit", amount: 65_000, currency: "NGN", channel: "NIP", category: "savings", merchantName: "Kuda Bank", description: "Savings transfer from side hustle income", postedAt: "2026-04-07T14:28:00Z" },
  { accountId: savings.id, type: "debit", amount: 55_000, currency: "NGN", channel: "WEB", category: "transfer", merchantName: "Cowrywise", description: "Investment plan funding", postedAt: "2026-04-08T10:06:00Z" },
  { accountId: savings.id, type: "credit", amount: 35_000, currency: "NGN", channel: "NIP", category: "savings", merchantName: "Moniepoint", description: "Transfer from savings club", postedAt: "2026-04-08T19:44:00Z" },
  { accountId: savings.id, type: "debit", amount: 18_000, currency: "NGN", channel: "WEB", category: "utility", merchantName: "Spectranet", description: "Internet subscription payment", postedAt: "2026-04-09T07:57:00Z" },
  { accountId: savings.id, type: "credit", amount: 40_000, currency: "NGN", channel: "NIP", category: "savings", merchantName: "Internal Transfer", description: "Weekly savings trigger", postedAt: "2026-04-10T06:03:00Z" },
  { accountId: savings.id, type: "debit", amount: 10_000, currency: "NGN", channel: "POS", category: "pos", merchantName: "Filmhouse Cinemas", description: "Movie tickets and snacks", postedAt: "2026-04-10T19:20:00Z" },
  { accountId: savings.id, type: "credit", amount: 4_800, currency: "NGN", channel: "WEB", category: "cashback", merchantName: "PanAfrika Bank", description: "Quarterly saver bonus", postedAt: "2026-04-11T00:02:00Z" },
  { accountId: savings.id, type: "credit", amount: 100_000, currency: "NGN", channel: "NIP", category: "savings", merchantName: "Access Bank", description: "Funds moved from current account", postedAt: "2026-04-11T08:14:00Z" },
  { accountId: savings.id, type: "debit", amount: 20_000, currency: "NGN", channel: "NIP", category: "transfer", merchantName: "UBA", description: "Transfer to mum", postedAt: "2026-04-11T18:36:00Z" },
  { accountId: domiciliary.id, type: "credit", amount: 750, currency: "USD", channel: "SWIFT", category: "international", merchantName: "Upwork Escrow", description: "International freelance receipt", postedAt: "2026-03-18T13:00:00Z" },
  { accountId: domiciliary.id, type: "credit", amount: 1_200, currency: "USD", channel: "SWIFT", category: "international", merchantName: "Wise Europe", description: "Family remittance from London", postedAt: "2026-03-25T09:25:00Z" },
  { accountId: domiciliary.id, type: "debit", amount: 180, currency: "USD", channel: "WEB", category: "international", merchantName: "Amazon Web Services", description: "AWS business account charge", postedAt: "2026-03-28T02:10:00Z" },
  { accountId: domiciliary.id, type: "debit", amount: 95, currency: "USD", channel: "WEB", category: "international", merchantName: "Namecheap", description: "Annual domain and hosting renewal", postedAt: "2026-03-30T11:41:00Z" },
  { accountId: domiciliary.id, type: "credit", amount: 420, currency: "USD", channel: "SWIFT", category: "international", merchantName: "Payoneer", description: "Marketplace settlement", postedAt: "2026-04-01T16:20:00Z" },
  { accountId: domiciliary.id, type: "debit", amount: 60, currency: "USD", channel: "WEB", category: "international", merchantName: "Canva US", description: "Design subscription renewal", postedAt: "2026-04-03T08:12:00Z" },
  { accountId: domiciliary.id, type: "credit", amount: 300, currency: "USD", channel: "SWIFT", category: "international", merchantName: "Stripe Treasury", description: "Foreign merchant settlement", postedAt: "2026-04-04T14:44:00Z" },
  { accountId: domiciliary.id, type: "debit", amount: 250, currency: "USD", channel: "SWIFT", category: "international", merchantName: "Air France", description: "International travel booking", postedAt: "2026-04-06T05:30:00Z" },
  { accountId: domiciliary.id, type: "credit", amount: 185, currency: "USD", channel: "SWIFT", category: "international", merchantName: "Google AdSense", description: "Ad revenue payout", postedAt: "2026-04-08T10:50:00Z" },
  { accountId: domiciliary.id, type: "debit", amount: 125, currency: "USD", channel: "WEB", category: "international", merchantName: "Adobe Inc", description: "Creative Cloud subscription", postedAt: "2026-04-10T06:40:00Z" },
];

function buildSeedTransactions() {
  const startingBalances = new Map<string, number>(
    SEED_ACCOUNTS.map((account) => [account.id, account.availableBalance]),
  );

  return templates.map((transaction, index) => {
    const account = SEED_ACCOUNTS.find((entry) => entry.id === transaction.accountId)!;
    const currentBalance = startingBalances.get(transaction.accountId) ?? account.availableBalance;
    const nextBalance =
      transaction.type === "credit"
        ? currentBalance + transaction.amount
        : currentBalance - transaction.amount;

    startingBalances.set(transaction.accountId, nextBalance);

    return {
      ...transaction,
      id: `txn-${String(index + 1).padStart(3, "0")}`,
      accountNumber: account.accountNumber,
      reference: `${transaction.channel}${Date.parse(transaction.postedAt)}${index + 1}`,
      balanceAfter: Number(nextBalance.toFixed(2)),
    };
  });
}

export const SEED_TRANSACTIONS: SeedTransaction[] = buildSeedTransactions();
