import "server-only";

import type { Document } from "mongodb";
import type { SortOrder } from "mongoose";
import { connectDB } from "@/lib/db";
import CouponModel, { type ICoupon } from "@/lib/models/Coupon.model";
import BillingOrderModel, {
  type IBillingOrder,
} from "@/lib/models/BillingOrder.model";
import { getSiteSettingsCollection } from "@/lib/services/site-settings";
import type {
  BillingQuote,
  Coupon,
  BillingOrderListItem,
  BillingOrderListQuery,
  BillingOrderListResponse,
} from "@/lib/billing/types";
import type { RooftopSelection } from "@/lib/report/types";
import { escapeRegex } from "@/lib/submissions/sanitize";

export const DEFAULT_PLUS_PRICE_PAISE = 9900;
export const BILLING_CURRENCY = "INR";
export type {
  BillingQuote,
  Coupon,
  CouponDiscountType,
} from "@/lib/billing/types";

const PLAN_SETTINGS_ID = "plus-plan-billing";
const COUPON_ID_PREFIX = "coupon:";

type PlanSettingsDocument = Document & {
  _id: string;
  pricePaise: number;
};

type CouponFields = Pick<
  ICoupon,
  "code" | "discountType" | "discountValue" | "expiresOn"
>;

type LegacyCouponDocument = Document &
  CouponFields & {
    _id: string;
  };

export type BillingOrderDocument = IBillingOrder;

type LegacyBillingOrderDocument = Document &
  BillingOrderDocument & {
    _id: string;
  };

export class InvalidCouponError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCouponError";
  }
}

export class BillingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingValidationError";
  }
}

function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

