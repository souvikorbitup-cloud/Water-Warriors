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
      <HeaderBar />
      <MainNavbar type="dark" />
      {children}
      <MainFooter />
    </>
  );
}
