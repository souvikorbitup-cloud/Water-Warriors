import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Target } from "lucide-react";

export default async function OurMissionSection() {
  const t = await getTranslations("About");
  const tCommon = await getTranslations("Common");
  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        {/* Intro + image */}
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-9">
          <div className="pt-8 sm:pt-0">
            <h2 className="text-3xl leading-[1.15] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
              {t("missionTitle")}
            </h2>

            <div className="mt-5 space-y-5 text-base leading-normal text-paragraph sm:mt-6 lg:mt-9 lg:space-y-8 lg:text-lg">
              <p>{t("missionP1")}</p>
              <p>{t("missionP2")}</p>
            </div>

            <blockquote className="mt-7 border-l-4 border-primary pl-4 sm:pl-5">
              <p className="font-heading text-xl leading-snug font-medium text-heading lg:text-2xl">
                {t("missionQuote")}
              </p>
            </blockquote>
          </div>

          <figure>
            <div className="relative aspect-10/7 w-full overflow-hidden rounded-2xl sm:rounded-3xl">
              <Image
                src="/section-images/rain-collect.png"
                alt={tCommon("rainCollectAlt")}
                fill
                sizes="(min-width: 1280px) 590px, (min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-4 text-sm text-paragraph lg:mt-5">
              {t("missionCaption")}
            </figcaption>
          </figure>
        </div>

        {/* Mission card */}
        <div className="mt-10 rounded-2xl border border-border bg-primary p-5 text-primary-foreground sm:rounded-3xl sm:p-7 lg:mt-12">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-4 lg:gap-x-5 lg:gap-y-3">
            <span className="flex size-10.5 items-center justify-center rounded-full bg-background text-heading">
              <Target className="size-5" />
            </span>

            <h3 className="text-xl font-medium text-heading sm:text-2xl lg:text-[26px]">
              {t("ourMission")}
            </h3>

            <p className="col-span-2 text-base leading-normal text-heading lg:col-span-1 lg:col-start-2 lg:text-lg">
              {t("missionCard")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
