import "server-only";

import { cookies } from "next/headers";
import {
  getOrderIdFromReportCookie,
  REPORT_ACCESS_COOKIE,
} from "@/lib/report/access";
import {
  getBillingOrder,
  type BillingOrderDocument,
} from "@/lib/billing/billing-service";
import {
  getReportSession,
  setReportSessionConsent,
  toReportSessionData,
} from "@/lib/report/report-session-service";

type AuthorizedReportContext = {
  orderId: string;
  order: BillingOrderDocument;
  session: NonNullable<Awaited<ReturnType<typeof getReportSession>>>;
};

async function getAuthorizedReportOrderId(): Promise<string | null> {
  const token = (await cookies()).get(REPORT_ACCESS_COOKIE)?.value;
  return getOrderIdFromReportCookie(token);
}

export async function getCurrentAuthorizedReportContext(
  sessionReference?: string,
): Promise<AuthorizedReportContext | null> {
  const orderId = await getAuthorizedReportOrderId();
  if (
    !orderId ||
    (sessionReference !== undefined && orderId !== sessionReference)
  ) {
    return null;
  }

  const [session, order] = await Promise.all([
    getReportSession(orderId),
    getBillingOrder(orderId),
  ]);
  if (!session || !order || order.status !== "paid") return null;

  return { orderId, session, order };
}

export async function updateCurrentAuthorizedReportConsent(
  accepted: boolean,
  sessionReference?: string,
) {
  const context = await getCurrentAuthorizedReportContext(sessionReference);
  if (!context) return null;

  const session = await setReportSessionConsent(context.orderId, accepted);
  const order = await getBillingOrder(context.orderId);
  if (!order) return null;
  return {
    session,
    order,
    data: toReportSessionData(session, order, accepted),
  };
}

export async function getCurrentAuthorizedReport(
  includeDetails = true,
  sessionReference?: string,
) {
  const context = await getCurrentAuthorizedReportContext(sessionReference);
  if (!context) return null;

  return toReportSessionData(
    context.session,
    context.order,
    includeDetails && context.session.analyticsConsent,
  );
}
