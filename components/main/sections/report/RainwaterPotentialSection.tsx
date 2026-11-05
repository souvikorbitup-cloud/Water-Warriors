import type { ComponentType } from "react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

import { Children, Family, Tanker, Tree, WaterDrop } from "@/components/icons";

export interface ImpactStat {
  label: string;
  value: string;
  note: string;
  Icon: ComponentType;
}

interface RainwaterPotentialSectionProps {
  harvestableLitres?: string;
  harvestableInWords?: string;
  calculation?: string;
  source?: string;
  annualSavingLitres?: string;
  impacts?: ImpactStat[];
  assumptions?: string;
}

const impactItems: { Icon: ComponentType; index: 0 | 1 | 2 | 3 }[] = [
  { Icon: Family, index: 0 },
  { Icon: Tree, index: 1 },
  { Icon: Tanker, index: 2 },
  { Icon: Children, index: 3 },
];

export default async function RainwaterPotentialSection({
  harvestableLitres = "5,02,293 Litres",
  harvestableInWords = "(Five lakh two thousand two hundred ninety-three litres)",
  calculation = "(560.49 sq.m x 995.74 mm x 0.9 = 5,02,293 Litres)",
  source = "*Source: Google Gemini",
  annualSavingLitres = "6,34,672",
  impacts,
  assumptions,
}: RainwaterPotentialSectionProps) {
  const t = await getTranslations("Report");
  const tCommon = await getTranslations("Common");
  const tAbout = await getTranslations("About");
  const resolvedImpacts =
    impacts ??
    impactItems.map(({ Icon, index }) => ({
      label: t(`impacts.${index}.label`),
      value: t(`impacts.${index}.value`),
      note: t(`impacts.${index}.note`),
      Icon,
    }));
  const resolvedAssumptions = assumptions ?? t("assumptions");

  return (
    <section className="container-y-pad overflow-hidden bg-[linear-gradient(180deg,var(--secondary)_0%,rgba(255,255,255,0)_30%,#FFF_100%)]">
      <div className="my-container-x">
        {/* Potential + image */}
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl leading-[1.1] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
              {t("potentialTitle")}
            </h2>
            <p className="mt-4 text-base leading-normal sm:mt-5">
              {t("potentialDescription")}
            </p>

            {/* Harvest figure card */}
            <div className="relative mt-6 overflow-hidden rounded-3xl bg-primary sm:mt-7 sm:rounded-4xl">
              <Image
                src="/images/gradent-bg.png"
                alt="gradent-bg"
                aria-hidden
                fill
                sizes="(min-width: 1024px) 590px, 100vw"
                className="object-cover"
              />
              <div className="relative flex items-center gap-4 p-4 sm:gap-5 sm:p-5">
                <span
                  aria-hidden
                  className="flex size-16 shrink-0 items-center justify-center rounded-full bg-background sm:size-21 [&_svg]:size-8 sm:[&_svg]:size-10"
                >
                  <WaterDrop />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-heading sm:text-base">
                    {t("catchmentLabel")}
                  </p>
                  <p className="mt-1 font-heading text-2xl font-semibold text-heading sm:text-3xl lg:text-4xl">
                    {harvestableLitres}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-1 text-sm leading-relaxed sm:mt-6 sm:text-base">
              <p>{harvestableInWords}</p>
              <p>{calculation}</p>
              <p>{source}</p>
            </div>
          </div>

          <figure>
            <div className="relative aspect-[1.435] w-full overflow-hidden rounded-3xl sm:rounded-4xl">
              <Image
                src="/section-images/rain-collect.png"
                alt={tCommon("rainCollectAlt")}
                fill
                sizes="(min-width: 1024px) 590px, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm sm:mt-4">
              {tAbout("missionCaption")}
            </figcaption>
          </figure>
        </div>

        <hr className="my-10 border-border lg:my-16" />

        {/* Impact */}
        <div>
          <h2 className="text-2xl leading-tight font-semibold sm:text-3xl lg:text-4xl">
            {t("impactTitle", { litres: annualSavingLitres })}
          </h2>
          <p className="mt-2 text-sm sm:text-base">{t("impactDescription")}</p>
        </div>

        <ul className="mt-14 grid gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-14 grid-cols-2 lg:grid-cols-4">
          {resolvedImpacts.map(({ label, value, note, Icon }) => (
            <li
              key={label}
              className="relative rounded-3xl bg-secondary/40 px-4 pt-14 pb-5 text-center"
            >
              {/* White circle straddling the top edge of the card */}
              <span
                aria-hidden
                className="absolute -top-10.5 left-1/2 flex size-21 -translate-x-1/2 items-center justify-center rounded-full bg-background [&_svg]:size-10"
              >
                <Icon />
              </span>

              <p className="text-sm sm:text-base font-semibold text-heading">
                {label}
              </p>
              <p className="mt-1 sm:mt-2 font-heading text-2xl font-semibold text-heading sm:text-[32px]">
                {value}
              </p>
              <p className="mt-0.5 ms:mt-1 text-sm sm:text-base text-heading">
                {note}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-8 rounded-2xl border border-border p-5 text-sm leading-6.5 sm:rounded-3xl sm:p-6 sm:text-[15px]">
          {resolvedAssumptions}
        </p>
      </div>
    </section>
  );
}
