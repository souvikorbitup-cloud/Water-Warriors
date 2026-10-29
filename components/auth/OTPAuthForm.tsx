"use client";

import { useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import Logo from "@/components/icons/Logo";
import { useOTPFlow } from "@/lib/hooks/use-otp-flow";
import PrimaryButton from "../main/shared/button/PrimaryButton";

interface OTPAuthFormProps {
  onVerified: (email: string) => void;
  subheading?: ReactNode;
}

export function OTPAuthForm({ onVerified, subheading }: OTPAuthFormProps) {
  const {
    step,
    email,
    isSending,
    isVerifying,
    cooldown,
    canResend,
    sendOTP,
    resendOTP,
    verifyOTP,
    goBackToEmail,
  } = useOTPFlow();
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    await sendOTP(emailInput);
  }

  async function handleOtpSubmit(event: FormEvent) {
    event.preventDefault();
    const result = await verifyOTP(otpInput);
    if (result.success) onVerified(email);
  }

  return (
    <section className="flex h-full w-full items-center justify-center py-12 sm:py-16 z-10">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-card-border bg-card px-4 py-6 sm:px-8 sm:py-10">
          {/* Logo */}
          <Link
            href="/"
            className="mx-auto mb-4 block w-fit"
            aria-label="Go to Water Warriors AI home"
          >
            <Logo className="h-16 w-auto object-contain sm:h-24" />
          </Link>
          <div className="mb-6 text-center sm:mb-8">
            {subheading && (
              <p className="mt-2 text-sm text-paragraph sm:text-base">
                {subheading}
              </p>
            )}
          </div>

          {step === "enter-email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block font-heading text-sm font-bold text-heading"
                >
                  Email address
                </label>

                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="e.g. priya@brigadesociety.org"
                  required
                  disabled={isSending}
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  className="h-12 rounded-lg px-4 text-sm disabled:opacity-60"
                />
              </div>

              <PrimaryButton
                type="submit"
                btnType="solid-primary"
                disabled={isSending}
                className="w-full text-center"
                full
              >
                {isSending ? "Sending code..." : "Continue"}
              </PrimaryButton>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block font-heading text-sm font-bold text-heading"
                >
                  Enter the 6-digit code
                </label>

                <p className="mb-3 text-sm text-paragraph">
                  Sent to:{" "}
                  <span className="font-semibold text-heading">{email}</span>
                </p>

                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  required
                  disabled={isVerifying}
                  value={otpInput}
                  onChange={(event) =>
                    setOtpInput(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  className="h-12 rounded-lg px-4 text-center text-lg tracking-[0.5em] disabled:opacity-60"
                />
              </div>

              <PrimaryButton
                type="submit"
                btnType="solid-primary"
                disabled={isVerifying || otpInput.length !== 6}
                className="w-full text-center"
                full
              >
                {isVerifying ? "Verifying..." : "Verify & continue"}
              </PrimaryButton>

              <div className="flex items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={goBackToEmail}
                  disabled={isVerifying}
                  className="cursor-pointer font-medium text-paragraph underline decoration-paragraph/50 underline-offset-4 transition-colors hover:decoration-heading disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Change email
                </button>

                <button
                  type="button"
                  onClick={resendOTP}
                  disabled={!canResend || isSending}
                  className="cursor-pointer font-semibold text-primary underline decoration-primary/50 underline-offset-4 transition-colors hover:decoration-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {canResend ? "Resend code" : `Resend in ${cooldown}s`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
