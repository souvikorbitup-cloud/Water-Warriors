import {
  HowItWorksSection,
  OurMissionSection,
  ResourceSection,
} from "@/components/main/sections/about-us";
import MainbannerSection from "@/components/main/shared/banner/MainbannerSection";
import CTASection from "@/components/main/shared/CTA/CTASection";

export default function AboutUs() {
  return (
    <>
      <MainbannerSection
        heading={
          <>
            Every Rooftop <br />
            <span className="text-primary">Holds a Possibility.</span>
          </>
        }
        description="We help homeowners, offices and buildings discover their rainwater-harvesting potential, one property at a time."
        classes="max-w-80 sm:max-w-140"
        breadcrumbs={[
          {
            label: "Home",
            href: "/",
          },
          {
            label: "About Us",
          },
        ]}
      />
      <OurMissionSection />
      <ResourceSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}
