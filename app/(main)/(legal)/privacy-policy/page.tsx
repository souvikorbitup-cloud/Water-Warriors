import { PrivacyPolicyContentSection } from "@/components/main/sections/legal";
import MainbannerSection from "@/components/main/shared/banner/MainbannerSection";
import CTASection from "@/components/main/shared/CTA/CTASection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Water Warriors AI",
  description:
    "Learn how Water Warriors AI collects, uses, stores and protects your personal information when you shop with us.",
};

export default async function PrivacyPolicy() {
  return (
    <>
      <MainbannerSection
        heading={
          <>
            Privacy <span className="text-primary">Policy</span>
          </>
        }
        description="This policy explains what information Water Warriors AI LLP
              (“Water Warriors”, “we”) handles when you use this website, why,
              who else receives it, and the choices you have."
        classes="max-w-90 sm:max-w-150"
        breadcrumbs={[
          {
            label: "Home",
            href: "/",
          },
          {
            label: "Privacy Policy",
          },
        ]}
      />
      <PrivacyPolicyContentSection />
      <CTASection />
    </>
  );
}
