import { Suspense, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import AppearanceProvider from "@/components/admin/sections/appearance/AppearanceProvider";
import Loding from "@/components/main/shared/loading/Loding";

export default function AppProviders({
  children,
  loadingLabel,
}: {
  children: ReactNode;
  loadingLabel?: string;
}) {
  return (
    <AppearanceProvider>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <Loding label={loadingLabel} />
          </div>
        }
      >
        {children}
        <Toaster position="top-right" richColors closeButton />
      </Suspense>
    </AppearanceProvider>
  );
}
