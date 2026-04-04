import { formatCompactNumber, formatPercent } from "@/lib/format";
import type { Locale, MarketPerformance } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MarketPerformanceTable({
  rows,
  locale,
}: {
  rows: MarketPerformance[];
  locale: Locale;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Market</TableHead>
            <TableHead>Deposits (USD)</TableHead>
            <TableHead>Loans (USD)</TableHead>
            <TableHead>Customers</TableHead>
            <TableHead>Open alerts</TableHead>
            <TableHead>NPL ratio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.market}>
              <TableCell className="font-medium">{row.market}</TableCell>
              <TableCell>{formatCompactNumber(row.deposits, locale)}</TableCell>
              <TableCell>{formatCompactNumber(row.loans, locale)}</TableCell>
              <TableCell>{row.customers}</TableCell>
              <TableCell>{row.alerts}</TableCell>
              <TableCell>{formatPercent(row.nplRatio, locale)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
