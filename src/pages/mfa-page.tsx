import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const mfaSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
});

type MfaValues = z.infer<typeof mfaSchema>;

export function MfaPage() {
  const navigate = useNavigate();
  const pendingUser = useAuthStore((state) => state.pendingUser);
  const completeAuth = useAuthStore((state) => state.completeAuth);
  const clearPending = useAuthStore((state) => state.clearPending);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MfaValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues: {
      code: "",
    },
  });

  if (!pendingUser) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async ({ code }: MfaValues) => {
    setError(null);
    await new Promise((resolve) => window.setTimeout(resolve, 450));

    if (code !== "123456") {
      setError("Invalid OTP. Use 123456 for this simulation.");
      return;
    }

    completeAuth();
    navigate("/app", { replace: true });
  };

  return (
    <AuthLayout
      title="OTP verification"
      subtitle={`A one-time passcode has been simulated for ${pendingUser.email}. For this emulator, the code is always 123456.`}
      footer={
        <div className="flex flex-wrap gap-4 text-sm">
          <button type="button" className="font-medium text-primary transition hover:opacity-80" onClick={clearPending}>
            Cancel verification
          </button>
          <Link to="/login" className="font-medium text-primary transition hover:opacity-80">
            Back to login
          </Link>
        </div>
      }
    >
      <div className="rounded-[28px] border border-primary/10 bg-secondary/30 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-primary p-3 text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">Simulated OTP delivery</p>
            <p className="text-sm text-muted-foreground">
              Six digits were sent to your registered phone and email. Demo code: <span className="font-medium text-foreground">123456</span>
            </p>
          </div>
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium">Enter OTP</label>
          <Input id="code" inputMode="numeric" maxLength={6} placeholder="123456" {...register("code")} />
          {errors.code ? <p className="text-sm text-danger">{errors.code.message}</p> : null}
        </div>

        {error ? <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

        <button type="submit" className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full")} disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify and enter app"}
        </button>
      </form>
    </AuthLayout>
  );
}