function getCouponExpiration(expiresOn: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) return null;
  const date = new Date(`${expiresOn}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== expiresOn
  ) {
    return null;
  }

  const expiration = new Date(`${expiresOn}T23:59:59.999+05:30`);
  return Number.isNaN(expiration.getTime()) ? null : expiration;
}

function isValidCouponData(coupon: CouponFields): boolean {
  return (
    coupon.code === normalizeCouponCode(coupon.code) &&
    (coupon.discountType === "percentage" || coupon.discountType === "fixed") &&
    Number.isFinite(coupon.discountValue) &&
    coupon.discountValue > 0 &&
    (coupon.discountType !== "percentage" ||
      (Number.isInteger(coupon.discountValue) && coupon.discountValue <= 99)) &&
    (coupon.discountType !== "fixed" ||
      Math.abs(
        coupon.discountValue * 100 - Math.round(coupon.discountValue * 100),
      ) < 1e-8) &&
    getCouponExpiration(coupon.expiresOn) !== null
  );
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

async function migrateLegacyCoupons(): Promise<void> {
  const siteSettings = await getSiteSettingsCollection();
  const legacyCoupons = await siteSettings
    .find<LegacyCouponDocument>({
      _id: { $regex: `^${COUPON_ID_PREFIX}` },
    })
    .toArray();
  if (legacyCoupons.length === 0) return;

  await connectDB();
  for (const legacyCoupon of legacyCoupons) {
    const { _id, ...coupon } = legacyCoupon;
    if (
      _id !== `${COUPON_ID_PREFIX}${coupon.code}` ||
      !isValidCouponData(coupon)
    ) {
      throw new Error(`Stored legacy coupon ${_id} is invalid.`);
    }

    try {
      await CouponModel.updateOne(
        { code: coupon.code },
        { $setOnInsert: coupon },
        { upsert: true },
      );
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
    }

    await siteSettings.deleteOne({ _id });
  }
}

export async function getPlusPlanPricePaise(): Promise<number> {
  const collection = await getSiteSettingsCollection();
  const settings = await collection.findOne<PlanSettingsDocument>({
    _id: PLAN_SETTINGS_ID,
  });
  if (!settings) return DEFAULT_PLUS_PRICE_PAISE;

  if (!Number.isSafeInteger(settings.pricePaise) || settings.pricePaise < 100) {
    throw new Error("Stored Plus plan price is invalid.");
  }

  return settings.pricePaise;
}

export async function savePlusPlanPricePaise(
  pricePaise: number,
): Promise<void> {
  if (!Number.isSafeInteger(pricePaise) || pricePaise < 100) {
    throw new BillingValidationError("Plan price must be at least ₹1.00.");
  }

  await migrateLegacyCoupons();
  await connectDB();
  const fixedCoupons = await CouponModel.find({ discountType: "fixed" })
    .select("discountValue")
    .lean();
  if (
    fixedCoupons.some(
      (coupon) => Math.round(coupon.discountValue * 100) >= pricePaise,
    )
  ) {
    throw new BillingValidationError(
      "The plan price must exceed every fixed coupon discount.",
    );
  }

  const collection = await getSiteSettingsCollection();
  await collection.updateOne(
    { _id: PLAN_SETTINGS_ID },
    { $set: { pricePaise, updatedAt: new Date() } },
    { upsert: true },
  );
}

export async function getBillingQuote(
  submittedCode?: string,
): Promise<BillingQuote> {
  const planPricePaise = await getPlusPlanPricePaise();
  const code = submittedCode ? normalizeCouponCode(submittedCode) : "";

  if (!code) {
    return {
      planPricePaise,
      discountPaise: 0,
      totalPaise: planPricePaise,
      currency: BILLING_CURRENCY,
      couponCode: null,
    };
  }

  await migrateLegacyCoupons();
  await connectDB();
  const coupon = await CouponModel.findOne({ code }).lean();

  if (!coupon || !isValidCouponData(coupon)) {
    throw new InvalidCouponError("That coupon code is invalid.");
  }

  const expiration = getCouponExpiration(coupon.expiresOn);
  if (!expiration || Date.now() > expiration.getTime()) {
    throw new InvalidCouponError("That coupon code has expired.");
  }

  const discountPaise =
    coupon.discountType === "percentage"
      ? Math.floor((planPricePaise * coupon.discountValue) / 100)
      : Math.round(coupon.discountValue * 100);

  if (discountPaise >= planPricePaise) {
    throw new InvalidCouponError(
      "That coupon discount is greater than the current plan price.",
    );
  }

  return {
    planPricePaise,
    discountPaise,
    totalPaise: planPricePaise - discountPaise,
    currency: BILLING_CURRENCY,
    couponCode: coupon.code,
  };
}

export async function listCoupons(): Promise<Coupon[]> {
  await migrateLegacyCoupons();
  await connectDB();
  const documents = await CouponModel.find({}).lean();
  const now = Date.now();

  return documents.map((coupon) => {
    if (!isValidCouponData(coupon)) {
      throw new Error(`Stored coupon ${coupon.code} is invalid.`);
    }

    const expiration = getCouponExpiration(coupon.expiresOn);
    if (!expiration)
      throw new Error(`Stored coupon ${coupon.code} is invalid.`);

    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      expiresOn: coupon.expiresOn,
      isExpired: now > expiration.getTime(),
    };
  });
}

export async function createCoupon(
  coupon: Omit<Coupon, "isExpired">,
): Promise<void> {
  const normalized = {
    ...coupon,
    code: normalizeCouponCode(coupon.code),
  };

  if (!isValidCouponData(normalized)) {
    throw new BillingValidationError("Coupon details are invalid.");
  }

  await migrateLegacyCoupons();
  if (
    normalized.discountType === "fixed" &&
    Math.round(normalized.discountValue * 100) >=
      (await getPlusPlanPricePaise())
  ) {
    throw new BillingValidationError(
      "The fixed discount must be less than the plan price.",
    );
  }
  await connectDB();
  await CouponModel.create(normalized);
}

export async function updateCoupon(
  oldCode: string,
  coupon: Omit<Coupon, "isExpired">,
): Promise<boolean> {
  const normalizedOldCode = normalizeCouponCode(oldCode);
  const normalized = {
    ...coupon,
    code: normalizeCouponCode(coupon.code),
  };

  if (!isValidCouponData(normalized)) {
    throw new BillingValidationError("Coupon details are invalid.");
  }

  await migrateLegacyCoupons();
  if (
    normalized.discountType === "fixed" &&
    Math.round(normalized.discountValue * 100) >=
      (await getPlusPlanPricePaise())
  ) {
    throw new BillingValidationError(
      "The fixed discount must be less than the plan price.",
    );
  }
  if (normalizedOldCode !== normalized.code) {
    throw new BillingValidationError(
      "Coupon codes cannot be changed after creation.",
    );
  }

  await connectDB();
  const result = await CouponModel.updateOne(
    { code: normalizedOldCode },
    {
      $set: {
        discountType: normalized.discountType,
        discountValue: normalized.discountValue,
        expiresOn: normalized.expiresOn,
        updatedAt: new Date(),
      },
    },
  );

  return result.matchedCount > 0;
}

export async function deleteCoupon(code: string): Promise<boolean> {
  await migrateLegacyCoupons();
  await connectDB();
  const result = await CouponModel.deleteOne({
    code: normalizeCouponCode(code),
  });
  return result.deletedCount > 0;
}

export async function saveBillingOrder(
  order: BillingOrderDocument,
): Promise<void> {
  await connectDB();
  await BillingOrderModel.create(order);
}

async function migrateLegacyBillingOrder(
  orderId: string,
): Promise<BillingOrderDocument | null> {
  const collection = await getSiteSettingsCollection();
  const legacyOrder = await collection.findOne<LegacyBillingOrderDocument>({
    _id: `billing-order:${orderId}`,
  });
  if (!legacyOrder) return null;

  const { _id, ...order } = legacyOrder;
  if (order.orderId !== orderId) {
    throw new Error("Stored billing order ID does not match its document ID.");
  }

  await connectDB();
  try {
    await BillingOrderModel.updateOne(
      { orderId },
      { $setOnInsert: order },
      { upsert: true },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }

  const migratedOrder = await BillingOrderModel.findOne({ orderId }).lean();
  if (!migratedOrder) {
    throw new Error("Legacy billing order could not be migrated.");
  }
  await collection.deleteOne({ _id });
  return migratedOrder;
}

export async function getBillingOrder(
  orderId: string,
): Promise<BillingOrderDocument | null> {
  await connectDB();
  const order = await BillingOrderModel.findOne({ orderId }).lean();
  if (order) return order;
  return migrateLegacyBillingOrder(orderId);
}

export async function clearBillingOrderRooftopSelection(
  orderId: string,
): Promise<void> {
  const order = await getBillingOrder(orderId);
  if (!order) return;
  await BillingOrderModel.updateOne(
    { orderId },
    { $unset: { rooftopSelection: "" } },
  );
}

export async function saveBillingOrderRooftopSelection(
  orderId: string,
  rooftopSelection: RooftopSelection,
): Promise<void> {
  const order = await getBillingOrder(orderId);
  if (!order) return;
  await BillingOrderModel.updateOne(
    { orderId, rooftopSelection: { $exists: false } },
    { $set: { rooftopSelection } },
  );
}

export async function markBillingOrderPaid(
  orderId: string,
  paymentId: string,
): Promise<void> {
  await getBillingOrder(orderId);
  const result = await BillingOrderModel.updateOne(
    { orderId, status: "created" },
    { $set: { status: "paid", paymentId, paidAt: new Date() } },
  );
  if (result.matchedCount === 0) {
    const existing = await getBillingOrder(orderId);
    if (existing?.status !== "paid" || existing.paymentId !== paymentId) {
      throw new Error("Payment order could not be marked as paid.");
    }
  }
}

export async function listBillingOrders(
  query: BillingOrderListQuery,
): Promise<BillingOrderListResponse> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    const pattern = escapeRegex(query.search.trim());
    filter.$or = [
      { orderId: { $regex: pattern, $options: "i" } },
      { customerName: { $regex: pattern, $options: "i" } },
      { paymentId: { $regex: pattern, $options: "i" } },
      { couponCode: { $regex: pattern, $options: "i" } },
    ];
  }

  const sortOptions: Record<
    BillingOrderListQuery["sort"],
    Record<string, SortOrder>
  > = {
    "createdAt:desc": { createdAt: -1 },
    "createdAt:asc": { createdAt: 1 },
    "amountPaise:desc": { amountPaise: -1 },
    "amountPaise:asc": { amountPaise: 1 },
    "status:asc": { status: 1 },
    "status:desc": { status: -1 },
  };
  const skip = (query.page - 1) * query.limit;

  const [documents, total] = await Promise.all([
    BillingOrderModel.find(filter)
      .sort(sortOptions[query.sort])
      .skip(skip)
      .limit(query.limit)
      .lean<Array<IBillingOrder & { _id: unknown }>>(),
    BillingOrderModel.countDocuments(filter),
  ]);

  const items: BillingOrderListItem[] = documents.map((document) => ({
    id: String(document._id),
    orderId: document.orderId,
    amountPaise: document.amountPaise,
    currency: document.currency,
    couponCode: document.couponCode ?? null,
    customerName: document.customerName ?? "",
    rooftopSelection: document.rooftopSelection,
    status: document.status,
    paymentId: document.paymentId ?? null,
    createdAt: document.createdAt.toISOString(),
    paidAt: document.paidAt?.toISOString() ?? null,
  }));

  return {
    items,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}
