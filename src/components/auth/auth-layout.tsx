import { useEffect, useRef, useState, type ReactNode } from "react";
import { Landmark, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { useTheme } from "@/hooks/use-theme";

const quotes = [
  "A core banking platform should feel continental, not local. PanAfrika simulates scale across seven markets from a single command layer.",
  "The emulator is built to show operational realism: controls, queues, liquidity, and customer journeys across a modern African bank.",
  "Banking in Africa is networked, regulated, and multilingual. This auth layer is the front door into that larger operating picture.",
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { theme, toggleTheme } = useTheme();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setQuoteIndex((current) => (current + 1) % quotes.length);
        setVisible(true);
      }, 350);
    }, 4200);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-5 md:px-8">
      <div className="mx-auto flex max-w-7xl justify-end">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl gap-6 py-4 lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,#08251d,#0A3D2E_55%,#1A5C46)] p-8 text-[#F5F0E8] shadow-panel md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.24),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(196,110,74,0.18),transparent_20%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="rounded-full bg-[#C9A84C] p-2 text-[#0A3D2E]">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl ">PanAfrika Bank</p>
                  <p className="text-xs text-[#F5F0E8]/70">bank.portfolio.sonofnos.com</p>
                </div>
              </Link>

              <div className="space-y-4">
                <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#C9A84C]">
                  Auth module
                </p>
                <h1 className="max-w-xl font-display text-4xl leading-[1.1] md:text-6xl">
                  Secure access into a continent-scale banking emulator
                </h1>
                <p className="max-w-lg text-sm leading-8 text-[#F5F0E8]/74 md:text-base">
                  Staff, compliance, teller, and customer identities all enter through the same controlled surface,
                  with simulated MFA and onboarding patterns that mirror a production banking front door.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <Quote className="mt-1 h-5 w-5 text-[#C9A84C]" />
                  <p
                    className="min-h-[96px] text-base leading-8 text-[#F5F0E8]/82 transition-opacity duration-300"
                    style={{ opacity: visible ? 1 : 0 }}
                  >
                    {quotes[quoteIndex]}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-black/15 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#F5F0E8]/55">Markets</p>
                  <p className="mt-2 font-display text-3xl ">7</p>
                </div>
                <div className="rounded-2xl bg-black/15 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#F5F0E8]/55">Roles</p>
                  <p className="mt-2 font-display text-3xl ">4</p>
                </div>
                <div className="rounded-2xl bg-black/15 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#F5F0E8]/55">MFA</p>
                  <p className="mt-2 font-display text-3xl ">OTP</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex items-center">
          <div className="w-full rounded-[36px] border border-white/60 bg-white/82 p-6 shadow-panel backdrop-blur md:p-10 dark:border-white/10 dark:bg-white/5">
            <div className="mb-8 space-y-3">
              <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Authentication</p>
              <h2 className="font-display text-4xl ">{title}</h2>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground">{subtitle}</p>
            </div>
            {children}
            {footer ? <div className="mt-8">{footer}</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
