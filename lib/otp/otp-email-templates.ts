type OTPEmailType = "sign-in" | "email-verification" | "forget-password";

const COPY: Record<
  OTPEmailType,
  { subject: string; heading: string; body: string }
> = {
  "sign-in": {
    subject: "Your sign-in code for Water Warriors AI",
    heading: "Sign in to Water Warriors AI",
    body: "Use the code below to sign in. This code expires in 5 minutes.",
  },
  "email-verification": {
    subject: "Verify your email address",
    heading: "Verify your email",
    body: "Use the code below to verify your email address. This code expires in 5 minutes.",
  },
  "forget-password": {
    subject: "Reset your password",
    heading: "Reset your password",
    body: "Use the code below to continue resetting your password. This code expires in 5 minutes.",
  },
};

export function renderOTPEmail(type: OTPEmailType, otp: string) {
  const { subject, heading, body } = COPY[type];

  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #111827;">
    <h2 style="margin: 0 0 12px; font-size: 20px;">${heading}</h2>
    <p style="margin: 0 0 24px; color: #4b5563; font-size: 14px; line-height: 1.5;">${body}</p>
    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827;">${otp}</span>
    </div>
    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
      If you did not request this code, you can safely ignore this email.
      Never share this code with anyone.
    </p>
  </div>`.trim();

  return { subject, html };
}
