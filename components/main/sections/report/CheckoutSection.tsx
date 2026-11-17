"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  BadgePercent,
  FileText,
  LoaderCircle,
  MapPin,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import SampleReportModal from "@/components/main/shared/modal/SampleReportModal";
import { Link, useRouter } from "@/i18n/navigation";
import {
  readSavedLocationName,
  readSavedMapCamera,
  readSavedMapPoints,
} from "@/lib/data/location-selection-session";
import {
  REPORT_SESSION_REFERENCE_CHANGE_EVENT,
  REPORT_SESSION_REFERENCE_KEY,
} from "@/lib/data/report-session";
import { createStaticMapUrl } from "@/lib/maps/static-map-url";
import type { BillingQuote } from "@/lib/billing/types";
import {
  createRazorpayCheckout,
  loadRazorpayScript,
  type RazorpayCheckoutResponse,
} from "@/lib/razorpay/razorpay-client";

type PaymentStage = "idle" | "starting" | "verifying";
type MapPreviewError = "missing-area" | "failed";

type CreateOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  customerName: string;
  description: string;
};

function isBillingQuote(value: unknown): value is BillingQuote {
  if (typeof value !== "object" || value === null) return false;
  return (
    "planPricePaise" in value &&
    typeof value.planPricePaise === "number" &&
    "discountPaise" in value &&
    typeof value.discountPaise === "number" &&
    "totalPaise" in value &&
    typeof value.totalPaise === "number" &&
    "currency" in value &&
    value.currency === "INR" &&
    "couponCode" in value &&
    (typeof value.couponCode === "string" || value.couponCode === null)
  );
}

function isCreateOrderResponse(value: unknown): value is CreateOrderResponse {
  if (typeof value !== "object" || value === null) return false;
  return (
    "orderId" in value &&
    typeof value.orderId === "string" &&
    "amount" in value &&
    typeof value.amount === "number" &&
    "currency" in value &&
    typeof value.currency === "string" &&
    "keyId" in value &&
    typeof value.keyId === "string" &&
    "customerName" in value &&
    typeof value.customerName === "string" &&
    "description" in value &&
    typeof value.description === "string"
  );
}

