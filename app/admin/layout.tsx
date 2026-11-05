import type { Metadata } from "next";
import { SidebarProvider } from "@/context/SidebarContext";
import { requirePageAuth } from "@/lib/auth/auth-server-utils";
import Loding from "@/components/main/shared/loading/Loding";
import { Suspense } from "react";
import AdminShell from "./_components/AdminShell";
import AppProviders from "@/components/AppProviders";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/i18n/seo";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Water Warriors AI",
  description:
    "Discover your property's rainwater harvesting potential and explore practical ways to conserve water.",
  icons: { icon: "/favicon.ico" },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", "font-sans")}
    >
      <body className="min-h-full bg-white flex flex-col">
        <AppProviders>
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center">
                <Loding />
              </div>
            }
          >
            <AuthenticatedAdminLayout>{children}</AuthenticatedAdminLayout>
          </Suspense>
        </AppProviders>
      </body>
    </html>
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
