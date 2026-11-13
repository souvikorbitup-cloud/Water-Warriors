export type CouponDiscountType = "percentage" | "fixed";

export type Coupon = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  expiresOn: string;
  isExpired: boolean;
};

export type BillingQuote = {
  planPricePaise: number;
  discountPaise: number;
  totalPaise: number;
  currency: "INR";
  couponCode: string | null;
};
