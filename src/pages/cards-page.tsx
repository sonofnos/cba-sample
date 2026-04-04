import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Bolt,
  Clapperboard,
  CreditCard,
  Fuel,
  Globe,
  Lock,
  Plane,
  ShoppingBasket,
  Smartphone,
  Snowflake,
  Store,
  Utensils,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import {
  useCard,
  useCardSettingsMutation,
  useCardTransactions,
  useCards,
  useCreateVirtualCardMutation,
  usePinChangeMutation,
  useReportCardMutation,
  useRequestPhysicalCardMutation,
  useRevealCardMutation,
} from "@/api/hooks";
import { accounts } from "@/data/seed";
import { cardCategoryOptions, categoryIcons, physicalCardProducts, seededCards } from "@/data/cards";
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
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { formatDate } from "@/lib/format";
import type { CardMerchantCategory, CardProduct, ManagedCard } from "@/lib/cards";
import type { MarketCode } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

const cardsNavItems = [
  { to: "/app/cards", label: "Overview" },
  { to: "/app/cards/request", label: "Request Physical" },
  { to: "/app/cards/virtual", label: "Create Virtual" },
];

const categoryIconMap = {
  Utensils,
  Fuel,
  ShoppingBasket,
  Globe,
  Plane,
  Clapperboard,
  Bolt,
};

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "NGN" ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getCardGradient(card: ManagedCard) {
  if (card.network === "Mastercard") {
    return "from-[#10392d] via-[#0A3D2E] to-[#C9A84C]";
  }

  return "from-[#123d5d] via-[#1f5b8d] to-[#62b5e5]";
}

function getStatusTone(status: ManagedCard["status"]) {
  if (status === "Active") return "positive";
  if (status === "Frozen") return "warning";
  return "danger";
}

function getLimitBounds(currency: string) {
  return currency === "NGN"
    ? { min: 10_000, max: 5_000_000, step: 10_000 }
    : { min: 50, max: 10_000, step: 50 };
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ChipIcon() {
  return (
    <svg viewBox="0 0 48 36" className="h-10 w-12">
      <rect x="1" y="1" width="46" height="34" rx="7" fill="#d8c38f" stroke="#f5ead0" strokeWidth="2" />
      <path d="M16 1v34M32 1v34M1 12h46M1 24h46" stroke="#9f8649" strokeWidth="1.4" />
      <rect x="12" y="10" width="24" height="16" rx="4" fill="#f1dfb0" stroke="#aa9352" />
    </svg>
  );
}

function ContactlessIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path d="M7 9a5 5 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 3a12 12 0 0 1 0 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function NetworkLogo({ network }: { network: ManagedCard["network"] }) {
  if (network === "Mastercard") {
    return (
      <svg viewBox="0 0 64 32" className="h-8 w-16">
        <circle cx="24" cy="16" r="12" fill="#ea001b" />
        <circle cx="40" cy="16" r="12" fill="#f79e1b" fillOpacity="0.92" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 72 28" className="h-7 w-16">
      <path d="M26 3c-4 0-8 10-8 11.5S22 26 26 26h5L36 3z" fill="#00579f" />
      <path d="M36 3 31 26h5c4 0 8-10 8-11.5S40 3 36 3z" fill="#faa61a" />
      <path d="M31 3h5l-5 23h-5z" fill="#f37021" />
    </svg>
  );
}

function CategoryIcon({ category }: { category: CardMerchantCategory }) {
  const iconName = categoryIcons[category];
  const Icon = categoryIconMap[iconName as keyof typeof categoryIconMap] ?? BadgeDollarSign;
  return <Icon className="h-4 w-4" />;
}

function CardVisual({
  card,
  showSensitive = false,
}: {
  card: ManagedCard;
  showSensitive?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      className={`card-3d w-full text-left ${card.status !== "Active" ? "grayscale saturate-0" : ""}`}
      onClick={() => setFlipped((current) => !current)}
    >
      <div className={`card-3d-inner relative aspect-[1.586] w-full rounded-[28px] transition-transform duration-700 ${flipped ? "is-flipped" : ""}`}>
        <div
          className={`card-3d-face absolute inset-0 overflow-hidden rounded-[28px] bg-gradient-to-br ${getCardGradient(card)} p-6 text-[#F5F0E8] shadow-panel`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-xl font-semibold">PanAfrika Bank</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/70">{card.mode}</p>
            </div>
            <Badge tone={getStatusTone(card.status)}>{card.status}</Badge>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <ChipIcon />
            <div className="text-white/80">
              <ContactlessIcon />
            </div>
          </div>

          <div className="mt-8">
            <p className="font-mono text-2xl tracking-[0.25em]">
              {showSensitive ? card.fullPan : card.maskedPan}
            </p>
          </div>

          <div className="mt-8 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">Cardholder</p>
              <p className="mt-2 text-sm font-medium tracking-[0.15em]">{card.holderName}</p>
              <p className="mt-3 text-xs text-white/70">
                {card.label} · {card.linkedCurrency}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">Expiry</p>
              <p className="mt-2 text-sm font-medium tracking-[0.18em]">{card.expiry}</p>
              <div className="mt-4 flex justify-end">
                <NetworkLogo network={card.network} />
              </div>
            </div>
          </div>
        </div>

        <div className="card-3d-face absolute inset-0 overflow-hidden rounded-[28px] bg-[#112720] p-6 text-[#F5F0E8] shadow-panel">
          <div className="mt-4 h-12 rounded-md bg-black/80" />
          <div className="mt-8 flex items-center justify-between rounded-xl bg-white/90 px-4 py-3 text-[#102a20]">
            <span className="text-xs uppercase tracking-[0.22em]">CVV</span>
            <span className="font-mono text-lg">{card.cvv}</span>
          </div>
          <div className="mt-8 space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">Linked account</p>
            <p className="font-mono text-sm">{card.linkedAccountNumber}</p>
            <p className="text-sm text-white/70">
              {card.linkedAccountName} · {card.linkedCurrency}
            </p>
          </div>
          <div className="mt-8 flex justify-end">
            <NetworkLogo network={card.network} />
          </div>
        </div>
      </div>
    </button>
  );
}

function ControlToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[24px] border border-border/70 bg-white/70 p-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-14 rounded-full transition ${checked ? "bg-[#0A3D2E]" : "bg-secondary"} disabled:opacity-50`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "left-8" : "left-1"}`}
        />
      </button>
    </div>
  );
}

