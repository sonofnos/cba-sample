import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useCustomers } from "@/api/hooks";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/modules/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import { formatCompactNumber, formatDate } from "@/lib/format";
import type { CustomerRecord } from "@/lib/types";

const columnHelper = createColumnHelper<CustomerRecord>();

export function CustomersPage() {
  const { locale } = useI18n();
  const { data = [] } = useCustomers();
  const rows = data;

  const columns: ColumnDef<CustomerRecord, any>[] = [
    columnHelper.accessor((row) => row.name, {
      id: "search",
      header: "Customer",
      cell: (info) => (
        <div>
          <p className="font-medium">{info.row.original.name}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.relationshipManager}</p>
        </div>
      ),
    }),
    columnHelper.accessor("segment", { header: "Segment" }),
    columnHelper.accessor("market", { header: "Market" }),
    columnHelper.accessor("kycStatus", {
      header: "KYC",
      cell: (info) => (
        <Badge
          tone={
            info.getValue() === "Verified"
              ? "positive"
              : info.getValue() === "Pending"
                ? "warning"
                : "danger"
          }
        >
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor("riskScore", { header: "Risk" }),
    columnHelper.accessor("accounts", { header: "Accounts" }),
    columnHelper.accessor("totalExposure", {
      header: "Exposure",
      cell: (info) => `$${formatCompactNumber(info.getValue(), locale)}`,
    }),
    columnHelper.accessor("onboardingDate", {
      header: "Onboarded",
      cell: (info) => formatDate(info.getValue(), locale),
    }),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Customer 360"
        title="Customer portfolio"
        description="Segment mix, KYC status, risk scores, and total exposure across all active relationships."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total relationships</p>
            <p className="mt-3 font-display text-4xl font-semibold">{rows.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">Retail, SME and corporate</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Enhanced review</p>
            <p className="mt-3 font-display text-4xl font-semibold">
              {rows.filter((row) => row.kycStatus === "Enhanced Review").length}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">EDD in progress</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Corporate concentration</p>
            <p className="mt-3 font-display text-4xl font-semibold">
              {rows.filter((row) => row.segment === "Corporate").length}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Of total relationship count</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-primary/10 bg-white/80 dark:bg-white/5">
        <CardHeader>
          <CardTitle>Customer portfolio</CardTitle>
          <CardDescription>All active relationships visible under your current market filter.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={rows} searchPlaceholder="Search customers or relationship managers" />
        </CardContent>
      </Card>
    </div>
  );
}
