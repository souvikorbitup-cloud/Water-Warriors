function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(heading: string, bodyHtml: string): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
    <h2 style="margin: 0 0 12px; font-size: 20px;">${heading}</h2>
    ${bodyHtml}
    <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
      Water Warriors AI · This is an automated confirmation. Please do not reply to this email.
    </p>
  </div>`.trim();
}

export function renderContactThankYouEmail(name: string) {
  const safeName = escapeHtml(name);
  return {
    subject: "We received your message — Water Warriors AI",
    html: layout(
      "Thank you for contacting Water Warriors AI",
      `
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 14px; line-height: 1.5;">
          Hi ${safeName},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 14px; line-height: 1.5;">
          We have received your message and our team will get back to you as soon as we can.
        </p>
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
          If your question is about a property or report, including the location and the step you were on helps us reply faster.
        </p>
      `,
    ),
  };
}

export function renderFeedbackThankYouEmail(name?: string) {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hello,";
  return {
    subject: "Thank you for your feedback — Water Warriors AI",
    html: layout(
      "We received your feedback",
      `
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 14px; line-height: 1.5;">
          ${greeting}
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 14px; line-height: 1.5;">
          Thank you for taking the time to share your experience with Water Warriors AI. Your feedback helps us make rainwater harvesting easier to explore.
        </p>
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
          If you included a question, we will follow up when a response is needed.
        </p>
      `,
    ),
  };
}
