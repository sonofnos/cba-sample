import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useAccounts } from "@/api/hooks";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/modules/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import { formatCurrency } from "@/lib/format";
import type { AccountRecord } from "@/lib/types";

const columnHelper = createColumnHelper<AccountRecord>();

export function AccountsPage() {
  const { locale } = useI18n();
  const { data = [] } = useAccounts();
  const rows = data;

  const columns: ColumnDef<AccountRecord, any>[] = [
    columnHelper.accessor((row) => `${row.customerName} ${row.id}`, {
      id: "search",
      header: "Account",
      cell: (info) => (
        <div>
          <p className="font-medium">{info.row.original.name}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.customerName}</p>
        </div>
      ),
    }),
    columnHelper.accessor("type", { header: "Type" }),
    columnHelper.accessor("branchName", { header: "Branch" }),
    columnHelper.accessor("currency", { header: "Currency" }),
    columnHelper.accessor("balance", {
      header: "Ledger balance",
      cell: (info) => formatCurrency(info.getValue(), info.row.original.currency, locale),
    }),
    columnHelper.accessor("availableBalance", {
      header: "Available",
      cell: (info) => formatCurrency(info.getValue(), info.row.original.currency, locale),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <Badge tone={info.getValue() === "Active" ? "positive" : info.getValue() === "Dormant" ? "warning" : "danger"}>
          {info.getValue()}
        </Badge>
      ),
    }),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Deposits"
        title="Deposit books, current accounts and liquidity positions by relationship"
        description="Operators can inspect status, balances and branch alignment for current, savings, domiciliary and treasury accounts."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active accounts</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-display font-semibold">
            {rows.filter((row) => row.status === "Active").length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Watchlist exposure</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-display font-semibold">
            {rows.filter((row) => row.status === "Watchlist").length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Branches represented</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-display font-semibold">
            {new Set(rows.map((row) => row.branchName)).size}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account register</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={rows} searchPlaceholder="Search account, customer or branch" />
        </CardContent>
      </Card>
    </div>
  );
}
