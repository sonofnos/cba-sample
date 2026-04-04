import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { fxBasePairs, generateHistoricalSeries, supportedFxCurrencies } from "@/data/fx";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/hooks/use-i18n";
import type { CurrencyCode } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { useFxRates, type SimulatedFxRate } from "@/utils/fxSimulator";

type FxContextValue = ReturnType<typeof useFxRates>;

type Timeframe = "1D" | "1W" | "1M" | "3M";

const fxNavItems = [
  { to: "/app/fx", label: "Rate Board" },
  { to: "/app/fx/convert", label: "Convert" },
  { to: "/app/fx/trading-desk", label: "Trading Desk" },
  { to: "/app/fx/rates-history", label: "Rates History" },
];

const seededPositions = [
  { id: "pos-001", pair: "USD/NGN", direction: "BUY" as const, amount: 250000, entryRate: 1579.2 },
  { id: "pos-002", pair: "EUR/NGN", direction: "SELL" as const, amount: 90000, entryRate: 1711.4 },
  { id: "pos-003", pair: "USD/ZAR", direction: "BUY" as const, amount: 140000, entryRate: 18.55 },
];

const seededDeals = [
  { id: "deal-001", pair: "USD/NGN", side: "BUY", amount: 85000, rate: 1580.6, counterparty: "Retail Branch Lagos" },
  { id: "deal-002", pair: "EUR/NGN", side: "SELL", amount: 42000, rate: 1709.4, counterparty: "Treasury Accra" },
  { id: "deal-003", pair: "USD/GHS", side: "BUY", amount: 65000, rate: 15.42, counterparty: "Corporate Sales" },
  { id: "deal-004", pair: "USD/KES", side: "SELL", amount: 72000, rate: 130.2, counterparty: "Nairobi Desk" },
];

function useFxDesk() {
  return useOutletContext<FxContextValue>();
}

function formatMoney(value: number, currency: string, locale: string, digits = 2) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatRate(value: number) {
  return value >= 100 ? value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) : value.toFixed(4);
}

function lastUpdatedLabel(updatedAt: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-NG", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(updatedAt));
}

function getDerivedQuote(rates: FxContextValue["rates"], from: CurrencyCode, to: CurrencyCode) {
  if (from === to) {
    return {
      pair: `${from}/${to}`,
      buy: 1,
      sell: 1,
      updatedAt: new Date().toISOString(),
      change: 0,
      changePercent: 0,
    };
  }

  const direct = rates[`${from}/${to}`];
  if (direct) {
    return direct;
  }

  const inverse = rates[`${to}/${from}`];
  if (inverse) {
    return {
      ...inverse,
      pair: `${from}/${to}`,
      buy: 1 / inverse.sell,
      sell: 1 / inverse.buy,
      change: -inverse.change,
      changePercent: -inverse.changePercent,
    };
  }

  const fromLeg = from === "USD" ? undefined : rates[`USD/${from}`];
  const toLeg = to === "USD" ? undefined : rates[`USD/${to}`];

  if (from === "USD" && toLeg) {
    return {
      ...toLeg,
      pair: `${from}/${to}`,
    };
  }

  if (to === "USD" && fromLeg) {
    return {
      ...fromLeg,
      pair: `${from}/${to}`,
      buy: 1 / fromLeg.sell,
      sell: 1 / fromLeg.buy,
      change: -fromLeg.change,
      changePercent: -fromLeg.changePercent,
    };
  }

  if (fromLeg && toLeg) {
    const buy = (1 / fromLeg.sell) * toLeg.buy;
    const sell = (1 / fromLeg.buy) * toLeg.sell;
    return {
      pair: `${from}/${to}`,
      base: from,
      quote: to,
      buy,
      sell,
      mid: (buy + sell) / 2,
      change: ((toLeg.mid - fromLeg.mid) / Math.max(fromLeg.mid, 1)) * 0.01,
      changePercent: toLeg.changePercent - fromLeg.changePercent,
      updatedAt: toLeg.updatedAt > fromLeg.updatedAt ? toLeg.updatedAt : fromLeg.updatedAt,
    };
  }

  return {
    pair: `${from}/${to}`,
    buy: 1,
    sell: 1,
    mid: 1,
    change: 0,
    changePercent: 0,
    updatedAt: new Date().toISOString(),
  };
}

