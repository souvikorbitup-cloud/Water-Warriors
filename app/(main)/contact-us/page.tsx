import {
  ContactSection,
  FAQSection,
} from "@/components/main/sections/contsct-us";
import MainbannerSection from "@/components/main/shared/banner/MainbannerSection";
import CTASection from "@/components/main/shared/CTA/CTASection";

export default function ContactUs() {
  return (
    <>
      <MainbannerSection
        heading={
          <>
            Let's Talk <br />
            <span className="text-primary">Rainwater</span>
          </>
        }
        description="Have a question about your property's potential or your report? Tell us what's on your mind."
        classes="max-w-80 sm:max-w-140"
        breadcrumbs={[
          {
            label: "Home",
            href: "/",
          },
          {
            label: "Contact Us",
          },
        ]}
      />
      <ContactSection />
      <FAQSection />
      <CTASection classes="bg-white" />
    </>
  );
}