async function getApiMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
    ) {
      return body.message;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function createAreaPreviewUrl(points: { lat: number; lng: number }[]): string {
  const savedCamera = readSavedMapCamera();
  return createStaticMapUrl({
    points,
    zoom: savedCamera?.zoom ?? 19,
    mapType: "roadmap",
  });
}

export default function CheckoutSection() {
  const t = useTranslations("Checkout");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [quote, setQuote] = useState<BillingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [mapPreview, setMapPreview] = useState<string | null>(null);
  const [mapPreviewLoading, setMapPreviewLoading] = useState(true);
  const [mapPreviewError, setMapPreviewError] =
    useState<MapPreviewError | null>(null);
  const [selectedAreaAvailable, setSelectedAreaAvailable] = useState(false);
  const [customerName] = useState(() =>
    typeof window === "undefined" ? "" : readSavedLocationName(),
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [paymentStage, setPaymentStage] = useState<PaymentStage>("idle");
  const [paymentResponse, setPaymentResponse] =
    useState<RazorpayCheckoutResponse | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    fetch("/api/billing/quote", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            await getApiMessage(response, "Could not load the plan price."),
          );
        }
        const result: unknown = await response.json();
        if (!isBillingQuote(result)) {
          throw new Error("The server returned an invalid plan price.");
        }
        if (active) setQuote(result);
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not load the plan price.",
          );
        }
      })
      .finally(() => {
        if (active) setQuoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        const points = readSavedMapPoints();
        if (points.length < 4) {
          if (active) {
            setMapPreviewError("missing-area");
            setMapPreviewLoading(false);
          }
          return null;
        }

        if (active) setSelectedAreaAvailable(true);
        return createAreaPreviewUrl(points);
      })
      .then((previewUrl) => {
        if (active && previewUrl) setMapPreview(previewUrl);
      })
      .catch((error: unknown) => {
        console.error(
          "Could not prepare the selected-area map preview.",
          error,
        );
        if (active) {
          setMapPreviewError("failed");
          setMapPreviewLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuoteLoading(true);
    try {
      const submittedCode = coupon.trim().toUpperCase();
      const code =
        submittedCode && submittedCode !== appliedCoupon ? submittedCode : "";
      const url = code
        ? `/api/billing/quote?code=${encodeURIComponent(code)}`
        : "/api/billing/quote";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(
          await getApiMessage(response, "Could not apply coupon."),
        );
      }

      const result: unknown = await response.json();
      if (!isBillingQuote(result)) {
        throw new Error("The server returned an invalid order total.");
      }

      setQuote(result);
      setAppliedCoupon(result.couponCode);
      setCoupon(result.couponCode ?? "");
      toast.success(
        result.couponCode ? t("couponApplied") : t("couponRemoved"),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not apply coupon.",
      );
    } finally {
      setQuoteLoading(false);
    }
  }

  async function submitPaymentVerification(payment: RazorpayCheckoutResponse) {
    setPaymentStage("verifying");
    setVerificationError(null);
    try {
      const response = await fetch("/api/billing/orders/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment),
      });
      if (!response.ok) {
        throw new Error(
          await getApiMessage(response, "Could not verify payment."),
        );
      }

      const body: unknown = await response.json().catch(() => null);
      if (
        typeof body !== "object" ||
        body === null ||
        !("success" in body) ||
        body.success !== true ||
        !("reportSessionId" in body) ||
        typeof body.reportSessionId !== "string" ||
        body.reportSessionId !== payment.razorpay_order_id
      ) {
        throw new Error("Payment verification returned an invalid report session.");
      }

      try {
        window.sessionStorage.setItem(
          REPORT_SESSION_REFERENCE_KEY,
          body.reportSessionId,
        );
        window.dispatchEvent(
          new Event(REPORT_SESSION_REFERENCE_CHANGE_EVENT),
        );
      } catch (error) {
        console.error("Could not save the report session for this tab.", error);
        throw new Error(
          "Could not save your report session in this browser tab.",
        );
      }

      setPaymentStage("idle");
      setPaymentResponse(null);
      setVerificationError(null);
      router.replace("/report");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not verify payment. Please contact support.";
      setVerificationError(message);
      toast.error(message);
    }
  }

  async function verifyPayment(payment: RazorpayCheckoutResponse) {
    setPaymentResponse(payment);
    await submitPaymentVerification(payment);
  }

  async function handleProceed() {
    if (!quote || quoteLoading || paymentStage !== "idle") return;
    setPaymentStage("starting");

    try {
      const response = await fetch("/api/billing/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: appliedCoupon,
          customerName,
          selection: {
            name: customerName,
            points: readSavedMapPoints(),
            zoom: readSavedMapCamera()?.zoom ?? 19,
          },
        }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiMessage(response, "Could not start payment."),
        );
      }

      const orderResult: unknown = await response.json();
      if (!isCreateOrderResponse(orderResult)) {
        throw new Error("The server returned an invalid payment order.");
      }

      if (!(await loadRazorpayScript())) {
        throw new Error("Could not load the Razorpay payment window.");
      }

      const checkout = createRazorpayCheckout({
        key: orderResult.keyId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        name: "Water Warriors",
        description: orderResult.description,
        order_id: orderResult.orderId,
        prefill: {
          name: orderResult.customerName,
          email: "",
          contact: "",
        },
        handler: verifyPayment,
        modal: {
          ondismiss: () => setPaymentStage("idle"),
        },
      });

      if (!checkout) {
        throw new Error("Could not open the Razorpay payment window.");
      }

      setPaymentStage("idle");
      checkout.open();
    } catch (error) {
      setPaymentStage("idle");
      toast.error(
        error instanceof Error ? error.message : "Could not start payment.",
      );
    }
  }

  if (paymentStage !== "idle") {
    return (
      <section
        className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center"
        role="status"
        aria-live="polite"
      >
        <LoaderCircle className="size-12 animate-spin text-primary" />
        <h1 className="mt-5 text-2xl font-semibold text-heading sm:text-3xl">
          {paymentStage === "starting"
            ? t("startingPayment")
            : t("verifyingPayment")}
        </h1>
        <p className="mt-2 max-w-md text-sm text-paragraph sm:text-base">
          {t("paymentProcessingNote")}
        </p>
        {verificationError && paymentResponse && (
          <div className="mt-5">
            <p className="text-sm text-destructive">{verificationError}</p>
            <button
              type="button"
              onClick={() => void submitPaymentVerification(paymentResponse)}
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              {t("retryVerification")}
            </button>
          </div>
        )}
      </section>
    );
  }

  const subtotal = quote?.planPricePaise ?? 0;
  const discount = quote?.discountPaise ?? 0;
  const total = quote?.totalPaise ?? 0;
  const formatPrice = (paise: number) =>
    `₹ ${new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(paise / 100)}`;

  return (
    <section className="container-y-pad relative isolate overflow-hidden">
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
        <div className="relative w-full overflow-hidden rounded-2xl border border-border sm:rounded-4xl">
          {mapPreview && !mapPreviewError ? (
            <>
              <Image
                src={mapPreview}
                alt={tCommon("mapSelectedAreaAlt")}
                width={1800}
                height={1200}
                unoptimized
                sizes="100vw"
                className="block h-auto w-full object-contain"
                onLoad={() => setMapPreviewLoading(false)}
                onError={() => {
                  setMapPreviewLoading(false);
                  setMapPreviewError("failed");
                }}
              />

              {mapPreviewLoading && (
                <p
                  role="status"
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-4 py-2 text-sm text-heading shadow"
                >
                  {t("loadingAreaPreview")}
                </p>
              )}
            </>
          ) : (
            <p
              role={mapPreviewLoading ? "status" : "alert"}
              className="flex min-h-60 w-full items-center justify-center bg-secondary/30 px-6 text-center text-sm text-heading"
            >
              {mapPreviewLoading
                ? t("loadingAreaPreview")
                : mapPreviewError === "missing-area"
                  ? t("missingAreaPreview")
                  : t("areaPreviewFailed")}
            </p>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 lg:mt-14 lg:gap-8">
          <div className="rounded-2xl border border-border bg-background p-5 sm:rounded-3xl sm:p-6">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-12">
              <MapPin className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <p className="mt-4 text-sm text-paragraph sm:mt-5 sm:text-[15px]">
              {t.rich("updateArea", {
                link: (chunks) => (
                  <Link
                    href="/#save-water"
                    className="font-semibold text-heading hover:text-primary"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
            <p className="mt-2 text-xs sm:text-[13px]">{t("updateNote")}</p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 sm:rounded-3xl sm:p-6">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-12">
              <FileText className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <p className="mt-4 text-sm text-paragraph sm:mt-5 sm:text-[15px]">
              {t("seeSavings")}
            </p>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="mt-2 inline-block cursor-pointer text-left text-sm font-semibold text-heading underline decoration-heading underline-offset-4 hover:text-primary hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:text-[15px]"
            >
              {t("viewSample")}
            </button>
          </div>
        </div>

        <div className="mt-8 grid items-start gap-6 sm:mt-10 lg:mt-14 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-2xl bg-secondary/35 p-6 sm:rounded-3xl sm:p-9">
            <h2 className="text-3xl leading-[1.15] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
              {t("completeTitle")}
            </h2>
            <p className="mt-4 text-sm leading-6.5 text-heading sm:mt-5 sm:text-base">
              {t("completeDescription")}
            </p>
          </div>

          <div className="rounded-3xl bg-linear-to-b from-primary/35 to-border p-2.5 shadow-xl shadow-foreground/5 sm:rounded-4xl sm:p-3">
            <div className="overflow-hidden rounded-2xl bg-background sm:rounded-3xl">
              <div className="bg-foreground/3 px-5 pt-6 pb-9 sm:px-6.5 sm:pt-7 sm:pb-10">
                <h3 className="text-2xl font-semibold text-heading sm:text-3xl">
                  {t("planName")}
                </h3>
                <p className="mt-1 text-sm text-paragraph sm:text-base">
                  {t("planDescription")}
                </p>
              </div>

              <div className="relative -mt-5 rounded-t-2xl bg-background px-5 pt-6 pb-6 sm:-mt-6 sm:rounded-t-3xl sm:px-6.5 sm:pt-7 sm:pb-7">
                <dl className="space-y-3 text-sm sm:space-y-4 sm:text-base">
                  <div className="flex items-center justify-between">
                    <dt className="text-heading">{t("subtotal")}</dt>
                    <dd className="text-paragraph">
                      {quoteLoading ? t("loadingPrice") : formatPrice(subtotal)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-heading">{t("discount")}</dt>
                    <dd className="text-paragraph">{formatPrice(discount)}</dd>
                  </div>
                </dl>

                <hr className="my-5 border-t border-dashed border-border sm:my-6" />

                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-heading sm:text-xl">
                    {t("total")}
                  </p>
                  <p className="font-heading text-xl font-semibold text-heading sm:text-2xl">
                    {quoteLoading ? t("loadingPrice") : formatPrice(total)}
                  </p>
                </div>

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
                    onChange={(event) => setCoupon(event.target.value)}
                    placeholder={t("couponPlaceholder")}
                    aria-label={t("couponLabel")}
                    className="min-w-0 flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-muted-foreground sm:text-base"
                  />
                  <button
                    type="submit"
                    disabled={quoteLoading}
                    className="h-10 shrink-0 rounded-lg border border-border bg-foreground/3 px-4 text-sm text-heading transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-5 sm:text-base"
                  >
                    {appliedCoupon &&
                    coupon.trim().toUpperCase() === appliedCoupon
                      ? t("removeCode")
                      : t("applyCode")}
                  </button>
                </form>

                {appliedCoupon && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("appliedCoupon", { code: appliedCoupon })}
                  </p>
                )}

                <PrimaryButton
                  btnType="solid-primary"
                  full
                  disabled={!quote || quoteLoading || !selectedAreaAvailable}
                  onClick={() => void handleProceed()}
                  className="mt-5 w-full sm:mt-6"
                >
                  {t("proceed")}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-secondary/35 px-4 py-4 text-sm text-heading sm:mt-10 sm:items-center sm:px-6 sm:text-base">
          <Star
            className="mt-0.5 size-4 shrink-0 fill-current sm:mt-0"
            aria-hidden
          />
          <p className="text-heading">{t("disclaimer")}</p>
        </div>
      </div>

      <SampleReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </section>
  );
}
