import { z } from "zod";

function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export const planPriceSchema = z.object({
  pricePaise: z.number().int().min(100).max(100_000_000),
});

export const planPriceFormSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a price with up to two decimal places.")
  .transform((value) => {
    const [rupees, paise = ""] = value.split(".");
    return Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
  })
  .pipe(planPriceSchema.shape.pricePaise);

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, "Use 3–30 letters, numbers, _ or -."),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().positive().max(1_000_000),
    expiresOn: z.string().refine(isDateOnly, "Enter a valid expiry date."),
  })
  .superRefine((coupon, context) => {
    if (
      coupon.discountType === "percentage" &&
      (!Number.isInteger(coupon.discountValue) || coupon.discountValue > 99)
    ) {
      context.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Percentage discounts must be whole numbers from 1 to 99.",
      });
    }

    if (
      coupon.discountType === "fixed" &&
      Math.abs(
        coupon.discountValue * 100 - Math.round(coupon.discountValue * 100),
      ) >= 1e-8
    ) {
      context.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Fixed discounts can have at most two decimal places.",
      });
    }
  });
