import Image from "next/image";

import PrimaryButton from "@/components/main/shared/button/PrimaryButton";

export default function CTASection() {
  return (
    <section className="container-y-pad relative isolate overflow-hidden bg-secondary/35">
      {/* Decorative line pattern between the background color and the content */}
      <Image
        src="/images/bg-lines.png"
        alt="bg-image"
        aria-hidden
        fill
        sizes="100vw"
        className="pointer-events-none -z-10 object-cover object-center select-none"
      />

      <div className="my-container-x">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
            Your Rooftop. A New Possibility.
          </h2>

          <p className="mt-4 max-w-150 text-sm leading-6 sm:mt-6 sm:text-base">
            Start with your location and rooftop area. Discover your
            property&rsquo;s rainwater-harvesting potential with a customized
            report at a nominal cost.
          </p>

          {/* On small screens the label may wrap onto two lines instead of overflowing */}
          <PrimaryButton
            btnType="solid-primary"
            className="mt-8 min-h-11 max-w-full items-stretch text-left whitespace-normal sm:mt-10 sm:items-center sm:text-center sm:whitespace-nowrap"
            href="/#save-water"
          >
            Discover how much water you could save
          </PrimaryButton>

          <p className="mt-5 text-xs text-paragraph sm:mt-7 sm:text-[13px]">
            All measurements are approximate and intended for reference only.
          </p>
        </div>
      </div>
    </section>
  );
}
