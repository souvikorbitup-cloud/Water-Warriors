import type { RooftopSelection } from "@/lib/report/types";
import type { AdminListResponse } from "@/types/submissions";

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

export type BillingOrderListItem = {
  id: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  couponCode: string | null;
  customerName: string;
  rooftopSelection?: RooftopSelection;
  status: "created" | "paid";
  paymentId: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type BillingOrderListResponse = AdminListResponse<BillingOrderListItem>;

export type BillingOrderListQuery = {
  page: number;
  limit: number;
  search: string;
  status: "" | "created" | "paid";
  sort:
    | "createdAt:desc"
    | "createdAt:asc"
    | "amountPaise:desc"
    | "amountPaise:asc"
    | "status:asc"
    | "status:desc";
};
