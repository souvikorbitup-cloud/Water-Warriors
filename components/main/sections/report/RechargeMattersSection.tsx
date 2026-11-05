import { getTranslations } from "next-intl/server";

interface RechargeMattersSectionProps {
  litres?: string;
  location?: string;
}

const highlightIndices = [0, 1, 2] as const;

export default async function RechargeMattersSection({
  litres = "634,672",
  location = "Mega Hills, Hyderabad",
}: RechargeMattersSectionProps) {
  const t = await getTranslations("Report");

  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        <h2 className="text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
          {t("rechargeTitle")}
        </h2>

        <p className="mt-4 max-w-285 text-base leading-normal sm:mt-5 lg:text-lg">
          {t("rechargeIntro", { litres, location })}
        </p>

        <div className="mt-6 max-w-285 space-y-4 sm:mt-8 sm:space-y-6">
          {highlightIndices.map((index) => (
            <p
              key={index}
              className="border-l-4 border-primary pl-4 text-base leading-normal sm:pl-5 lg:text-lg"
            >
              {t(`rechargeHighlights.${index}`)}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
