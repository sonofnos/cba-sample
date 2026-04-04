import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useCustomers } from "@/api/hooks";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/modules/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        title="Relationship, KYC and exposure visibility on a single surface"
        description="Portfolio managers can inspect segment mix, KYC status, exposure concentration and onboarding maturity across every supported market."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total relationships</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-display font-semibold">{rows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Enhanced review</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-display font-semibold">
            {rows.filter((row) => row.kycStatus === "Enhanced Review").length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Corporate concentration</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-display font-semibold">
            {rows.filter((row) => row.segment === "Corporate").length}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={rows} searchPlaceholder="Search customers or relationship managers" />
        </CardContent>
      </Card>
    </div>
  );
}
