import {
  ForecastProjectionSection,
  RainwaterPotentialSection,
  RechargeMattersSection,
  ReportCTASection,
  ReportOverviewSection,
} from "@/components/main/sections/report";
import Image from "next/image";

export default async function ReportPage() {
  return (
    <>
      <ReportOverviewSection />
      <RainwaterPotentialSection />
      {/* Divider Image */}
      <div className="aspect-15/4 relative w-full">
        <Image
          src="/section-images/report-divider-img.png"
          alt="gradent-bg"
          aria-hidden
          fill
          sizes="150vw"
          className="object-cover"
        />
      </div>
      <RechargeMattersSection />
      <ForecastProjectionSection />
      <ReportCTASection />
    </>
  );
}
