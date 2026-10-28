import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

/**
 * Centralized, server-only Razorpay client.
 *
 * Talks to Razorpay's REST API directly with fetch (Basic auth), so there is
 * no SDK dependency and nothing that can leak into a client/Turbopack bundle.
 * Every future Razorpay operation (refunds, orders, fetch payment, ...) should
 * be added here and reused — never call api.razorpay.com from anywhere else.
 *
 * Env (all server-only, never NEXT_PUBLIC_*):
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   RAZORPAY_WEBHOOK_SECRET
 */

const API_BASE = "https://api.razorpay.com/v1";

export class RazorpayError extends Error {
  status: number;
  code?: string;
  /** true when the failure is our configuration, not Razorpay rejecting a request */
  isConfig: boolean;

  constructor(message: string, status = 502, code?: string, isConfig = false) {
    super(message);
    this.name = "RazorpayError";
    this.status = status;
    this.code = code;
    this.isConfig = isConfig;
  }
}

type EnvName =
  | "RAZORPAY_KEY_ID"
  | "RAZORPAY_KEY_SECRET"
  | "RAZORPAY_WEBHOOK_SECRET";

// Read lazily (not at import time) so `next build` works without the keys.
function requireEnv(name: EnvName): string {
  const value = process.env[name];
  if (!value) {
    throw new RazorpayError(`${name} is not configured.`, 500, undefined, true);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Types (only the fields we use)
// ---------------------------------------------------------------------------

export type RazorpayPaymentLinkStatus =
  | "created"
  | "partially_paid"
  | "expired"
  | "cancelled"
  | "paid";

export interface RazorpayPaymentLink {
  id: string;
  short_url: string;
  status: RazorpayPaymentLinkStatus;
  amount: number; // paise
  amount_paid: number; // paise
  currency: string;
  reference_id?: string;
  expire_by?: number;
  notes?: Record<string, string>;
}

export interface CreatePaymentLinkParams {
  amountPaise: number;
  currency: string;
  description: string;
  /** Max 40 chars, unique per link. We use the Payment document id. */
  referenceId: string;
  /** Unix seconds; Razorpay requires at least 15 minutes in the future. */
  expireBy: number;
  customer: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
  notes?: Record<string, string>;
}

export interface CreateRazorpayOrderParams {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayWebhookPayload {
  entity?: string;
  event: string;
  created_at?: number;
  payload?: {
    payment_link?: { entity?: RazorpayPaymentLink };
    order?: { entity?: RazorpayOrder };
    payment?: {
      entity?: {
        id: string;
        order_id?: string;
        amount: number;
        currency: string;
        status: string;
        method?: string;
        notes?: Record<string, string> | unknown[];
        error_description?: string | null;
        error_reason?: string | null;
      };
    };
  };
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const credentials = Buffer.from(
    `${requireEnv("RAZORPAY_KEY_ID")}:${requireEnv("RAZORPAY_KEY_SECRET")}`,
  ).toString("base64");

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new RazorpayError("Could not reach Razorpay.", 502);
  }

  const data = (await res.json().catch(() => ({}))) as {
    error?: { description?: string; code?: string };
  };

  if (!res.ok) {
    throw new RazorpayError(
      data.error?.description ?? "Razorpay request failed.",
      res.status,
      data.error?.code,
    );
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Payment Links
// ---------------------------------------------------------------------------

export function createPaymentLink(p: CreatePaymentLinkParams) {
  const customer: Record<string, string> = {};
  if (p.customer.name) customer.name = p.customer.name;
  if (p.customer.email) customer.email = p.customer.email;
  if (p.customer.contact) customer.contact = p.customer.contact;

  return request<RazorpayPaymentLink>("POST", "/payment_links", {
    amount: p.amountPaise,
    currency: p.currency,
    accept_partial: false,
    description: p.description,
    reference_id: p.referenceId,
    expire_by: p.expireBy,
    customer,
    // We send our own email through the project's mail system.
    notify: { email: false, sms: false },
    reminder_enable: false,
    notes: p.notes,
  });
}

export function fetchPaymentLink(paymentLinkId: string) {
  return request<RazorpayPaymentLink>(
    "GET",
    `/payment_links/${encodeURIComponent(paymentLinkId)}`,
  );
}

export function cancelPaymentLink(paymentLinkId: string) {
  return request<RazorpayPaymentLink>(
    "POST",
    `/payment_links/${encodeURIComponent(paymentLinkId)}/cancel`,
  );
}

export function getRazorpayKeyId(): string {
  return requireEnv("RAZORPAY_KEY_ID");
}

export function createRazorpayOrder(p: CreateRazorpayOrderParams) {
  return request<RazorpayOrder>("POST", "/orders", {
    amount: p.amountPaise,
    currency: p.currency,
    receipt: p.receipt.slice(0, 40),
    payment_capture: 1,
    notes: p.notes,
  });
}

export function verifyOrderPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const expected = createHmac("sha256", requireEnv("RAZORPAY_KEY_SECRET"))
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(params.razorpaySignature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

/**
 * Verifies the `x-razorpay-signature` header: HMAC-SHA256 of the RAW request
 * body with the webhook secret. Must be called with the unparsed body text.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;

  const expected = createHmac("sha256", requireEnv("RAZORPAY_WEBHOOK_SECRET"))
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
