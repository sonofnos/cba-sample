import { useMemo, useState } from "react";
import { useAccounts, useCreatePaymentMutation, useCustomers } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { useAppStore } from "@/store/app-store";
import type { AccountRecord, CurrencyCode, CustomerRecord, MarketCode } from "@/lib/types";

export function PaymentForm() {
  const market = useAppStore((state) => state.market);
  const { t } = useI18n();
  const { data: customers = [] } = useCustomers();
  const { data: accounts = [] } = useAccounts();
  const createPayment = useCreatePaymentMutation();

  const customerRows: CustomerRecord[] = customers;
  const accountRows: AccountRecord[] = accounts;
  const eligibleMarket = market === "ALL" ? customerRows[0]?.market ?? "NG" : market;

  const [form, setForm] = useState({
    customerId: "",
    debitAccountId: "",
    beneficiary: "",
    creditAccount: "",
    amount: "",
    currency: "NGN" as CurrencyCode,
    corridor: "Domestic",
    narrative: "",
  });

  const filteredAccounts = useMemo(
    () => accountRows.filter((account) => !form.customerId || account.customerId === form.customerId),
    [accountRows, form.customerId],
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t("payments.initiate")}</CardTitle>
          <CardDescription>Book a new transfer through the in-browser core banking rail emulator.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={form.customerId}
          onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value, debitAccountId: "" }))}
        >
          <option value="">Select customer</option>
          {customerRows.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </Select>
        <Select
          value={form.debitAccountId}
          onChange={(event) => {
            const account = filteredAccounts.find((entry) => entry.id === event.target.value);
            setForm((current) => ({
              ...current,
              debitAccountId: event.target.value,
              currency: account?.currency ?? current.currency,
            }));
          }}
        >
          <option value="">Debit account</option>
          {filteredAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.id} · {account.currency} · Avail {account.availableBalance.toLocaleString()}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Beneficiary"
          value={form.beneficiary}
          onChange={(event) => setForm((current) => ({ ...current, beneficiary: event.target.value }))}
        />
        <Input
          placeholder="Beneficiary account"
          value={form.creditAccount}
          onChange={(event) => setForm((current) => ({ ...current, creditAccount: event.target.value }))}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            type="number"
            min="0"
            placeholder="Amount"
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
          />
          <Input
            placeholder="Corridor"
            value={form.corridor}
            onChange={(event) => setForm((current) => ({ ...current, corridor: event.target.value }))}
          />
        </div>
        <Textarea
          placeholder="Narrative"
          value={form.narrative}
          onChange={(event) => setForm((current) => ({ ...current, narrative: event.target.value }))}
        />
        {createPayment.isError ? (
          <p className="text-sm text-danger">{createPayment.error.message}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Large transactions route to pending review automatically. Cross-border currencies default to SWIFT.
          </p>
        )}
        <Button
          className="w-full"
          disabled={createPayment.isPending}
          onClick={() =>
            createPayment.mutate({
              market: eligibleMarket,
              customerId: form.customerId,
              debitAccountId: form.debitAccountId,
              beneficiary: form.beneficiary,
              creditAccount: form.creditAccount,
              amount: Number(form.amount),
              currency: form.currency,
              corridor: form.corridor,
              narrative: form.narrative,
            })
          }
        >
          {createPayment.isPending ? "Submitting..." : t("payments.initiate")}
        </Button>
      </CardContent>
    </Card>
  );
}
