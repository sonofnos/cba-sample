import { cn } from "@/lib/utils";

export function Stepper({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: string[];
}) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1">
      {steps.map((step, index) => (
        <div key={step} className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
              index <= currentStep
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground",
            )}
          >
            {index + 1}
          </div>
          <span className={cn("text-sm font-medium", index === currentStep ? "text-foreground" : "text-muted-foreground")}>
            {step}
          </span>
          {index < steps.length - 1 ? <div className="h-px w-8 bg-border" /> : null}
        </div>
      ))}
    </div>
  );
}
