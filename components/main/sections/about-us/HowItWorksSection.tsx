import { getTranslations } from "next-intl/server";
import Image from "next/image";
import {
  Check,
  FileChartColumn,
  MapPin,
  PenTool,
  type LucideIcon,
} from "lucide-react";

const steps: { Icon: LucideIcon; index: 0 | 1 | 2 }[] = [
  { Icon: MapPin, index: 0 },
  { Icon: PenTool, index: 1 },
  { Icon: FileChartColumn, index: 2 },
];
const principleIndices = [0, 1, 2] as const;

export default async function HowItWorksSection() {
  const t = await getTranslations("About");
  const tCommon = await getTranslations("Common");

  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        {/* Part 1: steps */}
        <header className="max-w-205">
          <h2 className="text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
            {t("howTitle")}
          </h2>
          <p className="mt-4 text-base leading-relaxed sm:mt-5 lg:text-lg">
            {t("howDescription")}
          </p>
        </header>

        <ol className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {steps.map(({ Icon, index }) => (
            <li
              key={index}
              className="rounded-2xl bg-secondary/35 p-5 sm:rounded-3xl sm:nth-3:col-span-2 lg:nth-3:col-span-1"
            >
              <div className="flex items-start justify-between">
                <span className="flex size-10.5 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-11.5">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span
                  aria-hidden
                  className="font-heading text-4xl leading-none font-medium text-primary sm:text-[42px]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-semibold text-heading sm:mt-6 lg:text-[26px]">
                {t(`steps.${index}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-6.5 sm:mt-4 sm:text-[15px]">
                {t(`steps.${index}.description`)}
              </p>
            </li>
          ))}
        </ol>

        <hr className="my-10 border-border lg:my-16" />

        {/* Part 2: principles */}
        <div className="grid items-start gap-8 md:grid-cols-2 lg:grid-cols-[1fr_1.6fr_1.3fr] lg:gap-10">
          <div className="md:col-span-2 lg:col-span-1">
            <h2 className="text-3xl leading-[1.2] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
              {t("designTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed sm:mt-5 lg:text-lg">
              {t("designDescription")}
            </p>
          </div>

          <div className="relative aspect-3/2 w-full overflow-hidden rounded-2xl sm:rounded-3xl">
            <Image
              src="/section-images/rain-collect.png"
              alt={tCommon("rainCollectAlt")}
              fill
              sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <ul className="flex flex-col gap-5 lg:gap-6">
            {principleIndices.map((index) => (
              <li key={index} className="flex gap-3.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-heading">
                  <Check className="size-3.5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-xl leading-7 font-semibold text-heading lg:text-[22px]">
                    {t(`principles.${index}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-6.5 sm:text-[15px]">
                    {t(`principles.${index}.description`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
