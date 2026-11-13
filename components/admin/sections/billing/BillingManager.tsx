"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Coupon, CouponDiscountType } from "@/lib/billing/types";
import { couponInputSchema, planPriceFormSchema } from "@/lib/billing/schemas";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";

function isCoupon(value: unknown): value is Coupon {
  if (typeof value !== "object" || value === null) return false;
  return (
    "code" in value &&
    typeof value.code === "string" &&
    "discountType" in value &&
    (value.discountType === "percentage" || value.discountType === "fixed") &&
    "discountValue" in value &&
    typeof value.discountValue === "number" &&
    "expiresOn" in value &&
    typeof value.expiresOn === "string" &&
    "isExpired" in value &&
    typeof value.isExpired === "boolean"
  );
}

type CouponForm = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: string;
  expiresOn: string;
};

const EMPTY_COUPON: CouponForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  expiresOn: "",
};

function suggestCouponCode(
  discountType: CouponDiscountType,
  discountValue: string,
  coupons: Coupon[],
): string {
  const value = Number(discountValue);
  if (!Number.isFinite(value) || value <= 0) return "";

  const codeValue =
    discountType === "percentage"
      ? String(value)
      : value
          .toFixed(2)
          .replace(/\.?0+$/, "")
          .replace(".", "_");
  const base = `${discountType === "percentage" ? "SAVE" : "OFF"}${codeValue}`;
  const existingCodes = new Set(coupons.map((coupon) => coupon.code));
  let code = base.slice(0, 30);
  let suffix = 2;

  while (existingCodes.has(code)) {
    const suffixText = `-${suffix}`;
    code = `${base.slice(0, 30 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  return code;
}

async function getErrorMessage(
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

function getTodayInIndia(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

export default function BillingManager({
  initialPricePaise,
  initialCoupons,
}: {
  initialPricePaise: number;
  initialCoupons: Coupon[];
}) {
  const [price, setPrice] = useState((initialPricePaise / 100).toFixed(2));
  const [coupons, setCoupons] = useState(initialCoupons);
  const [couponForm, setCouponForm] = useState<CouponForm>(EMPTY_COUPON);
  const [couponCodeEdited, setCouponCodeEdited] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [savingPrice, setSavingPrice] = useState(false);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  async function refreshCoupons() {
    const response = await fetch("/api/admin/billing", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Could not reload billing settings."),
      );
    }

    const data: unknown = await response.json();
    if (
      typeof data !== "object" ||
      data === null ||
      !("pricePaise" in data) ||
      typeof data.pricePaise !== "number" ||
      !("coupons" in data) ||
      !Array.isArray(data.coupons)
    ) {
      throw new Error("The server returned invalid billing settings.");
    }

    const coupons = data.coupons.filter(isCoupon);
    if (coupons.length !== data.coupons.length) {
      throw new Error("The server returned invalid coupon data.");
    }

    setPrice((data.pricePaise / 100).toFixed(2));
    setCoupons(coupons);
  }

  async function handleSavePrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedPrice = planPriceFormSchema.safeParse(price);
    if (!parsedPrice.success) {
      toast.error(
        parsedPrice.error.issues[0]?.message ?? "Enter a valid plan price.",
      );
      return;
    }

    setSavingPrice(true);
    try {
      const response = await fetch("/api/admin/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricePaise: parsedPrice.data }),
      });
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Could not save plan price."),
        );
      }

      toast.success("Plus plan price updated.");
      try {
        await refreshCoupons();
      } catch {
        toast.warning(
          "Price saved, but billing details could not be refreshed.",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save plan price.",
      );
    } finally {
      setSavingPrice(false);
    }
  }

  function startEditing(coupon: Coupon) {
    setEditingCode(coupon.code);
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      expiresOn: coupon.expiresOn,
    });
  }

  function clearCouponForm() {
    setEditingCode(null);
    setCouponForm(EMPTY_COUPON);
    setCouponCodeEdited(false);
  }

  async function handleSaveCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedCoupon = couponInputSchema.safeParse({
      ...couponForm,
      discountValue: Number(couponForm.discountValue),
    });
    if (!parsedCoupon.success) {
      toast.error(
        parsedCoupon.error.issues[0]?.message ??
          "Please check the coupon details.",
      );
      return;
    }

    if (parsedCoupon.data.expiresOn < getTodayInIndia()) {
      toast.warning(
        "This expiry date is in the past. The coupon will be saved as expired.",
      );
    }

    setSavingCoupon(true);
    try {
      const response = await fetch(
        editingCode
          ? `/api/admin/billing/coupons/${encodeURIComponent(editingCode)}`
          : "/api/admin/billing",
        {
          method: editingCode ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedCoupon.data),
        },
      );
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Could not save coupon."),
        );
      }

      toast.success(
        editingCode
          ? `Coupon ${parsedCoupon.data.code} updated.`
          : `Coupon ${parsedCoupon.data.code} created. Enter this code at checkout.`,
      );
      clearCouponForm();
      try {
        await refreshCoupons();
      } catch {
        toast.warning(
          "Coupon saved, but the coupon list could not be refreshed.",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save coupon.",
      );
    } finally {
      setSavingCoupon(false);
    }
  }

  async function handleDeleteCoupon(code: string) {
    setDeletingCode(code);
    try {
      const response = await fetch(
        `/api/admin/billing/coupons/${encodeURIComponent(code)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Could not delete coupon."),
        );
      }

      toast.success("Coupon deleted.");
      setCoupons((items) => items.filter((coupon) => coupon.code !== code));
      if (editingCode === code) clearCouponForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete coupon.",
      );
    } finally {
      setDeletingCode(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-heading">Plans & Coupons</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the Plus plan price and manage coupon codes and expiry dates.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-heading">Plus plan price</h2>
        <form
          onSubmit={handleSavePrice}
          className="mt-4 flex max-w-lg flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="plus-plan-price">Price (INR)</Label>
            <Input
              id="plus-plan-price"
              type="number"
              min="1"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
              className="h-10! w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
          <PrimaryButton
            type="submit"
            disabled={savingPrice}
            btnType="solid-primary"
            size="sm"
          >
            {savingPrice ? "Saving..." : "Save price"}
          </PrimaryButton>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-heading">
            {editingCode ? `Edit ${editingCode}` : "Create a coupon"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A coupon applies to one order and expires at the end of its date in
            India time.
          </p>
        </div>

        <form
          onSubmit={handleSaveCoupon}
          className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-2">
            <Label htmlFor="coupon-code">Coupon code</Label>
            <Input
              id="coupon-code"
              value={couponForm.code}
              onChange={(event) => {
                setCouponCodeEdited(true);
                setCouponForm((form) => ({
                  ...form,
                  code: event.target.value,
                }));
              }}
              placeholder="SAVE10"
              minLength={3}
              maxLength={30}
              disabled={Boolean(editingCode)}
              required
              className="h-10! w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-discount-type">Discount type</Label>
            <select
              id="coupon-discount-type"
              value={couponForm.discountType}
              onChange={(event) => {
                const discountType: CouponDiscountType =
                  event.target.value === "fixed" ? "fixed" : "percentage";
                setCouponForm((form) => {
                  const nextForm = { ...form, discountType };
                  if (editingCode || couponCodeEdited) return nextForm;

                  return {
                    ...nextForm,
                    code: suggestCouponCode(
                      discountType,
                      nextForm.discountValue,
                      coupons,
                    ),
                  };
                });
              }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed INR</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-discount-value">
              {couponForm.discountType === "percentage"
                ? "Discount (%)"
                : "Discount (INR)"}
            </Label>
            <Input
              id="coupon-discount-value"
              type="number"
              min="1"
              className="h-10! w-full rounded-lg border border-input bg-background px-3 text-sm"
              max={couponForm.discountType === "percentage" ? "99" : undefined}
              step="1"
              value={couponForm.discountValue}
              onChange={(event) =>
                setCouponForm((form) => {
                  const discountValue = event.target.value;
                  const nextForm = { ...form, discountValue };
                  if (editingCode || couponCodeEdited) return nextForm;

                  return {
                    ...nextForm,
                    code: suggestCouponCode(
                      nextForm.discountType,
                      discountValue,
                      coupons,
                    ),
                  };
                })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-expiry">Expiry date</Label>
            <Input
              id="coupon-expiry"
              type="date"
              className="h-10! w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={couponForm.expiresOn}
              onChange={(event) =>
                setCouponForm((form) => ({
                  ...form,
                  expiresOn: event.target.value,
                }))
              }
              required
            />
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <Button
              type="submit"
              disabled={savingCoupon}
              className="h-10! rounded-lg cursor-pointer px-3 text-sm"
            >
              {savingCoupon ? (
                "Saving..."
              ) : editingCode ? (
                "Save coupon"
              ) : (
                <>
                  <Plus className="size-4" />
                  Create coupon
                </>
              )}
            </Button>
            {editingCode && (
              <Button
                type="button"
                variant="outline"
                onClick={clearCouponForm}
                className="h-10! rounded-lg cursor-pointer px-3 text-sm"
              >
                <X className="size-4" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-heading">Coupon codes</h2>
        {coupons.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No coupon codes have been created.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {coupons.map((coupon) => (
              <li
                key={coupon.code}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-heading">{coupon.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}% off`
                      : `₹${coupon.discountValue.toFixed(2)} off`}
                    {" · "}Expires {coupon.expiresOn}
                    {coupon.isExpired && (
                      <>
                        {" · "}
                        <span className="text-destructive font-medium">
                          Expired
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startEditing(coupon)}
                    aria-label={`Edit ${coupon.code}`}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleDeleteCoupon(coupon.code)}
                    disabled={deletingCode === coupon.code}
                    aria-label={`Delete ${coupon.code}`}
                  >
                    <Trash2 className="size-4" />
                    {deletingCode === coupon.code ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
