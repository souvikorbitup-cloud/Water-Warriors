import { getTranslations } from "next-intl/server";
import Image from "next/image";
import type { ReactNode } from "react";

import { Cloud, House } from "@/components/icons";

interface ReportOverviewSectionProps {
  /** Shown in the greeting: "Hey, {name}!" */
  name?: string;
  catchmentArea?: string;
  annualRainfall?: string;
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 shadow-lg shadow-foreground/10 sm:gap-5.5 sm:rounded-3xl sm:px-6 sm:py-5.5">
      <span
        aria-hidden
        className="flex size-16 shrink-0 items-center justify-center rounded-full bg-background shadow-md shadow-foreground/10 sm:size-21 [&_svg]:size-8 sm:[&_svg]:size-10"
      >
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-xs sm:text-sm">{label}</p>
        <p className="mt-1 font-heading text-xl font-semibold text-heading sm:text-2xl lg:text-3xl">
          {value}
        </p>
      </div>
    </div>
  );
}

export default async function ReportOverviewSection({
  name = "Water Warrior",
  catchmentArea = "760 sq. metres",
  annualRainfall = "995.74 mm per year",
}: ReportOverviewSectionProps) {
  const t = await getTranslations("Report");
  const tCommon = await getTranslations("Common");

  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        <div className="mx-auto flex flex-col items-center text-center">
          <h1 className="text-4xl leading-tight font-normal text-heading sm:text-5xl lg:text-6xl xl:text-[64px]">
            {t.rich("greeting", {
              name: () => <span className="font-semibold">{name}!</span>,
            })}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-heading sm:mt-4 sm:text-base">
            {t("thankYou")}
          </p>
        </div>

        {/* Selected area map */}
        <div className="relative mt-8 h-52 overflow-hidden rounded-2xl border border-border sm:mt-10 sm:h-72 sm:rounded-4xl lg:mt-12 lg:h-90">
          <Image
            src="/map.png"
            alt={tCommon("mapSelectedAreaAlt")}
            fill
            sizes="(min-width: 1200px) 1200px, 100vw"
            className="object-cover"
          />
        </div>

        {/* Key figures */}
        <div className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-2 lg:gap-8">
          <StatCard
            icon={<House />}
            label={t("catchmentLabel")}
            value={catchmentArea}
          />
          <StatCard
            icon={<Cloud />}
            label={t("rainfallLabel")}
            value={annualRainfall}
          />
        </div>
      </div>
    </section>
  );
}
