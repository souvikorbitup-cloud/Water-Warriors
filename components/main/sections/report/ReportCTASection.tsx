import { getTranslations } from "next-intl/server";
import PrimaryButton from "../../shared/button/PrimaryButton";

export default async function ReportCTASection() {
  const t = await getTranslations("Report");

  return (
    <section className="overflow-hidden bg-secondary/40 container-y-pad">
      <div className="my-container-x">
        <div className="flex flex-col items-center justify-center gap-5 text-center sm:gap-6 md:flex-row md:gap-10 lg:gap-14">
          <h2 className="text-3xl leading-[1.1] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
            {t("anotherReport")}
          </h2>

          <PrimaryButton
            href="/#save-water"
            localized
            btnType="solid-primary"
            className="shrink-0"
          >
            {t("measureAnother")}
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