export function CardsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Cards"
        title="Cards control center"
        description="Manage physical and virtual cards, transaction controls, card issuance, and spend settings from one card-services workspace."
      />

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-3 rounded-[28px] border border-border/70 bg-white/70 p-2 shadow-sm dark:bg-white/5">
          {cardsNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app/cards"}
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

      <Outlet />
    </div>
  );
}

export function CardsOverviewPage() {
  const { locale } = useI18n();
  const { data } = useCards();
  const cards = data?.data ?? seededCards;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <Badge tone="info">Active cards</Badge>
            <p className="mt-4 font-display text-3xl font-semibold">{cards.filter((card) => card.status === "Active").length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <Badge tone="warning">Virtual cards</Badge>
            <p className="mt-4 font-display text-3xl font-semibold">{cards.filter((card) => card.mode === "virtual").length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
          <CardContent className="p-6">
            <Badge tone="positive">Combined daily limit</Badge>
            <p className="mt-4 font-display text-3xl font-semibold">
              {formatMoney(
                cards.filter((card) => card.linkedCurrency === "NGN").reduce((sum, card) => sum + card.dailySpendLimit, 0),
                "NGN",
                locale,
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <div key={card.id} className="space-y-4">
              <CardVisual card={card} />
              <div className="space-y-3 rounded-[28px] border border-border/70 bg-white/85 p-5 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{card.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {card.linkedAccountName} · {card.maskedPan}
                    </p>
                  </div>
                  <Badge tone={getStatusTone(card.status)}>{card.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Daily limit</p>
                    <p className="mt-2 font-medium">{formatMoney(card.dailySpendLimit, card.linkedCurrency, locale)}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mode</p>
                    <p className="mt-2 font-medium capitalize">{card.mode}</p>
                  </div>
                </div>
                <Link
                  to={`/app/cards/${card.id}`}
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-surface-600"
                >
                  Manage card
                </Link>
              </div>
            </div>
          ))}
        </div>

        <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
          <CardHeader className="flex-col items-start gap-3">
            <CardTitle className="text-2xl text-[#F5F0E8]">Cards workspace</CardTitle>
            <CardDescription className="text-[#F5F0E8]/70">
              Jump directly into issuance, virtual-card provisioning, or full control settings for each card.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/app/cards/virtual" className="block rounded-[24px] bg-white/10 p-5 transition hover:bg-white/15">
              <p className="font-medium">Create instant virtual card</p>
              <p className="mt-2 text-sm text-[#F5F0E8]/70">Issue a new NGN or USD virtual card with custom expiry and spend limits.</p>
            </Link>
            <Link to="/app/cards/request" className="block rounded-[24px] bg-white/10 p-5 transition hover:bg-white/15">
              <p className="font-medium">Request a physical card</p>
              <p className="mt-2 text-sm text-[#F5F0E8]/70">Select Classic, Gold, Platinum, or World Elite and simulate doorstep fulfillment.</p>
            </Link>
            <div className="rounded-[24px] bg-white/10 p-5">
              <p className="font-medium">Tip</p>
              <p className="mt-2 text-sm text-[#F5F0E8]/70">
                Click any card to flip it and inspect the rear security panel. Freeze status immediately desaturates the card visual.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CardDetailPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const params = useParams();
  const cardId = params.id;
  const { data: cardsResponse } = useCards();
  const cards = cardsResponse?.data ?? seededCards;
  const { data: cardResponse } = useCard(cardId);
  const card = cardResponse?.data ?? cards.find((entry) => entry.id === cardId) ?? cards[0];
  const cardSettings = useCardSettingsMutation(card.id);
  const revealMutation = useRevealCardMutation(card.id);
  const reportMutation = useReportCardMutation(card.id);
  const pinChangeMutation = usePinChangeMutation(card.id);
  const [category, setCategory] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pin, setPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState("");
  const [revealed, setRevealed] = useState<{ fullPan: string; cvv: string } | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [limits, setLimits] = useState({
    dailySpendLimit: card.dailySpendLimit,
    posLimit: card.posLimit,
    atmLimit: card.atmLimit,
  });
  const { data: transactionResponse } = useCardTransactions({
    cardId: card.id,
    from: from || undefined,
    to: to || undefined,
    category,
  });
  const transactions = transactionResponse?.data ?? [];
  const bounds = getLimitBounds(card.linkedCurrency);

  useEffect(() => {
    setLimits({
      dailySpendLimit: card.dailySpendLimit,
      posLimit: card.posLimit,
      atmLimit: card.atmLimit,
    });
  }, [card.id, card.dailySpendLimit, card.posLimit, card.atmLimit]);

  useEffect(() => {
    if (remaining <= 0) {
      setRevealed(null);
      return;
    }

    const timer = window.setInterval(() => {
      setRemaining((current) => current - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remaining]);

  async function updateSettings(payload: Partial<ManagedCard>, successMessage: string) {
    setMessage("");
    try {
      await cardSettings.mutateAsync(payload);
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update card settings.");
    }
  }

  async function handleReveal() {
    setMessage("");
    if (!/^\d{4}$/.test(pin)) {
      setMessage("Enter any 4-digit PIN to reveal the card number.");
      return;
    }

    try {
      const response = await revealMutation.mutateAsync({ pin });
      setRevealed({
        fullPan: response.data.fullPan,
        cvv: response.data.cvv,
      });
      setRemaining(response.data.expiresInSeconds);
      setMessage("Sensitive card details unlocked for 30 seconds.");
      setPin("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reveal card number.");
    }
  }

  async function handleReport() {
    setMessage("");
    try {
      await reportMutation.mutateAsync({ reason: "lost_or_stolen" });
      setMessage("Card blocked and reported as lost/stolen.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to block card.");
    }
  }

  async function handlePinChange() {
    setMessage("");
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      setMessage("Enter valid current and new 4-digit PIN values.");
      return;
    }

    try {
      const response = await pinChangeMutation.mutateAsync({ currentPin, newPin });
      setMessage(response.message);
      setCurrentPin("");
      setNewPin("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PIN change request failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card className="rounded-[28px] border-primary/10 bg-white/85 p-0 dark:bg-white/5">
            <CardContent className="p-6">
              <CardVisual
                card={{
                  ...card,
                  fullPan: revealed?.fullPan ?? card.fullPan,
                  cvv: revealed?.cvv ?? card.cvv,
                }}
                showSensitive={Boolean(revealed)}
              />
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Linked account</p>
                  <p className="mt-2 font-medium">{card.linkedAccountName}</p>
                </div>
                <div className="rounded-2xl bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                  <p className="mt-2 font-medium">{card.status}</p>
                </div>
                <div className="rounded-2xl bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Expiry</p>
                  <p className="mt-2 font-medium">{card.expiry}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardHeader className="flex-col items-start gap-3">
              <SectionHeading
                title="Sensitive details"
                description="Reveal the full PAN for 30 seconds after PIN confirmation."
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Transaction PIN">
                <Input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="Any 4 digits"
                />
              </Field>
              <Button className="rounded-full" onClick={() => void handleReveal()} disabled={revealMutation.isPending}>
                {revealMutation.isPending ? "Unlocking..." : "View full card number"}
              </Button>
              {revealed ? (
                <div className="rounded-[24px] border border-[#C9A84C]/40 bg-[#F5F0E8] p-5">
                  <SummaryRow label="Card number" value={revealed.fullPan} />
                  <SummaryRow label="CVV" value={revealed.cvv} />
                  <SummaryRow label="Visible for" value={`${remaining}s`} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardHeader className="flex-col items-start gap-3">
              <SectionHeading
                title="Card controls"
                description="Control freeze status, transaction channels, and spend ceilings with immediate in-app updates."
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <ControlToggle
                label={card.status === "Frozen" ? "Unfreeze card" : "Freeze card"}
                description="Frozen cards decline POS, ATM, online, and wallet transactions."
                checked={card.status === "Frozen"}
                disabled={cardSettings.isPending}
                onChange={(checked) => void updateSettings({ status: checked ? "Frozen" : "Active" }, checked ? "Card frozen." : "Card unfrozen.")}
              />
              <ControlToggle
                label="Online transactions"
                description="Allow or deny e-commerce and subscription payments."
                checked={card.onlineEnabled}
                disabled={cardSettings.isPending}
                onChange={(checked) => void updateSettings({ onlineEnabled: checked }, "Online transaction setting updated.")}
              />
              <ControlToggle
                label="International transactions"
                description="Permit foreign-currency and cross-border card usage."
                checked={card.internationalEnabled}
                disabled={cardSettings.isPending}
                onChange={(checked) => void updateSettings({ internationalEnabled: checked }, "International transaction setting updated.")}
              />
              <ControlToggle
                label="Contactless"
                description="Enable tap-to-pay for supported terminals."
                checked={card.contactlessEnabled}
                disabled={cardSettings.isPending}
                onChange={(checked) => void updateSettings({ contactlessEnabled: checked }, "Contactless setting updated.")}
              />

              <div className="rounded-[24px] border border-border/70 bg-white/70 p-5">
                <p className="font-medium">Daily spend limit</p>
                <input
                  type="range"
                  min={bounds.min}
                  max={bounds.max}
                  step={bounds.step}
                  value={limits.dailySpendLimit}
                  onChange={(event) => setLimits((current) => ({ ...current, dailySpendLimit: Number(event.target.value) }))}
                  className="mt-4 w-full accent-[#0A3D2E]"
                />
                <p className="mt-3 text-sm text-muted-foreground">{formatMoney(limits.dailySpendLimit, card.linkedCurrency, locale)}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="POS limit">
                  <Input
                    type="number"
                    value={limits.posLimit}
                    onChange={(event) => setLimits((current) => ({ ...current, posLimit: Number(event.target.value) }))}
                  />
                </Field>
                <Field label="ATM withdrawal limit">
                  <Input
                    type="number"
                    value={limits.atmLimit}
                    onChange={(event) => setLimits((current) => ({ ...current, atmLimit: Number(event.target.value) }))}
                  />
                </Field>
              </div>

              <Button
                className="rounded-full"
                onClick={() =>
                  void updateSettings(
                    {
                      dailySpendLimit: limits.dailySpendLimit,
                      posLimit: limits.posLimit,
                      atmLimit: limits.atmLimit,
                    },
                    "Card limits updated.",
                  )
                }
                disabled={cardSettings.isPending}
              >
                Save limits
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardHeader className="flex-col items-start gap-3">
              <SectionHeading
                title="Exceptions"
                description="Block the card or queue a PIN-change request."
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="danger" className="rounded-full" onClick={() => void handleReport()} disabled={reportMutation.isPending}>
                  Report lost / stolen
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => navigate("/app/cards/request")}>
                  Request replacement card
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Current PIN">
                  <Input type="password" maxLength={4} value={currentPin} onChange={(event) => setCurrentPin(event.target.value)} />
                </Field>
                <Field label="New PIN">
                  <Input type="password" maxLength={4} value={newPin} onChange={(event) => setNewPin(event.target.value)} />
                </Field>
              </div>
              <Button variant="outline" className="rounded-full" onClick={() => void handlePinChange()} disabled={pinChangeMutation.isPending}>
                Request PIN change
              </Button>

              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-4">
          <SectionHeading
            title="Card transaction history"
            description="Filter spending by date range, category, and managed card."
          />
          <div className="grid w-full gap-4 md:grid-cols-4">
            <Field label="Card">
              <Select value={card.id} onChange={(event) => navigate(`/app/cards/${event.target.value}`)}>
                {cards.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label} · {entry.last4}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="From">
              <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </Field>
            <Field label="To">
              <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </Field>
            <Field label="Category">
              <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">All categories</option>
                {cardCategoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date, locale)}</TableCell>
                    <TableCell className="font-medium">{transaction.merchant}</TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-2 rounded-full bg-secondary/30 px-3 py-1">
                        <CategoryIcon category={transaction.category} />
                        <span>{transaction.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatMoney(transaction.amount, transaction.currency, locale)}</TableCell>
                    <TableCell>
                      <Badge tone={transaction.status === "completed" ? "positive" : transaction.status === "pending" ? "warning" : "danger"}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No card transactions matched the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function VirtualCardPage() {
  const { locale } = useI18n();
  const virtualMutation = useCreateVirtualCardMutation();
  const [message, setMessage] = useState("");
  const [card, setCard] = useState<ManagedCard | null>(null);
  const eligibleAccounts = accounts.filter((account) => account.currency === "NGN" || account.currency === "USD");
  const [form, setForm] = useState({
    linkedAccountId: eligibleAccounts[0]?.id ?? "",
    spendingLimit: eligibleAccounts[0]?.currency === "USD" ? 1500 : 250000,
    expiryPresetMonths: 3 as 1 | 3 | 12,
    currency: (eligibleAccounts[0]?.currency ?? "NGN") as "NGN" | "USD",
  });

  async function handleCreate() {
    setMessage("");
    const start = Date.now();
    try {
      const response = await virtualMutation.mutateAsync(form);
      const elapsed = Date.now() - start;
      if (elapsed < 1500) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500 - elapsed));
      }
      setCard(response.data);
      setMessage("Virtual card created. Full details are visible once on this screen.");
    } catch (error) {
      const elapsed = Date.now() - start;
      if (elapsed < 1500) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500 - elapsed));
      }
      setMessage(error instanceof Error ? error.message : "Unable to create virtual card.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-3">
          <SectionHeading
            title="Create instant virtual card"
            description="Issue a just-in-time NGN or USD virtual card with a custom spending limit and lifetime."
          />
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Funding account">
            <Select
              value={form.linkedAccountId}
              onChange={(event) => {
                const selected = eligibleAccounts.find((account) => account.id === event.target.value);
                setForm((current) => ({
                  ...current,
                  linkedAccountId: event.target.value,
                  currency: (selected?.currency ?? current.currency) as "NGN" | "USD",
                  spendingLimit: selected?.currency === "USD" ? 1500 : 250000,
                }));
              }}
            >
              {eligibleAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.type} · {account.currency} · {account.accountNumber}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Spending limit">
            <Input
              type="number"
              min="1"
              value={form.spendingLimit}
              onChange={(event) => setForm((current) => ({ ...current, spendingLimit: Number(event.target.value) }))}
            />
          </Field>

          <Field label="Expiry">
            <Select
              value={String(form.expiryPresetMonths)}
              onChange={(event) => setForm((current) => ({ ...current, expiryPresetMonths: Number(event.target.value) as 1 | 3 | 12 }))}
            >
              <option value="1">1 month</option>
              <option value="3">3 months</option>
              <option value="12">12 months</option>
            </Select>
          </Field>

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

          <Button className="rounded-full" onClick={() => void handleCreate()} disabled={virtualMutation.isPending}>
            {virtualMutation.isPending ? "Creating..." : "Create Virtual Card"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {card ? (
          <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
            <CardHeader className="flex-col items-start gap-3">
              <CardTitle className="text-2xl">New virtual card</CardTitle>
              <CardDescription>Full card details are exposed once immediately after issuance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <CardVisual card={card} showSensitive />
              <div className="rounded-[24px] border border-[#C9A84C]/40 bg-[#F5F0E8] p-5">
                <SummaryRow label="Full PAN" value={card.fullPan} />
                <SummaryRow label="CVV" value={card.cvv} />
                <SummaryRow label="Expiry" value={card.expiry} />
                <SummaryRow label="Spend limit" value={formatMoney(card.dailySpendLimit, card.linkedCurrency, locale)} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
            <CardHeader className="flex-col items-start gap-3">
              <CardTitle className="text-2xl text-[#F5F0E8]">Virtual issuance notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[#F5F0E8]/80">
              <div className="rounded-[24px] bg-white/10 p-4">
                <p className="font-medium">Supported currencies</p>
                <p className="mt-2">NGN and USD virtual cards can be generated instantly.</p>
              </div>
              <div className="rounded-[24px] bg-white/10 p-4">
                <p className="font-medium">Issuance posture</p>
                <p className="mt-2">Card details are shown immediately after creation, then managed from the overview or detail screen.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function CardRequestPage() {
  const user = useAuthStore((state) => state.user);
  const requestMutation = useRequestPhysicalCardMutation();
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{
    requestReference: string;
    product: CardProduct;
    timeline: string;
    trackingCode: string;
    status: string;
  } | null>(null);
  const [form, setForm] = useState({
    product: "Classic" as CardProduct,
    deliveryAddress: "14 Awolowo Road, Ikoyi",
    city: "Lagos",
    market: (user?.market ?? "NG") as Exclude<MarketCode, "ALL">,
    postalCode: "101241",
    deliveryNote: "Deliver to reception between 9am and 5pm",
  });

  async function handleSubmit() {
    setMessage("");
    try {
      const response = await requestMutation.mutateAsync(form);
      setResult(response.data);
      setMessage("Physical card request submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit card request.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="rounded-[28px] border-primary/10 bg-white/85 dark:bg-white/5">
        <CardHeader className="flex-col items-start gap-3">
          <SectionHeading
            title="Request new physical card"
            description="Choose the card tier, capture delivery details, and simulate fulfillment and tracking."
          />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {physicalCardProducts.map((product) => (
              <button
                key={product.value}
                type="button"
                onClick={() => setForm((current) => ({ ...current, product: product.value }))}
                className={`rounded-[24px] border p-4 text-left transition ${
                  form.product === product.value ? "border-[#0A3D2E] bg-[#0A3D2E] text-[#F5F0E8]" : "border-border bg-secondary/20"
                }`}
              >
                <p className="font-medium">{product.label}</p>
                <p className="mt-2 text-sm opacity-80">{product.copy}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] opacity-70">{product.fee}</p>
              </button>
            ))}
          </div>

          <Field label="Delivery address">
            <Textarea value={form.deliveryAddress} onChange={(event) => setForm((current) => ({ ...current, deliveryAddress: event.target.value }))} />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="City">
              <Input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
            </Field>
            <Field label="Market">
              <Input value={form.market} onChange={(event) => setForm((current) => ({ ...current, market: event.target.value as Exclude<MarketCode, "ALL"> }))} />
            </Field>
            <Field label="Postal code">
              <Input value={form.postalCode} onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))} />
            </Field>
          </div>

          <Field label="Delivery note">
            <Input value={form.deliveryNote} onChange={(event) => setForm((current) => ({ ...current, deliveryNote: event.target.value }))} />
          </Field>

          <div className="rounded-[24px] border border-[#C9A84C]/35 bg-[#F5F0E8] p-5">
            <p className="font-medium">Delivery timeline</p>
            <p className="mt-2 text-sm text-muted-foreground">Estimated delivery: 5-7 business days.</p>
          </div>

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

          <Button className="rounded-full" onClick={() => void handleSubmit()} disabled={requestMutation.isPending}>
            {requestMutation.isPending ? "Submitting..." : "Request physical card"}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-primary/10 bg-[#0A3D2E] text-[#F5F0E8]">
        <CardHeader className="flex-col items-start gap-3">
          <CardTitle className="text-2xl text-[#F5F0E8]">Tracking simulation</CardTitle>
          <CardDescription className="text-[#F5F0E8]/70">
            Fulfillment milestones appear after submission.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <>
              <div className="rounded-[24px] bg-white/10 p-4">
                <SummaryRow label="Request reference" value={result.requestReference} />
                <SummaryRow label="Tracking code" value={result.trackingCode} />
                <SummaryRow label="Product" value={result.product} />
                <SummaryRow label="Status" value={result.status} />
              </div>
              <div className="space-y-3">
                {["Request received", "Card production queued", "Dispatched to courier", "Out for delivery"].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-sm">
                    <div className={`h-3 w-3 rounded-full ${index < 2 ? "bg-[#C9A84C]" : "bg-white/30"}`} />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-[24px] bg-white/10 p-5 text-sm text-[#F5F0E8]/80">
              Submit a request to generate a live-looking tracking code and fulfillment milestones.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
