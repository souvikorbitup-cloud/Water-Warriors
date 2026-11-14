import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listBillingOrders } from "@/lib/billing/billing-service";

const billingOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(200).default(""),
  status: z.enum(["", "created", "paid"]).default(""),
  sort: z
    .enum([
      "createdAt:desc",
      "createdAt:asc",
      "amountPaise:desc",
      "amountPaise:asc",
      "status:asc",
      "status:desc",
    ])
    .default("createdAt:desc"),
});

export const GET = withAuth(
  async (request: NextRequest) => {
    const parsedQuery = billingOrdersQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const query = parsedQuery.success
      ? parsedQuery.data
      : billingOrdersQuerySchema.parse({});

    return NextResponse.json(await listBillingOrders(query));
  },
  { permission: PERMISSIONS.paymentsView },
);
