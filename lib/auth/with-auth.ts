import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type ServerSessionUser } from "./auth-server-utils";
import { canAccess, type Permission } from "./permissions";

type RouteHandler = (
  req: NextRequest,
  ctx: { user: ServerSessionUser; params: Promise<Record<string, string>> },
) => Promise<NextResponse> | NextResponse;

interface WithAuthOptions {
  permission?: Permission;
  permissions?: readonly Permission[];
}

/**
 * Wrap an App Router Route Handler with server-side session + permission
 * enforcement. Usage:
 *
 *   export const GET = withAuth(async (req, { user }) => { ... });
 *   export const POST = withAuth(async (req, { user }) => { ... }, { permission: PERMISSIONS.allUsersView });
 */
export function withAuth(handler: RouteHandler, options: WithAuthOptions = {}) {
  return async (
    req: NextRequest,
    routeCtx: { params: Promise<Record<string, string>> },
  ) => {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED", message: "You must be signed in." },
        { status: 401 },
      );
    }

    const hasPermission = options.permission
      ? canAccess(user.role, options.permission)
      : options.permissions
        ? options.permissions.some((permission) =>
            canAccess(user.role, permission),
          )
        : true;

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "You do not have permission to do this.",
        },
        { status: 403 },
      );
    }

    return handler(req, { user, params: routeCtx.params });
  };
}
