"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import {
  isValidEmail,
  isValidOTPFormat,
  normalizeEmail,
} from "@/lib/auth/validation";

const RESEND_COOLDOWN_SECONDS = 60;

export type OTPStep = "enter-email" | "enter-otp";

export function useOTPFlow() {
  const [step, setStep] = useState<OTPStep>("enter-email");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((previous) => {
        if (previous <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
  }, []);

  const sendOTP = useCallback(
    async (rawEmail: string) => {
      const normalized = normalizeEmail(rawEmail);
      if (!isValidEmail(normalized)) {
        toast.error("Please enter a valid email address.");
        return false;
      }

      setIsSending(true);
      try {
        const { error } = await authClient.emailOtp.sendVerificationOtp({
          email: normalized,
          type: "sign-in",
        });
        if (error) {
          toast.error(
            error.message ?? "Could not send the code. Please try again.",
          );
          return false;
        }

        setEmail(normalized);
        setStep("enter-otp");
        startCooldown();
        toast.success(`We've sent a 6-digit code to ${normalized}`);
        return true;
      } catch {
        toast.error(
          "Something went wrong sending your code. Please try again.",
        );
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [startCooldown],
  );

  const resendOTP = useCallback(async () => {
    if (cooldown === 0) await sendOTP(email);
  }, [cooldown, email, sendOTP]);

  const verifyOTP = useCallback(
    async (code: string) => {
      if (!isValidOTPFormat(code)) {
        toast.error("Enter the 6-digit code.");
        return { success: false as const };
      }

      setIsVerifying(true);
      try {
        const { error } = await authClient.signIn.emailOtp({
          email,
          otp: code,
        });
        if (error) {
          toast.error(
            error.status === 429
              ? "Too many attempts. Please wait."
              : (error.message ?? "Invalid or expired code."),
          );
          return { success: false as const };
        }

        toast.success("Signed in successfully.");
        return { success: true as const };
      } catch {
        toast.error(
          "Something went wrong verifying your code. Please try again.",
        );
        return { success: false as const };
      } finally {
        setIsVerifying(false);
      }
    },
    [email],
  );

  return {
    step,
    email,
    isSending,
    isVerifying,
    cooldown,
    canResend: cooldown === 0,
    sendOTP,
    resendOTP,
    verifyOTP,
    goBackToEmail: () => setStep("enter-email"),
  };
}
