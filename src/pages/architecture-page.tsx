import { ArrowLeft, Layers3, ServerCog, ShieldCheck, Waypoints } from "lucide-react";
import { Link } from "react-router-dom";
import { ArchitectureDiagram } from "@/components/landing/architecture-diagram";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";

const pillars = [
  {
    title: "Channels",
    icon: Layers3,
    copy: "Executive dashboard, teller operations, customer onboarding, and ecosystem access points surface through consistent UI patterns.",
  },
  {
    title: "Gateway",
    icon: ShieldCheck,
    copy: "Authentication, authorization, throttling, routing, and audit trails sit between channels and banking domains.",
  },
  {
    title: "Core Services",
    icon: ServerCog,
    copy: "Deposits, payments, cards, loans, treasury, compliance, and reporting are modeled as distinct but connected domains.",
  },
  {
    title: "Connectors & Data",
    icon: Waypoints,
    copy: "Network connectors, regulators, open-banking partners, and seeded data streams simulate a real bank estate without any live integrations.",
  },
];

export function ArchitecturePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1320px] px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 rounded-[32px] border border-white/60 bg-white/70 p-5 shadow-panel backdrop-blur md:flex-row md:items-center md:justify-between dark:border-white/10 dark:bg-white/5">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Architecture</p>
            <h1 className="font-display text-4xl font-semibold">PanAfrika Bank emulator system map</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <Link to="/" className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to overview
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <ArchitectureDiagram />

          <div className="space-y-5">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card key={pillar.title} className="rounded-[28px] border-primary/10 bg-white/75 dark:bg-white/5">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A3D2E] text-[#F5F0E8] dark:bg-[#C9A84C] dark:text-[#0A3D2E]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="font-display text-2xl font-semibold">{pillar.title}</h2>
                      <p className="text-sm leading-7 text-muted-foreground">{pillar.copy}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mt-8 rounded-[32px] border border-primary/10 bg-[#0A3D2E] p-8 text-[#F5F0E8] shadow-panel">
          <p className="text-sm uppercase tracking-[0.18em] text-[#C9A84C]">Deployment posture</p>
          <h2 className="mt-3 font-display text-4xl font-semibold">Static-hosted, yet behaviorally complete</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#F5F0E8]/78">
            React renders the operator surfaces, Zustand holds global bank context, React Query models asynchronous access,
            and Mock Service Worker intercepts every API request with seeded data and stateful mutations. The result is a
            convincing core banking emulator with zero backend runtime.
          </p>
          <div className="mt-6">
            <Link
              to="/app"
              className={buttonVariants({
                size: "lg",
                className: "rounded-full bg-[#C9A84C] px-6 text-[#0A3D2E] hover:bg-[#d7b868]",
              })}
            >
              Launch App
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
