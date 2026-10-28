import { SidebarProvider } from "@/context/SidebarContext";
import { requirePageAuth } from "@/lib/auth/auth-server-utils";
import Loding from "@/components/main/shared/loading/Loding";
import { Suspense } from "react";
import AdminShell from "./_components/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loding />
        </div>
      }
    >
      <AuthenticatedAdminLayout>{children}</AuthenticatedAdminLayout>
    </Suspense>
  );
}

async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageAuth();

  return (
    <SidebarProvider>
      <AdminShell role={user.role}>
        <div className="rounded-2xl lg:border border-0 lg:border-gray-200 p-0 lg:p-6">
          {children}
        </div>
      </AdminShell>
    </SidebarProvider>
  );
}
