import "server-only";

import { Model, Schema, model, models } from "mongoose";
import type { CouponDiscountType } from "@/lib/billing/types";

export interface ICoupon {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  expiresOn: string;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[A-Z0-9_-]{3,30}$/,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: Number.EPSILON,
      max: 1_000_000,
    },
    expiresOn: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
  },
  { timestamps: true, collection: "coupons" },
);

couponSchema.index({ code: 1 }, { unique: true, name: "coupon_code_unique" });

couponSchema.pre("validate", function () {
  if (
    this.discountType === "percentage" &&
    (!Number.isInteger(this.discountValue) || this.discountValue > 99)
  ) {
    this.invalidate(
      "discountValue",
      "Percentage discounts must be whole numbers from 1 to 99.",
    );
  }

  if (
    this.discountType === "fixed" &&
    Math.abs(this.discountValue * 100 - Math.round(this.discountValue * 100)) >=
      1e-8
  ) {
    this.invalidate(
      "discountValue",
      "Fixed discounts can have at most two decimal places.",
    );
  }

  const date = new Date(`${this.expiresOn}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== this.expiresOn
  ) {
    this.invalidate("expiresOn", "Enter a valid expiry date.");
  }
});

const Coupon =
  (models.Coupon as Model<ICoupon> | undefined) ??
  model<ICoupon>("Coupon", couponSchema);

export default Coupon;
