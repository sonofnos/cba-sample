import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setSubmitted(true);
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="This is a simulated recovery flow. Enter any valid email and the emulator will confirm a reset link was sent."
      footer={
        <p className="text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-primary transition hover:opacity-80">
            Return to login
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label htmlFor="forgot-email" className="text-sm font-medium">Email address</label>
          <Input id="forgot-email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
        </div>

        {submitted ? (
          <div className="rounded-[28px] border border-primary/10 bg-secondary/30 p-5 text-sm text-muted-foreground">
            Reset instructions sent. Check your inbox for a message from PanAfrika Bank — it may take a minute to arrive.
          </div>
        ) : null}

        <button type="submit" className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full")} disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  );
}
