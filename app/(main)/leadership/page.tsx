import MainbannerSection from "@/components/main/shared/banner/MainbannerSection";
import CTASection from "@/components/main/shared/CTA/CTASection";
import TeamSection from "@/components/main/shared/section/TeamSection";
import { leadership, technicalAdvisors } from "@/lib/data/all_data";

export default function Leadership() {
  return (
    <>
      <MainbannerSection
        heading={
          <>
            Every rooftop
            <br />
            <span className="text-primary">holds a possibility.</span>
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
            label: "Leadership",
          },
        ]}
      />
      <TeamSection
        title="Leadership Team"
        members={leadership}
        className="mt-8 sm:mt-0"
      />
      <TeamSection
        title="Technical Advisors Team"
        members={technicalAdvisors}
        className="bg-[linear-gradient(180deg,var(--secondary)_0%,rgba(255,255,255,0)_30%,#FFF_100%)]"
      />
      <CTASection />
    </>
  );
}
