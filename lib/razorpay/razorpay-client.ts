"use client";

export interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  handler: (response: RazorpayCheckoutResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayCheckoutInstance {
  open: () => void;
  close: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayCheckoutOptions,
    ) => RazorpayCheckoutInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** Loads the Razorpay Checkout script once, resolving when it's ready. */
export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** Creates a Razorpay Checkout instance, or null if the script isn't ready. */
export function createRazorpayCheckout(
  options: RazorpayCheckoutOptions,
): RazorpayCheckoutInstance | null {
  if (typeof window === "undefined" || !window.Razorpay) return null;
  return new window.Razorpay(options);
}
