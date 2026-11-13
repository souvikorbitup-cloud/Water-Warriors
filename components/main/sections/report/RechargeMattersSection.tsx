"use client";

import { useTranslations } from "next-intl";

interface RechargeMattersSectionProps {
  litres?: string;
  location?: string;
  analysis?: string[];
}

export default function RechargeMattersSection({
  litres,
  location,
  analysis,
}: RechargeMattersSectionProps) {
  const t = useTranslations("Report");

  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        <h2 className="text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
          {t("rechargeTitle")}
        </h2>

        {litres && location && (
          <p className="mt-4 max-w-285 text-base leading-normal sm:mt-5 lg:text-lg">
            {t("rechargeIntro", { litres, location })}
          </p>
        )}

        <div className="mt-6 max-w-285 space-y-4 sm:mt-8 sm:space-y-6">
          {analysis?.length ? (
            analysis.map((paragraph, index) => (
              <p
                key={`${index}-${paragraph.slice(0, 24)}`}
                className="border-l-4 border-primary pl-4 text-base leading-normal sm:pl-5 lg:text-lg"
              >
                {paragraph}
              </p>
            ))
          ) : (
            <p className="rounded-2xl border border-border p-5 text-sm">
              {t("analysisPending")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
