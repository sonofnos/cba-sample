import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CreditCard,
  Globe,
  HandCoins,
  Landmark,
  Network,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AfricaNetworkMap } from "@/components/landing/africa-network-map";
import { ArchitectureDiagram } from "@/components/landing/architecture-diagram";
import { Counter } from "@/components/landing/counter";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";

const moduleCards = [
  { title: "Core Banking", description: "Customer, account, branch and teller operations running from a single ledger worldview.", to: "/app", icon: Landmark },
  { title: "Payments", description: "Domestic, regional and cross-border routing across instant, RTGS, ACH and SWIFT rails.", to: "/app/payments", icon: Wallet },
  { title: "Loans", description: "Origination, approval and portfolio controls for retail, SME and corporate credit.", to: "/app/loans", icon: HandCoins },
  { title: "Cards", description: "Card issuance, controls, limits and lifecycle orchestration across debit and virtual products.", to: "/login", icon: CreditCard },
  { title: "FX Trading Desk", description: "Treasury positions, intraday utilization and executable FX quotes across supported markets.", to: "/app/fx", icon: Globe },
  { title: "Compliance & KYC", description: "AML surveillance, risk flags, regulator-specific workflows and KYC review management.", to: "/app/compliance", icon: ShieldCheck },
  { title: "Agent Banking", description: "Field banking operations, assisted-service journeys and last-mile customer access simulations.", to: "/app/agent", icon: Building2 },
  { title: "Open Banking API", description: "Third-party consent, connectivity and sandbox integrations for modern ecosystem access.", to: "/login", icon: Network },
];

