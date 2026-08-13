"use client";

import { OTPField } from "@base-ui/react/otp-field";
import { cn } from "@/lib/utils";

function InputOTP({ className, ...props }: OTPField.Root.Props) {
  return (
    <OTPField.Root
      data-slot="input-otp"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

function InputOTPSlot({ className, ...props }: OTPField.Input.Props) {
  return (
    <OTPField.Input
      data-slot="input-otp-slot"
      className={cn(
        "m-0 size-10 min-w-0 rounded-lg border border-input bg-transparent p-0 text-center text-base font-medium tabular-nums outline-none transition-colors focus-visible:z-10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

export { InputOTP, InputOTPSlot };
