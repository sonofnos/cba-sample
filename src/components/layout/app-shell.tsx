import { useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  CreditCard,
  FileBarChart2,
  HandCoins,
  Landmark,
  LayoutGrid,
  MapPinned,
  ReceiptText,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  ShieldEllipsis,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { alerts, marketOptions } from "@/data/seed";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";

type NavEntry = {
  label: string;
  to: string;
  icon: typeof LayoutGrid;
};

type NavGroup = {
  title: string;
  entries: NavEntry[];
};

const roleNavigation: Record<string, NavGroup[]> = {
  customer: [
    {
      title: "Customer",
      entries: [
        { label: "Accounts", to: "/app", icon: LayoutGrid },
        { label: "Transactions", to: "/app/accounts", icon: ReceiptText },
        { label: "Transfer", to: "/app/payments/transfer", icon: Send },
        { label: "Cards", to: "/app/cards", icon: CreditCard },
        { label: "Loans", to: "/app/loans", icon: HandCoins },
        { label: "FX", to: "/app/fx", icon: WalletCards },
        { label: "Statements", to: "/app/accounts", icon: FileBarChart2 },
      ],
    },
  ],
  teller: [
    {
      title: "Teller",
      entries: [
        { label: "Customer Search", to: "/app", icon: Search },
        { label: "New Account", to: "/app/accounts", icon: Users },
        { label: "Cash Deposit/Withdrawal", to: "/app/payments", icon: Landmark },
        { label: "Agent Banking", to: "/app/agent", icon: MapPinned },
        { label: "Till Management", to: "/app/operations", icon: WalletCards },
      ],
    },
  ],
  compliance: [
    {
      title: "Compliance",
      entries: [
        { label: "KYC Queue", to: "/app/compliance/kyc-queue", icon: ShieldCheck },
        { label: "AML Alerts", to: "/app/compliance/aml-alerts", icon: ShieldEllipsis },
        { label: "Sanctions Screening", to: "/app/compliance/sanctions", icon: Search },
        { label: "Reports", to: "/app/compliance/reports", icon: FileBarChart2 },
      ],
    },
  ],
  admin: [
    {
      title: "Banking",
      entries: [
        { label: "Accounts", to: "/app", icon: LayoutGrid },
        { label: "Transactions", to: "/app/accounts", icon: ReceiptText },
        { label: "Transfer", to: "/app/payments/transfer", icon: Send },
        { label: "Cards", to: "/app/cards", icon: CreditCard },
        { label: "Loans", to: "/app/loans", icon: HandCoins },
        { label: "FX", to: "/app/fx", icon: WalletCards },
        { label: "Agent Banking", to: "/app/agent", icon: MapPinned },
        { label: "Compliance", to: "/app/compliance/aml-alerts", icon: ShieldCheck },
        { label: "Open Banking", to: "/app/openbanking", icon: Users },
      ],
    },
    {
      title: "Administration",
      entries: [
        { label: "User Management", to: "/app/customers", icon: UserCog },
        { label: "System Config", to: "/app/operations", icon: Settings2 },
        { label: "Audit Logs", to: "/app/compliance/audit-trail", icon: FileBarChart2 },
        { label: "Analytics", to: "/app/operations", icon: LayoutGrid },
      ],
    },
  ],
};

function getAlertTone(severity: string) {
  if (severity === "critical") return "bg-orange-100 text-orange-700";
  if (severity === "warning") return "bg-amber-100 text-amber-700";
  return "bg-sky-100 text-sky-700";
}

export function AppShell() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const market = useAppStore((state) => state.market);
  const setMarket = useAppStore((state) => state.setMarket);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navGroups = useMemo(() => {
    if (!user) {
      return [];
    }
    return roleNavigation[user.role] ?? roleNavigation.customer;
  }, [user]);

  const selectedMarket =
    marketOptions.find((option) => option.code === (market === "ALL" ? user?.market : market)) ??
    marketOptions[0];

  return (
    <div className="min-h-screen bg-[#f6efe5] dark:bg-[#0c231b]">
      <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
        <aside className="border-b border-white/10 bg-[#0A3D2E] px-5 py-6 text-[#F5F0E8] lg:border-b-0 lg:border-r">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#C9A84C] p-3 text-[#0A3D2E]">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold">PanAfrika Bank</p>
                <p className="text-xs text-[#F5F0E8]/60">Control Center</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[#F5F0E8]/50">Signed in as</p>
              <p className="mt-3 text-lg font-semibold">{user?.name}</p>
              <p className="text-sm capitalize text-[#F5F0E8]/72">{user?.role}</p>
              <div className="mt-4 rounded-2xl bg-black/15 px-4 py-3 text-sm text-[#F5F0E8]/72">
                Primary market: {selectedMarket.flag} {selectedMarket.label}
              </div>
            </div>

            <div className="space-y-6">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-3">
                  <p className="px-2 text-xs uppercase tracking-[0.24em] text-[#F5F0E8]/45">{group.title}</p>
                  <nav className="space-y-1">
                    {group.entries.map((entry) => {
                      const Icon = entry.icon;
                      return (
                        <NavLink
                          key={entry.label}
                          to={entry.to}
                          end={entry.to === "/app"}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#F5F0E8]/72 transition hover:bg-white/8 hover:text-white",
                              isActive && "bg-white text-[#0A3D2E] shadow-sm",
                            )
                          }
                        >
                          <Icon className="h-4 w-4" />
                          <span>{entry.label}</span>
                        </NavLink>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-[#d8ccbb] bg-[#F5F0E8]/90 px-4 py-4 backdrop-blur md:px-8 dark:border-white/10 dark:bg-[#102a20]/90">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-[#0A3D2E] p-3 text-[#F5F0E8]">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold">PanAfrika Bank</p>
                  <p className="text-sm text-muted-foreground">bank.portfolio.sonofnos.com</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Select
                  className="min-w-[230px] rounded-full bg-white dark:bg-white/5"
                  value={market === "ALL" ? user?.market : market}
                  onChange={(event) => setMarket(event.target.value as typeof market)}
                >
                  {marketOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.flag} {option.label} · {option.currency}
                    </option>
                  ))}
                </Select>

                <div className="relative">
                  <button
                    type="button"
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-foreground transition hover:border-primary/30 dark:bg-white/5"
                    aria-label="Notifications"
                    onClick={() => {
                      setNotificationsOpen((current) => !current);
                      setProfileOpen(false);
                    }}
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C46E4A] px-1 text-[10px] font-semibold text-white">
                      {alerts.length}
                    </span>
                  </button>
                  {notificationsOpen ? (
                    <div className="absolute right-0 mt-3 w-80 rounded-[24px] border border-border bg-white p-4 shadow-panel dark:bg-[#17352b]">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-display text-lg font-semibold">Notifications</p>
                        <span className="text-xs text-muted-foreground">{alerts.length} new</span>
                      </div>
                      <div className="space-y-3">
                        {alerts.map((alert) => (
                          <div key={alert.id} className="rounded-2xl border border-border/80 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium">{alert.title}</p>
                              <span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", getAlertTone(alert.severity))}>
                                {alert.severity}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
                            <p className="mt-2 text-xs text-muted-foreground">{alert.timestamp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-full border border-border bg-white px-3 py-2 text-left transition hover:border-primary/30 dark:bg-white/5"
                    onClick={() => {
                      setProfileOpen((current) => !current);
                      setNotificationsOpen(false);
                    }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A3D2E] text-sm font-semibold text-[#F5F0E8]">
                      {user?.name?.slice(0, 1) ?? "P"}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {profileOpen ? (
                    <div className="absolute right-0 mt-3 w-72 rounded-[24px] border border-border bg-white p-4 shadow-panel dark:bg-[#17352b]">
                      <p className="font-medium">{user?.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
                      <div className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground dark:bg-white/5">
                        {selectedMarket.flag} {selectedMarket.label} · {selectedMarket.currency}
                      </div>
                      <Button
                        className="mt-4 w-full rounded-full"
                        onClick={() => {
                          logout();
                          setMarket("ALL");
                          navigate("/login");
                        }}
                      >
                        Sign out
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