const stack = [
  { label: "React 18 + Vite", icon: Smartphone },
  { label: "TypeScript", icon: BadgeCheck },
  { label: "Tailwind + shadcn/ui", icon: ScrollText },
  { label: "Zustand + React Query", icon: Network },
  { label: "MSW API Simulation", icon: ShieldCheck },
];

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-5 md:px-8">
        <header className="sticky top-4 z-30">
          <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/60 bg-white/70 px-4 py-3 shadow-panel backdrop-blur-md dark:border-white/10 dark:bg-[#0D2E24]/75">
            <Link to="/" className="flex items-center gap-3">
              <div className="rounded-full bg-primary p-2 text-primary-foreground">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold">PanAfrika Bank</p>
                <p className="text-xs text-muted-foreground">bank.portfolio.sonofnos.com</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
              <a href="#overview" className="transition hover:text-primary">Overview</a>
              <a href="#modules" className="transition hover:text-primary">Modules</a>
              <a href="#architecture" className="transition hover:text-primary">Architecture</a>
              <Link to="/app" className="transition hover:text-primary">Launch App</Link>
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <Link to="/app" className={buttonVariants({ className: "hidden rounded-full px-5 lg:inline-flex" })}>
                Launch App
              </Link>
            </div>
          </div>
        </header>

        <main className="space-y-10 pt-10">
          <section
            id="overview"
            className="grid gap-8 rounded-[40px] border border-white/60 bg-[linear-gradient(135deg,rgba(245,240,232,0.88),rgba(245,240,232,0.62))] p-6 shadow-panel backdrop-blur md:p-8 xl:grid-cols-[1.05fr_0.95fr] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(13,46,36,0.9),rgba(9,34,27,0.82))]"
          >
            <div className="flex flex-col justify-center gap-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-4 py-2 text-sm font-medium text-[#7F6221] dark:text-[#E6D39A]">
                Fictional pan-African bank. Production-grade emulator. Lagos HQ.
              </div>

              <div className="space-y-5">
                <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-6xl xl:text-7xl">
                  Banking Infrastructure for a Continent
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  PanAfrika Bank is a fictional multinational bank headquartered in Lagos, modeled across
                  Nigeria, Ghana, Kenya, South Africa, Senegal, Rwanda, and Zambia. This showcase demonstrates
                  an end-to-end core banking application emulator spanning accounts, payments, credit, cards,
                  treasury, compliance, operations, and ecosystem APIs.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/app" className={buttonVariants({ size: "lg", className: "rounded-full px-6" })}>
                  Launch Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/architecture"
                  className={buttonVariants({
                    size: "lg",
                    variant: "outline",
                    className: "rounded-full border-primary/20 bg-transparent px-6",
                  })}
                >
                  View Architecture
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-[#C9A84C]/20 bg-white/65 dark:bg-white/5">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Identity</p>
                    <p className="mt-3 text-sm leading-6">Corporate fintech visual language grounded in African markets and regulatory realities.</p>
                  </CardContent>
                </Card>
                <Card className="border-[#C9A84C]/20 bg-white/65 dark:bg-white/5">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Coverage</p>
                    <p className="mt-3 text-sm leading-6">7 active markets, 14 currencies, bilingual surfaces, treasury and surveillance overlays.</p>
                  </CardContent>
                </Card>
                <Card className="border-[#C9A84C]/20 bg-white/65 dark:bg-white/5">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Purpose</p>
                    <p className="mt-3 text-sm leading-6">A portfolio-grade emulator built to show product depth, system thinking, and execution quality.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <AfricaNetworkMap />
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-white/60 bg-[#0A3D2E] text-[#F5F0E8] dark:border-white/10">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#C9A84C]">HQ</p>
                    <p className="mt-2 font-display text-3xl font-semibold">Lagos, Nigeria</p>
                    <p className="mt-2 text-sm text-[#F5F0E8]/72">Group operations command centre, treasury nerve centre, and primary control hub.</p>
                  </CardContent>
                </Card>
                <Card className="border-[#C46E4A]/20 bg-[#C46E4A]/10 dark:bg-[#C46E4A]/12">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Demonstrates</p>
                    <p className="mt-2 font-display text-3xl font-semibold">Full CBA Stack</p>
                    <p className="mt-2 text-sm text-muted-foreground">From customer onboarding and deposits to payments, credit, compliance, and APIs.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <Card className="counter-glow rounded-[28px] border-primary/10 bg-white/75 dark:bg-white/5">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Markets</p>
                <p className="mt-3 font-display text-4xl font-semibold"><Counter value={7} /></p>
              </CardContent>
            </Card>
            <Card className="counter-glow rounded-[28px] border-primary/10 bg-white/75 dark:bg-white/5">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Currencies</p>
                <p className="mt-3 font-display text-4xl font-semibold"><Counter value={14} /></p>
              </CardContent>
            </Card>
            <Card className="counter-glow rounded-[28px] border-primary/10 bg-white/75 dark:bg-white/5">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Banking Modules</p>
                <p className="mt-3 font-display text-4xl font-semibold"><Counter value={32} /></p>
              </CardContent>
            </Card>
            <Card className="counter-glow rounded-[28px] border-primary/10 bg-white/75 dark:bg-white/5">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Simulated Accounts</p>
                <p className="mt-3 font-display text-4xl font-semibold"><Counter value={2.4} suffix="M" decimals={1} /></p>
              </CardContent>
            </Card>
          </section>

          <section id="modules" className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Modules</p>
                <h2 className="mt-2 font-display text-4xl font-semibold">Eight entry points into the emulator</h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                Each module card acts as a launch surface into a key capability area, showing the breadth expected in a real core banking estate.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {moduleCards.map((module) => {
                const Icon = module.icon;
                return (
                  <Link key={module.title} to={module.to} className="group">
                    <Card className="h-full rounded-[28px] border-primary/10 bg-white/80 transition duration-300 group-hover:-translate-y-1 group-hover:border-[#C9A84C]/40 group-hover:shadow-panel dark:bg-white/5">
                      <CardContent className="flex h-full flex-col gap-5 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A3D2E] text-[#F5F0E8] dark:bg-[#C9A84C] dark:text-[#0A3D2E]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="font-display text-2xl font-semibold">{module.title}</h3>
                          <p className="text-sm leading-7 text-muted-foreground">{module.description}</p>
                        </div>
                        <div className="mt-auto flex items-center text-sm font-medium text-primary">
                          Open module
                          <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          <section id="architecture" className="space-y-6">
            <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-4">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Architecture</p>
                <h2 className="font-display text-4xl font-semibold">Five layers, one believable banking system</h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  The landing page frames the emulator as an actual bank platform: customer-facing channels connect through a secure gateway into core domain services, which then reach external networks and simulated data/control layers.
                </p>
                <Link
                  to="/architecture"
                  className={buttonVariants({
                    variant: "outline",
                    className: "rounded-full border-primary/20 bg-transparent",
                  })}
                >
                  Open detailed architecture page
                </Link>
              </div>
              <ArchitectureDiagram />
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Stack</p>
                <h2 className="mt-2 font-display text-4xl font-semibold">Web-hosted, interactive, zero-server required</h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                The project is designed to deploy statically while still feeling like a live banking stack, using seeded data and a full browser-side API simulation.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
              {stack.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.label} className="rounded-[28px] border-primary/10 bg-white/75 dark:bg-white/5">
                    <CardContent className="space-y-4 p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C9A84C]/18 text-[#8D6F26] dark:bg-[#C9A84C]/14 dark:text-[#E8D49C]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium leading-6">{item.label}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </main>

        <footer className="mt-14 rounded-[32px] border border-white/60 bg-white/70 px-6 py-6 backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-display text-2xl font-semibold">PanAfrika Bank</p>
              <p className="text-sm text-muted-foreground">bank.portfolio.sonofnos.com</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground md:items-end">
              <a href="https://github.com/" target="_blank" rel="noreferrer" className="transition hover:text-primary">
                GitHub placeholder
              </a>
              <p>Built by Chris</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
