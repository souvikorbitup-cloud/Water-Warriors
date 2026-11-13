import "server-only";

import { cookies } from "next/headers";
import {
  getOrderIdFromReportCookie,
  REPORT_ACCESS_COOKIE,
} from "@/lib/report/access";
import {
  getReportSession,
  toReportSessionData,
} from "@/lib/report/report-session-service";

export async function getCurrentAuthorizedReport() {
  const token = (await cookies()).get(REPORT_ACCESS_COOKIE)?.value;
  const orderId = getOrderIdFromReportCookie(token);
  if (!orderId) return null;

  const session = await getReportSession(orderId);
  return session ? toReportSessionData(session) : null;
}
