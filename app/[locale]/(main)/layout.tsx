import { Suspense } from "react";

import HeaderBar from "@/components/main/common/HeaderBar";
import MainFooter from "@/components/main/common/MainFooter";
import MainNavbar from "@/components/main/common/MainNavbar";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Suspense fallback={<div className="h-10 w-full" aria-hidden="true" />}>
        <HeaderBar />
      </Suspense>

      <MainNavbar />

      {children}

      <MainFooter />
    </>
  );
}
