import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authenticateSeedUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

const demoAccounts = [
  "customer@panafrika.com",
  "teller@panafrika.com",
  "compliance@panafrika.com",
  "admin@panafrika.com",
];

export function LoginPage() {
  const navigate = useNavigate();
  const beginAuth = useAuthStore((state) => state.beginAuth);
  const setMarket = useAppStore((state) => state.setMarket);
  const setLocale = useAppStore((state) => state.setLocale);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "customer@panafrika.com",
      password: "Demo1234!",
    },
  });

  const onSubmit = async (values: LoginValues) => {
    setAuthError(null);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const user = authenticateSeedUser(values.email, values.password);

    if (!user) {
      setAuthError("Invalid credentials. Try Demo1234!");
      return;
    }

    setMarket(user.market);
    setLocale(user.market === "SN" ? "fr" : "en");
    beginAuth(user, "login");
    navigate("/mfa");
  };

  return (
    <AuthLayout
      title="Staff and customer sign-in"
      subtitle="Use any of the seeded demo identities below. Successful sign-in always routes through the OTP checkpoint."
      footer={
        <div className="flex flex-col gap-4 border-t border-border pt-6 text-sm">
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="font-medium text-primary transition hover:opacity-80">
              New customer? Start onboarding
            </Link>
            <Link to="/forgot" className="font-medium text-primary transition hover:opacity-80">
              Forgot password
            </Link>
          </div>
          <p className="text-muted-foreground">
            Demo password for all roles: <span className="font-medium text-foreground">Demo1234!</span>
          </p>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email address
          </label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="pr-12"
              {...register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? <p className="text-sm text-danger">{errors.password.message}</p> : null}
        </div>

        {authError ? <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-danger">{authError}</p> : null}

        <button type="submit" className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full")} disabled={isSubmitting}>
          {isSubmitting ? "Authenticating..." : "Continue to MFA"}
        </button>
      </form>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {demoAccounts.map((email) => (
          <button
            key={email}
            type="button"
            className="rounded-2xl border border-border bg-secondary px-4 py-3 text-left text-sm transition hover:border-primary/30 hover:bg-white dark:hover:bg-white/10"
            onClick={() => setValue("email", email, { shouldDirty: true })}
          >
            <p className="font-medium">{email}</p>
            <p className="mt-1 text-xs text-muted-foreground">Tap to fill email</p>
          </button>
        ))}
      </div>
    </AuthLayout>
  );
}
