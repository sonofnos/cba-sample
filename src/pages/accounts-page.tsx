import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useAccounts } from "@/api/hooks";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/modules/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        title="Account register"
        description="Current, savings, domiciliary, and treasury accounts across all relationships and branches."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active accounts</p>
            <p className="mt-3 font-display text-4xl font-semibold">
              {rows.filter((row) => row.status === "Active").length}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Across all markets and branches</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Watchlist exposure</p>
            <p className="mt-3 font-display text-4xl font-semibold">
              {rows.filter((row) => row.status === "Watchlist").length}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Flagged for enhanced monitoring</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Branches represented</p>
            <p className="mt-3 font-display text-4xl font-semibold">
              {new Set(rows.map((row) => row.branchName)).size}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Unique branch entities in view</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
        <CardHeader>
          <CardTitle>Account register</CardTitle>
          <CardDescription>All deposit and treasury accounts visible to your market filter.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={rows} searchPlaceholder="Search account, customer or branch" />
        </CardContent>
      </Card>
    </div>
  );
}
