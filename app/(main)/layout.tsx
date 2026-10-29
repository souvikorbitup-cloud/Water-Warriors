import HeaderBar from "@/components/main/common/HeaderBar";
import MainFooter from "@/components/main/common/MainFooter";
import MainNavbar from "@/components/main/common/MainNavbar";
import { Suspense } from "react";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Suspense>
        <HeaderBar />
        <MainNavbar />
        {children}
        <MainFooter />
      </Suspense>
    </>
  );
}
