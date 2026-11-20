"use client";

import { useTranslations } from "next-intl";
import { splitReportText } from "@/lib/report/highlight-text";

interface RechargeMattersSectionProps {
  litres?: string;
  location?: string;
  area?: string;
  analysis?: string[];
}

export default function RechargeMattersSection({
  litres,
  location,
  area,
  analysis,
}: RechargeMattersSectionProps) {
  const t = useTranslations("Report");
  const importantTerms = [area, ...(location?.split(",") ?? [])].filter(
    (term): term is string => Boolean(term),
  );
  const renderHighlightedText = (text: string, useLegacyFallback = false) =>
    splitReportText(text, useLegacyFallback ? importantTerms : []).map(
      (segment, index) =>
        segment.emphasize ? (
          <strong key={index} className="font-semibold text-heading">
            {segment.text}
          </strong>
        ) : (
          segment.text
        ),
    );

  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        <h2 className="text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
          {t("rechargeTitle")}
        </h2>

        {litres && location && (
          <p className="mt-4 max-w-285 text-base leading-normal sm:mt-5 lg:text-lg">
            {renderHighlightedText(
              t("rechargeIntro", { litres, location }),
              true,
            )}
          </p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-6 lg:gap-10 lg:grid-cols-2">
          {analysis?.length ? (
            analysis.map((paragraph, index) => (
              <p
                key={`${index}-${paragraph.slice(0, 24)}`}
                className="border-l-4 border-primary pl-4 text-base leading-relaxed sm:pl-5 lg:text-lg"
              >
                {renderHighlightedText(paragraph, true)}
              </p>
            ))
          ) : (
            <p className="rounded-2xl border border-border p-5 text-sm lg:col-span-2">
              {t("analysisPending")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
