"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgePercent, FileText, MapPin, Star } from "lucide-react";

import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import SampleReportModal from "@/components/main/shared/modal/SampleReportModal";

interface CheckoutSectionProps {
  planName?: string;
  planDescription?: string;
  subtotal?: number;
  discount?: number;
  onApplyCoupon?: (code: string) => void;
  onProceed?: () => void;
}

const formatPrice = (value: number) => `₹ ${value.toFixed(2)}`;

export default function CheckoutSection({
  planName = "Plus plan",
  planDescription = "More features for scaling",
  subtotal = 99,
  discount = 0,
  onApplyCoupon,
  onProceed,
}: CheckoutSectionProps) {
  const [coupon, setCoupon] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const total = Math.max(subtotal - discount, 0);

  function handleCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = coupon.trim();
    if (code) onApplyCoupon?.(code);
  }

  return (
    <section className="container-y-pad relative isolate overflow-hidden">
      {/* Decorative W-shaped overlay (bottom left) */}
      <Image
        src="/section-images/w-logo-light.svg"
        alt="w-logo"
        aria-hidden
        width={2000}
        height={2000}
        sizes="100vw"
        priority={false}
        className="pointer-events-none absolute -bottom-10 -left-16 -z-10 h-80 w-auto select-none lg:h-110"
      />

      <div className="my-container-x">
        {/* Map preview */}
        <div className="relative h-60 overflow-hidden rounded-2xl border border-border sm:h-80 sm:rounded-4xl lg:h-110">
          <Image
            src="/map.png"
            alt="Map showing your selected rooftop area"
            fill
            sizes="(min-width: 1200px) 1800px, 100vw"
            className="object-cover"
          />
        </div>

        {/* Info cards */}
        <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 lg:mt-14 lg:gap-8">
          <div className="rounded-2xl border border-border bg-background p-5 sm:rounded-3xl sm:p-6">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-12">
              <MapPin className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <p className="mt-4 text-sm text-paragraph sm:mt-5 sm:text-[15px]">
              Is your selected area not quite right?{" "}
              <Link
                href="/#save-water"
                className="font-semibold text-heading hover:text-primary"
              >
                Update it here.
              </Link>
            </p>
            <p className="mt-2 text-xs sm:text-[13px]">
              Note: Selecting this link takes you back to the home page.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 sm:rounded-3xl sm:p-6">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-12">
              <FileText className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <p className="mt-4 text-sm text-paragraph sm:mt-5 sm:text-[15px]">
              See your potential water savings.
            </p>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="mt-2 inline-block cursor-pointer text-left text-sm font-semibold text-heading underline decoration-heading underline-offset-4 hover:text-primary hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:text-[15px]"
            >
              View a sample report
            </button>
          </div>
        </div>

        {/* Order summary */}
        <div className="mt-8 grid items-start gap-6 sm:mt-10 lg:mt-14 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-2xl bg-secondary/35 p-6 sm:rounded-3xl sm:p-9">
            <h2 className="text-3xl leading-[1.15] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
              Get Your Complete Report
            </h2>
            <p className="mt-4 text-sm leading-6.5 text-heading sm:mt-5 sm:text-base">
              Check your order summary and apply any available discounts before
              checkout.
            </p>
          </div>

          {/* Plan card with soft gradient border */}
          <div className="rounded-3xl bg-linear-to-b from-primary/35 to-border p-2.5 shadow-xl shadow-foreground/5 sm:rounded-4xl sm:p-3">
            <div className="overflow-hidden rounded-2xl bg-background sm:rounded-3xl">
              <div className="bg-foreground/3 px-5 pt-6 pb-9 sm:px-6.5 sm:pt-7 sm:pb-10">
                <h3 className="text-2xl font-semibold text-heading sm:text-3xl">
                  {planName}
                </h3>
                <p className="mt-1 text-sm text-paragraph sm:text-base">
                  {planDescription}
                </p>
              </div>

              <div className="relative -mt-5 rounded-t-2xl bg-background px-5 pt-6 pb-6 sm:-mt-6 sm:rounded-t-3xl sm:px-6.5 sm:pt-7 sm:pb-7">
                <dl className="space-y-3 text-sm sm:space-y-4 sm:text-base">
                  <div className="flex items-center justify-between">
                    <dt className="text-heading">Subtotal</dt>
                    <dd className="text-paragraph">{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-heading">Discount</dt>
                    <dd className="text-paragraph">{formatPrice(discount)}</dd>
                  </div>
                </dl>

                <hr className="my-5 border-t border-dashed border-border sm:my-6" />

                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-heading sm:text-xl">
                    Total to pay
                  </p>
                  <p className="font-heading text-xl font-semibold text-heading sm:text-2xl">
                    {formatPrice(total)}
                  </p>
                </div>

                {/* Coupon */}
                <form
                  onSubmit={handleCoupon}
                  className="mt-5 flex items-center gap-2 rounded-2xl border border-border py-2 pr-2 pl-3 sm:mt-6 sm:gap-3 sm:pl-4"
                >
                  <BadgePercent
                    className="size-5 shrink-0 text-primary sm:size-6"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Enter coupon code"
                    aria-label="Coupon code"
                    className="min-w-0 flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-muted-foreground sm:text-base"
                  />
                  <button
                    type="submit"
                    className="h-10 shrink-0 rounded-lg border border-border bg-foreground/3 px-4 text-sm text-heading transition-colors hover:bg-muted sm:h-11 sm:px-5 sm:text-base cursor-pointer"
                  >
                    Apply code
                  </button>
                </form>

                <PrimaryButton
                  btnType="solid-primary"
                  full
                  onClick={onProceed}
                  className="mt-5 w-full sm:mt-6"
                >
                  Proceed to payment
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-secondary/35 px-4 py-4 text-sm text-heading sm:mt-10 sm:items-center sm:px-6 sm:text-base">
          <Star
            className="mt-0.5 size-4 shrink-0 fill-current sm:mt-0"
            aria-hidden
          />
          <p className="text-heading">
            Measurements are approximate and provided for reference purposes
            only. We do not retain or store your data.
          </p>
        </div>
      </div>

      <SampleReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </section>
  );
}
