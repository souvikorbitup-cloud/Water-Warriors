import PrimaryButton from "../../shared/button/PrimaryButton";

export default function ReportCTASection() {
  return (
    <section className="overflow-hidden bg-secondary/40 container-y-pad">
      <div className="my-container-x">
        <div className="flex flex-col items-center justify-center gap-5 text-center sm:gap-6 md:flex-row md:gap-10 lg:gap-14">
          <h2 className="text-3xl leading-[1.1] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
            Ready For Another Report?
          </h2>

          <PrimaryButton
            href="/#save-water"
            btnType="solid-primary"
            className="shrink-0"
          >
            Measure Another Rooftop
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
