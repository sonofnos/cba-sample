import { useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, CheckCircle2, LoaderCircle, UploadCloud } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Stepper } from "@/components/auth/stepper";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { buildRegisteredUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";

const registerSchema = z.object({
  firstName: z.string().min(2, "Enter first name"),
  lastName: z.string().min(2, "Enter last name"),
  dateOfBirth: z.string().min(1, "Select date of birth"),
  nationality: z.enum(["NG", "GH", "KE", "ZA", "SN", "RW", "ZM"]),
  nationalIdType: z.enum(["National ID", "Passport", "Driver's License", "Voter Card"]),
  nationalIdNumber: z.string().min(5, "Enter ID number"),
  phoneCountryCode: z.enum(["+234", "+233", "+254", "+27", "+221", "+250", "+260"]),
  phoneNumber: z.string().min(7, "Enter phone number"),
  accountType: z.enum(["Current", "Savings", "Domiciliary"]),
  primaryCurrency: z.enum(["NGN", "GHS", "KES", "ZAR", "XOF", "RWF", "ZMW", "USD"]),
  pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
  agreeToTerms: z.boolean().refine((value) => value, "You must agree to the terms"),
});

type RegisterValues = z.infer<typeof registerSchema>;

const stepFields: Array<Array<keyof RegisterValues>> = [
  ["firstName", "lastName", "dateOfBirth", "nationality", "nationalIdType", "nationalIdNumber", "phoneCountryCode", "phoneNumber"],
  [],
  ["accountType", "primaryCurrency", "pin", "agreeToTerms"],
];

const marketToLocale: Record<RegisterValues["nationality"], "en" | "fr"> = {
  NG: "en",
  GH: "en",
  KE: "en",
  ZA: "en",
  SN: "fr",
  RW: "en",
  ZM: "en",
};

export function RegisterPage() {
  const navigate = useNavigate();
  const beginAuth = useAuthStore((state) => state.beginAuth);
  const setMarket = useAppStore((state) => state.setMarket);
  const setLocale = useAppStore((state) => state.setLocale);
  const [currentStep, setCurrentStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<"idle" | "processing" | "verified">("idle");
  const [livenessStatus, setLivenessStatus] = useState<"idle" | "checking" | "passed">("idle");
  const [kycError, setKycError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nationality: "NG",
      nationalIdType: "National ID",
      phoneCountryCode: "+234",
      accountType: "Savings",
      primaryCurrency: "NGN",
      pin: "",
      agreeToTerms: false,
    },
  });

  const values = watch();
  const steps = useMemo(() => ["Personal Info", "KYC Simulation", "Account Setup"], []);

  const processDocument = (file?: File | null) => {
    if (!file) {
      return;
    }

    setKycError(null);
    setDocumentStatus("processing");
    window.setTimeout(() => setDocumentStatus("verified"), 2000);
  };

  const startLivenessCheck = async () => {
    setKycError(null);
    setLivenessStatus("checking");

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        window.setTimeout(() => {
          stream.getTracks().forEach((track) => track.stop());
          setLivenessStatus("passed");
        }, 3000);
      } else {
        window.setTimeout(() => setLivenessStatus("passed"), 3000);
      }
    } catch {
      window.setTimeout(() => setLivenessStatus("passed"), 3000);
    }
  };

  const nextStep = async () => {
    setKycError(null);

    if (currentStep === 1) {
      if (documentStatus !== "verified" || livenessStatus !== "passed") {
        setKycError("Complete document verification and liveness check before continuing.");
        return;
      }
      setCurrentStep(2);
      return;
    }

    const fields = stepFields[currentStep];
    const valid = await trigger(fields);
    if (!valid) {
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const onSubmit = async (formValues: RegisterValues) => {
    const user = buildRegisteredUser({
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      market: formValues.nationality,
      currency: formValues.primaryCurrency,
    });

    setMarket(user.market);
    setLocale(marketToLocale[formValues.nationality]);
    beginAuth(user, "register");
    navigate("/mfa");
  };

  return (
    <AuthLayout
      title="New customer onboarding"
      subtitle="A three-step onboarding wizard that simulates document verification, liveness checks, and account setup."
      footer={
        <p className="text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-primary transition hover:opacity-80">
            Return to login
          </Link>
        </p>
      }
    >
      <div className="space-y-8">
        <Stepper currentStep={currentStep} steps={steps} />

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {currentStep === 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">First name</label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName ? <p className="text-sm text-danger">{errors.firstName.message}</p> : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName ? <p className="text-sm text-danger">{errors.lastName.message}</p> : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="dateOfBirth" className="text-sm font-medium">Date of birth</label>
                <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                {errors.dateOfBirth ? <p className="text-sm text-danger">{errors.dateOfBirth.message}</p> : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="nationality" className="text-sm font-medium">Nationality</label>
                <Select id="nationality" {...register("nationality")}>
                  <option value="NG">Nigeria</option>
                  <option value="GH">Ghana</option>
                  <option value="KE">Kenya</option>
                  <option value="ZA">South Africa</option>
                  <option value="SN">Senegal</option>
                  <option value="RW">Rwanda</option>
                  <option value="ZM">Zambia</option>
                </Select>
                {errors.nationality ? <p className="text-sm text-danger">{errors.nationality.message}</p> : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="nationalIdType" className="text-sm font-medium">National ID type</label>
                <Select id="nationalIdType" {...register("nationalIdType")}>
                  <option value="National ID">National ID</option>
                  <option value="Passport">Passport</option>
                  <option value="Driver's License">Driver&apos;s License</option>
                  <option value="Voter Card">Voter Card</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="nationalIdNumber" className="text-sm font-medium">National ID number</label>
                <Input id="nationalIdNumber" {...register("nationalIdNumber")} />
                {errors.nationalIdNumber ? <p className="text-sm text-danger">{errors.nationalIdNumber.message}</p> : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="phoneCountryCode" className="text-sm font-medium">Country code</label>
                <Select id="phoneCountryCode" {...register("phoneCountryCode")}>
                  <option value="+234">+234 Nigeria</option>
                  <option value="+233">+233 Ghana</option>
                  <option value="+254">+254 Kenya</option>
                  <option value="+27">+27 South Africa</option>
                  <option value="+221">+221 Senegal</option>
                  <option value="+250">+250 Rwanda</option>
                  <option value="+260">+260 Zambia</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium">Phone number</label>
                <Input id="phoneNumber" inputMode="tel" {...register("phoneNumber")} />
                {errors.phoneNumber ? <p className="text-sm text-danger">{errors.phoneNumber.message}</p> : null}
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="space-y-6">
              <div
                role="button"
                tabIndex={0}
                className={cn(
                  "rounded-[28px] border border-dashed p-8 text-center transition",
                  dragging ? "border-primary bg-primary/5" : "border-border bg-secondary/40",
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  processDocument(event.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => processDocument(event.target.files?.[0])}
                />
                <UploadCloud className="mx-auto h-10 w-10 text-primary" />
                <p className="mt-4 font-medium">Drag and drop your ID image here</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Any image file is accepted for this simulation.
                </p>
              </div>

              <div className="rounded-[28px] border border-border bg-secondary/30 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Document verification</p>
                    <p className="text-sm text-muted-foreground">Fake OCR and KYC processing. Completes in 2 seconds.</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {documentStatus === "processing" ? <LoaderCircle className="h-4 w-4 animate-spin text-primary" /> : null}
                    {documentStatus === "verified" ? <CheckCircle2 className="h-4 w-4 text-success" /> : null}
                    <span>
                      {documentStatus === "idle" ? "Waiting" : documentStatus === "processing" ? "Processing..." : "Document Verified ✓"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-border bg-secondary/30 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">Liveness check simulation</p>
                    <p className="text-sm text-muted-foreground">
                      Requests webcam access, then auto-passes after 3 seconds.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
                    onClick={startLivenessCheck}
                    disabled={livenessStatus === "checking"}
                  >
                    {livenessStatus === "checking" ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : livenessStatus === "passed" ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                        Passed
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Start liveness check
                      </>
                    )}
                  </button>
                </div>
              </div>

              {kycError ? <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-danger">{kycError}</p> : null}
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="accountType" className="text-sm font-medium">Account type</label>
                <Select id="accountType" {...register("accountType")}>
                  <option value="Current">Current</option>
                  <option value="Savings">Savings</option>
                  <option value="Domiciliary">Domiciliary</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="primaryCurrency" className="text-sm font-medium">Primary currency</label>
                <Select id="primaryCurrency" {...register("primaryCurrency")}>
                  <option value="NGN">NGN</option>
                  <option value="GHS">GHS</option>
                  <option value="KES">KES</option>
                  <option value="ZAR">ZAR</option>
                  <option value="XOF">XOF</option>
                  <option value="RWF">RWF</option>
                  <option value="ZMW">ZMW</option>
                  <option value="USD">USD</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="pin" className="text-sm font-medium">4-digit transaction PIN</label>
                <Input id="pin" type="password" inputMode="numeric" maxLength={4} {...register("pin")} />
                {errors.pin ? <p className="text-sm text-danger">{errors.pin.message}</p> : null}
              </div>
              <div className="rounded-[28px] border border-border bg-secondary/40 p-5">
                <p className="text-sm font-medium">Profile summary</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {values.firstName} {values.lastName} · {values.nationality} · {values.accountType} · {values.primaryCurrency}
                </p>
              </div>
              <label className="md:col-span-2 flex items-start gap-3 rounded-2xl border border-border bg-secondary/20 p-4 text-sm">
                <input type="checkbox" className="mt-1 h-4 w-4" {...register("agreeToTerms")} />
                <span>
                  I agree to the PanAfrika Bank simulated onboarding terms, privacy notice, and consent to this demo KYC flow.
                </span>
              </label>
              {errors.agreeToTerms ? <p className="md:col-span-2 text-sm text-danger">{errors.agreeToTerms.message}</p> : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
              onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
              disabled={currentStep === 0}
            >
              Back
            </button>

            {currentStep < 2 ? (
              <button
                type="button"
                className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
                onClick={nextStep}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating profile..." : "Submit and continue to MFA"}
              </button>
            )}
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
