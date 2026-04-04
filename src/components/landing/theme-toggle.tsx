import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Theme } from "@/components/landing/types";

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="outline"
      className="rounded-full border-white/20 bg-white/10 px-4 text-current backdrop-blur hover:bg-white/20 dark:border-white/10 dark:bg-white/5"
      onClick={onToggle}
    >
      {theme === "dark" ? <SunMedium className="mr-2 h-4 w-4" /> : <MoonStar className="mr-2 h-4 w-4" />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </Button>
  );
}
