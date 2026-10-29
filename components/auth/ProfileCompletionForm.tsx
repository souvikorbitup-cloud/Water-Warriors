"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import Logo from "@/components/icons/Logo";
import { isValidName, isValidIndianPhone } from "@/lib/auth/validation";
import PrimaryButton from "../main/shared/button/PrimaryButton";

interface ProfileCompletionFormProps {
  email: string;
  redirectTo?: string | null;
}

/**
 * Shown after a new user verifies their OTP for the first time. Submits to
 * POST /api/profile/complete.
 */
export function ProfileCompletionForm({
  email,
  redirectTo,
}: ProfileCompletionFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!isValidName(firstName) || !isValidName(lastName)) {
      toast.error("Please enter a valid first and last name.");
      return;
    }
    if (!isValidIndianPhone(mobile)) {
      toast.error("Please enter a valid Indian phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, mobile }),
      });

      const body = await res.json();

      if (!res.ok) {
        toast.error(
          body?.message ?? "Could not save your profile. Please try again.",
        );
        return;
      }

      toast.success("Profile completed.");
      router.replace(redirectTo || "/admin/profile");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex h-full w-full items-center justify-center px-4 py-12 sm:py-16 z-10">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-card-border bg-card px-4 py-6 sm:px-8 sm:py-10">
          {/* Logo */}
          <Link
            href="/"
            className="mx-auto mb-8 block w-fit"
            aria-label="Go to Water Warriors AI home"
          >
            <Logo className="h-16 w-auto object-contain sm:h-24" />
          </Link>
          <div className="mb-6 text-center sm:mb-8">
            <h1 className="font-heading text-2xl font-bold text-heading sm:text-3xl">
              Complete your profile
            </h1>

            <p className="mt-2 text-sm text-paragraph sm:text-base">
              Signed in as{" "}
              <span className="font-semibold text-heading">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block font-heading text-sm font-bold text-heading"
                >
                  First name
                </label>

                <Input
                  id="firstName"
                  placeholder="e.g. Priya"
                  required
                  disabled={isSubmitting}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 rounded-lg px-4 text-sm disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block font-heading text-sm font-bold text-heading"
                >
                  Last name
                </label>

                <Input
                  id="lastName"
                  placeholder="e.g. Sharma"
                  required
                  disabled={isSubmitting}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-12 rounded-lg px-4 text-sm disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="mobile"
                className="mb-2 block font-heading text-sm font-bold text-heading"
              >
                Mobile number
              </label>

              <Input
                id="mobile"
                type="tel"
                inputMode="tel"
                placeholder="98765 43210"
                required
                disabled={isSubmitting}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="h-12 rounded-lg px-4 text-sm disabled:opacity-60"
              />
            </div>

            <PrimaryButton
              type="submit"
              btnType="solid-primary"
              disabled={isSubmitting}
              className="w-full text-center"
              full
            >
              {isSubmitting ? "Saving…" : "Finish setup"}
            </PrimaryButton>
          </form>
        </div>
      </div>
    </section>
  );
}
