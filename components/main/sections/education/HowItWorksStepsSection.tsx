import type { ComponentType } from "react";
import { getTranslations } from "next-intl/server";

import { Chanel, Clean, Rainfall, Storage } from "@/components/icons";

const steps: { Icon: ComponentType; index: 0 | 1 | 2 | 3 }[] = [
  { Icon: Rainfall, index: 0 },
  { Icon: Chanel, index: 1 },
  { Icon: Clean, index: 2 },
  { Icon: Storage, index: 3 },
];

export default async function HowItWorksStepsSection() {
  const t = await getTranslations("Education");
  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl pt-8 sm:pt-0">
          {t("howItWorks")}
        </h2>

        <ol className="mt-8 grid gap-8 sm:mt-10 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
          {steps.map(({ Icon, index }) => (
            <li key={index}>
              {/* Illustration card */}
              <div className="relative aspect-[1.55] overflow-hidden rounded-2xl bg-secondary/35 sm:rounded-3xl">
                <span className="absolute top-3 left-3 z-10 rounded-full bg-primary px-3 py-1 text-xs leading-snug font-medium text-primary-foreground sm:top-3.5 sm:left-3.5 sm:text-sm">
                  {t("step", { number: index + 1 })}
                </span>

                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center p-4 [&_svg]:size-full [&_svg]:object-contain"
                >
                  <Icon />
                </div>
              </div>

              <h3 className="mt-4 text-xl font-semibold text-heading sm:mt-6 sm:text-2xl">
                {t(`steps.${index}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-6 sm:mt-3 sm:text-base sm:leading-6.5">
                {t(`steps.${index}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
