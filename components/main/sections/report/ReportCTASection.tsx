import { useTranslations } from "next-intl";
import PrimaryButton from "../../shared/button/PrimaryButton";
import { useRouter } from "@/i18n/navigation";
import { clearLocationSelectionSession } from "@/lib/data/location-selection-session";

export default function ReportCTASection() {
  const t = useTranslations("Report");
  const router = useRouter();

  const measureAnother = () => {
    clearLocationSelectionSession();
    router.push("/#save-water");
  };

  return (
    <section className="overflow-hidden bg-secondary/40 container-y-pad print:hidden">
      <div className="my-container-x">
        <div className="flex flex-col items-center justify-center gap-5 text-center sm:gap-6 md:flex-row md:gap-10 lg:gap-14">
          <h2 className="text-3xl leading-[1.1] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
            {t("anotherReport")}
          </h2>

          <PrimaryButton
            btnType="solid-primary"
            className="shrink-0"
            onClick={measureAnother}
          >
            {t("measureAnother")}
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