function OrderBook({ rate }: { rate: SimulatedFxRate }) {
  const levels = Array.from({ length: 5 }, (_, index) => {
    const step = rate.mid * 0.00045 * (index + 1);
    return {
      level: index + 1,
      bid: rate.buy - step,
      ask: rate.sell + step,
      bidSize: Math.round(40 + Math.random() * 130),
      askSize: Math.round(40 + Math.random() * 130),
    };
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-4">
        <p className="mb-3 text-sm font-medium text-emerald-800">Bid ladder</p>
        <div className="space-y-2">
          {levels.map((level) => (
            <div key={`bid-${level.level}`} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm">
              <span>{formatRate(level.bid)}</span>
              <span className="text-muted-foreground">{level.bidSize}k</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[24px] border border-orange-200 bg-orange-50/70 p-4">
        <p className="mb-3 text-sm font-medium text-orange-800">Ask ladder</p>
        <div className="space-y-2">
          {levels.map((level) => (
            <div key={`ask-${level.level}`} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm">
              <span>{formatRate(level.ask)}</span>
              <span className="text-muted-foreground">{level.askSize}k</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function FxPage() {
  const simulator = useFxRates();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="FX Desk"
        title="PanAfrika foreign exchange trading desk"
        description="Live-looking retail conversion, branch rate board, treasury dealer workflow, and simulated historical price action from one FX workspace."
      />

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-3 rounded-[28px] border border-border/70 bg-white/70 p-2 shadow-sm dark:bg-white/5">
          {fxNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app/fx"}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive ? "bg-[#0A3D2E] text-[#F5F0E8]" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet context={simulator} />
    </div>
  );
}

export function FxOverviewPage() {
  const { locale } = useI18n();
  const { rates } = useFxDesk();
  const rateRows = Object.values(rates);
  const displayPairs = fxBasePairs.map((pair) => rates[pair.pair]).filter(Boolean);
  const majorRate = rates["USD/NGN"];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <Badge tone="positive">Spot headline</Badge>
            <p className="mt-4 font-display text-3xl font-semibold">{formatRate(majorRate.sell)}</p>
            <p className="mt-2 text-sm text-muted-foreground">USD/NGN sell</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <Badge tone="info">Tracked pairs</Badge>
            <p className="mt-4 font-display text-3xl font-semibold">{displayPairs.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <Badge tone="warning">Last updated</Badge>
            <p className="mt-4 text-sm font-medium">{lastUpdatedLabel(majorRate.updatedAt, locale)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <Badge tone={majorRate.changePercent >= 0 ? "positive" : "danger"}>
              {majorRate.changePercent >= 0 ? "▲" : "▼"} {majorRate.changePercent.toFixed(3)}%
            </Badge>
            <p className="mt-4 font-display text-3xl font-semibold">{formatRate(Math.abs(majorRate.change))}</p>
            <p className="mt-2 text-sm text-muted-foreground">Last tick move</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
        <CardHeader>
          <div>
            <CardTitle className="text-3xl text-[#F5F0E8]">Branch rate board</CardTitle>
            <CardDescription className="text-[#F5F0E8]/70">Live-looking rates updating every 3 seconds for branch screens and treasury monitoring.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[#F5F0E8]/65">Currency Pair</TableHead>
                <TableHead className="text-[#F5F0E8]/65">Buy</TableHead>
                <TableHead className="text-[#F5F0E8]/65">Sell</TableHead>
                <TableHead className="text-[#F5F0E8]/65">Change</TableHead>
                <TableHead className="text-[#F5F0E8]/65">Change %</TableHead>
                <TableHead className="text-[#F5F0E8]/65">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayPairs.map((rate) => (
                <TableRow key={rate.pair} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-semibold text-[#F5F0E8]">{rate.pair}</TableCell>
                  <TableCell className="text-[#F5F0E8]/90">{formatRate(rate.buy)}</TableCell>
                  <TableCell className="text-[#F5F0E8]/90">{formatRate(rate.sell)}</TableCell>
                  <TableCell className={rate.change >= 0 ? "text-emerald-300" : "text-orange-300"}>
                    {rate.change >= 0 ? "▲" : "▼"} {formatRate(Math.abs(rate.change))}
                  </TableCell>
                  <TableCell className={rate.changePercent >= 0 ? "text-emerald-300" : "text-orange-300"}>
                    {rate.changePercent >= 0 ? "+" : ""}
                    {rate.changePercent.toFixed(3)}%
                  </TableCell>
                  <TableCell className="text-[#F5F0E8]/70">{lastUpdatedLabel(rate.updatedAt, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader>
            <div>
              <CardTitle className="text-2xl">Cross-market highlights</CardTitle>
              <CardDescription>Desk-wide reference pairs and movement summary.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {["USD/NGN", "EUR/NGN", "GBP/NGN", "USD/ZAR"].map((pair) => {
              const rate = rates[pair];
              return (
                <div key={pair} className="rounded-[24px] border border-border/70 bg-secondary/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{pair}</p>
                    <Badge tone={rate.changePercent >= 0 ? "positive" : "danger"}>
                      {rate.changePercent >= 0 ? "▲" : "▼"} {rate.changePercent.toFixed(3)}%
                    </Badge>
                  </div>
                  <p className="mt-3 font-display text-3xl font-semibold">{formatRate(rate.sell)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Buy {formatRate(rate.buy)} | Sell {formatRate(rate.sell)}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader>
            <div>
              <CardTitle className="text-2xl">Intraday pulse</CardTitle>
              <CardDescription>Current change distribution across the FX board.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={rateRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d7c8b5" />
                  <XAxis dataKey="pair" angle={-25} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="changePercent">
                    {rateRows.map((entry) => (
                      <Cell key={entry.pair} fill={entry.changePercent >= 0 ? "#0A8F4A" : "#C46E4A"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function FxConvertPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { rates, convert } = useFxDesk();
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>("USD");
  const [toCurrency, setToCurrency] = useState<CurrencyCode>("NGN");
  const [amount, setAmount] = useState("1000");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [receipt, setReceipt] = useState<{
    amount: number;
    fromCurrency: CurrencyCode;
    toCurrency: CurrencyCode;
    converted: number;
    reference: string;
    rate: number;
    updatedAt: string;
  } | null>(null);

  const quote = useMemo(() => getDerivedQuote(rates, fromCurrency, toCurrency), [fromCurrency, rates, toCurrency]);
  const numericAmount = Number(amount || 0);
  const convertedAmount = useMemo(() => convert(numericAmount, fromCurrency, toCurrency), [amount, convert, fromCurrency, numericAmount, toCurrency]);

  useEffect(() => {
    setSecondsLeft(60);
  }, [fromCurrency, quote.updatedAt, toCurrency]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 60 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (receipt) {
    return (
      <div className="space-y-6">
        <Card className="rounded-[28px] border-emerald-200 bg-emerald-50/80">
          <CardContent className="p-8">
            <div className="mb-5 flex items-center gap-3">
              <Badge tone="positive">Conversion completed</Badge>
              <p className="font-display text-3xl font-semibold">FX receipt</p>
            </div>
            <div className="rounded-[24px] border border-emerald-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 text-sm">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium">{receipt.reference}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 text-sm">
                <span className="text-muted-foreground">You sold</span>
                <span className="font-medium">{formatMoney(receipt.amount, receipt.fromCurrency, locale)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 text-sm">
                <span className="text-muted-foreground">You received</span>
                <span className="font-medium">{formatMoney(receipt.converted, receipt.toCurrency, locale)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 text-sm">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium">1 {receipt.fromCurrency} = {formatRate(receipt.rate)} {receipt.toCurrency}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="text-muted-foreground">Timestamp</span>
                <span className="font-medium">{lastUpdatedLabel(receipt.updatedAt, locale)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button className="rounded-full" onClick={() => setReceipt(null)}>Convert Again</Button>
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/app/fx")}>Go to FX Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-3">
          <SectionHeading
            title="Retail FX conversion"
            description="Convert across all supported currencies with a live rate, spread visibility, and 60-second rate-validity timer."
          />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="From">
              <Select value={fromCurrency} onChange={(event) => setFromCurrency(event.target.value as CurrencyCode)}>
                {supportedFxCurrencies.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </Select>
            </Field>
            <Field label="To">
              <Select value={toCurrency} onChange={(event) => setToCurrency(event.target.value as CurrencyCode)}>
                {supportedFxCurrencies.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Amount">
            <Input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </Field>

          <div className="rounded-[24px] border border-[#C9A84C]/35 bg-[#F5F0E8] p-5">
            <p className="text-sm font-medium">Rate preview</p>
            <p className="mt-3 font-display text-4xl font-semibold">{formatMoney(convertedAmount, toCurrency, locale)}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              1 {fromCurrency} = {formatRate(quote.sell)} {toCurrency} · last updated {lastUpdatedLabel(quote.updatedAt, locale)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Bank buys at {formatRate(quote.buy)} | Bank sells at {formatRate(quote.sell)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Rate valid for {secondsLeft} seconds</p>
          </div>

          <Button
            className="rounded-full"
            onClick={() =>
              setReceipt({
                amount: numericAmount,
                fromCurrency,
                toCurrency,
                converted: convertedAmount,
                reference: `FXR${Date.now()}`,
                rate: quote.sell,
                updatedAt: quote.updatedAt,
              })
            }
          >
            Convert
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
        <CardHeader className="flex-col items-start gap-3">
          <CardTitle className="text-2xl text-[#F5F0E8]">Desk notes</CardTitle>
          <CardDescription className="text-[#F5F0E8]/70">
            Cross-currency quotes are synthesized from the live board using USD as the bridge currency where needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {["USD/NGN", "EUR/NGN", "GBP/USD"].map((pair) => {
            const rate = rates[pair];
            return (
              <div key={pair} className="rounded-[24px] bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{pair}</span>
                  <Badge tone={rate.changePercent >= 0 ? "positive" : "danger"}>
                    {rate.changePercent >= 0 ? "▲" : "▼"} {rate.changePercent.toFixed(3)}%
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-[#F5F0E8]/70">
                  Buy {formatRate(rate.buy)} | Sell {formatRate(rate.sell)}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export function FxTradingDeskPage() {
  const { locale } = useI18n();
  const user = useAuthStore((state) => state.user);
  const { rates } = useFxDesk();
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [pair, setPair] = useState("USD/NGN");
  const [amount, setAmount] = useState("100000");
  const [rateType, setRateType] = useState<"Market" | "Limit" | "Stop">("Market");
  const [positions, setPositions] = useState(seededPositions);
  const [deals, setDeals] = useState(
    seededDeals.map((deal, index) => ({
      ...deal,
      timestamp: new Date(Date.now() - index * 1_800_000).toISOString(),
    })),
  );

  if (!user || (user.role !== "admin" && user.role !== "teller")) {
    return (
      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardContent className="p-8">
          <Badge tone="warning">Restricted</Badge>
          <p className="mt-4 font-display text-3xl font-semibold">Dealer desk access is limited to teller and admin roles.</p>
        </CardContent>
      </Card>
    );
  }

  const selectedRate = rates[pair];
  const positionRows = positions.map((position) => {
    const liveRate = rates[position.pair]?.mid ?? position.entryRate;
    const pnl =
      position.direction === "BUY"
        ? (liveRate - position.entryRate) * position.amount
        : (position.entryRate - liveRate) * position.amount;

    return {
      ...position,
      currentRate: liveRate,
      pnl,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading
              title="Dealer order ticket"
              description="Book simulated market, limit, and stop orders into the treasury blotter."
            />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                className={`rounded-[24px] px-4 py-4 text-sm font-medium ${side === "BUY" ? "bg-[#0A3D2E] text-[#F5F0E8]" : "bg-secondary/20"}`}
                onClick={() => setSide("BUY")}
              >
                BUY
              </button>
              <button
                type="button"
                className={`rounded-[24px] px-4 py-4 text-sm font-medium ${side === "SELL" ? "bg-[#C46E4A] text-white" : "bg-secondary/20"}`}
                onClick={() => setSide("SELL")}
              >
                SELL
              </button>
            </div>

            <Field label="Currency pair">
              <Select value={pair} onChange={(event) => setPair(event.target.value)}>
                {fxBasePairs.map((entry) => (
                  <option key={entry.pair} value={entry.pair}>{entry.pair}</option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Amount">
                <Input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
              </Field>
              <Field label="Rate type">
                <Select value={rateType} onChange={(event) => setRateType(event.target.value as "Market" | "Limit" | "Stop")}>
                  <option value="Market">Market</option>
                  <option value="Limit">Limit</option>
                  <option value="Stop">Stop</option>
                </Select>
              </Field>
            </div>

            <div className="rounded-[24px] border border-[#C9A84C]/35 bg-[#F5F0E8] p-5">
              <p className="text-sm font-medium">Indicative execution</p>
              <p className="mt-3 font-display text-4xl font-semibold">{formatRate(selectedRate.mid)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Bid {formatRate(selectedRate.buy)} | Ask {formatRate(selectedRate.sell)}</p>
            </div>

            <Button
              className="rounded-full"
              onClick={() => {
                const tradeAmount = Number(amount || 0);
                const executionRate = side === "BUY" ? selectedRate.sell : selectedRate.buy;

                setPositions((current) => [
                  {
                    id: `pos-${Date.now()}`,
                    pair,
                    direction: side,
                    amount: tradeAmount,
                    entryRate: executionRate,
                  },
                  ...current,
                ]);

                setDeals((current) => [
                  {
                    id: `deal-${Date.now()}`,
                    pair,
                    side,
                    amount: tradeAmount,
                    rate: executionRate,
                    counterparty: rateType === "Market" ? "Spot Desk" : `${rateType} Queue`,
                    timestamp: new Date().toISOString(),
                  },
                  ...current,
                ].slice(0, 20));
              }}
            >
              Book deal
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
          <CardHeader>
            <div>
              <CardTitle className="text-2xl text-[#F5F0E8]">Order book simulation</CardTitle>
              <CardDescription className="text-[#F5F0E8]/70">Five levels on each side built around the ticking spot rate.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <OrderBook rate={selectedRate} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader>
            <div>
              <CardTitle className="text-2xl">Open positions</CardTitle>
              <CardDescription>P&amp;L revalues every 3 seconds as the desk rates tick.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positionRows.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">{position.pair}</TableCell>
                    <TableCell>{position.direction}</TableCell>
                    <TableCell>{position.amount.toLocaleString()}</TableCell>
                    <TableCell>{formatRate(position.entryRate)}</TableCell>
                    <TableCell>{formatRate(position.currentRate)}</TableCell>
                    <TableCell className={position.pnl >= 0 ? "text-emerald-700" : "text-orange-700"}>
                      {position.pnl >= 0 ? "+" : ""}
                      {position.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader>
            <div>
              <CardTitle className="text-2xl">Deal history blotter</CardTitle>
              <CardDescription>Last 20 simulated FX deals.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Pair</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Counterparty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>{lastUpdatedLabel(deal.timestamp, locale)}</TableCell>
                    <TableCell className="font-medium">{deal.pair}</TableCell>
                    <TableCell>{deal.side}</TableCell>
                    <TableCell>{deal.amount.toLocaleString()}</TableCell>
                    <TableCell>{formatRate(deal.rate)}</TableCell>
                    <TableCell>{deal.counterparty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function FxRatesHistoryPage() {
  const { locale } = useI18n();
  const { rates } = useFxDesk();
  const [pair, setPair] = useState("USD/NGN");
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const days = timeframe === "1D" ? 1 : timeframe === "1W" ? 7 : timeframe === "1M" ? 30 : 90;
  const series = useMemo(() => generateHistoricalSeries(pair, rates[pair]?.mid ?? 1, days), [days, pair, rates]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader className="flex-col items-start gap-3">
            <SectionHeading
              title="Historical rates"
              description="Simulated historical trend series generated from the live pair selection."
            />
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="Currency pair">
              <Select value={pair} onChange={(event) => setPair(event.target.value)}>
                {fxBasePairs.map((entry) => (
                  <option key={entry.pair} value={entry.pair}>{entry.pair}</option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-3 md:grid-cols-4">
              {(["1D", "1W", "1M", "3M"] as Timeframe[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-[24px] px-4 py-3 text-sm font-medium ${timeframe === value ? "bg-[#0A3D2E] text-[#F5F0E8]" : "bg-secondary/20"}`}
                  onClick={() => setTimeframe(value)}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="rounded-[24px] border border-[#C9A84C]/35 bg-[#F5F0E8] p-5">
              <p className="text-sm font-medium">Current mid</p>
              <p className="mt-3 font-display text-4xl font-semibold">{formatRate(rates[pair]?.mid ?? 0)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Updated {lastUpdatedLabel(rates[pair]?.updatedAt ?? new Date().toISOString(), locale)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardHeader>
            <div>
              <CardTitle className="text-2xl">{pair} trend</CardTitle>
              <CardDescription>{timeframe} simulated price history.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer>
                <ComposedChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d7c8b5" />
                  <XAxis dataKey="label" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="rate" stroke="#0A3D2E" fill="rgba(10,61,46,0.18)" />
                  <Bar yAxisId="right" dataKey="volume" fill="#C9A84C" opacity={0.55} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
