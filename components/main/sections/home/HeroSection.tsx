import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import Image from "next/image";

export default function HeroSection({
  videoUrl,
  fallbackImageUrl,
}: {
  videoUrl: string;
  fallbackImageUrl: string;
}) {
  return (
    <section className="relative -mt-30">
      <div className="isolate flex min-h-150 sm:min-h-[80vh] items-center justify-center overflow-hidden">
        {/* Background video (poster doubles as the fallback image) */}
        <video
          aria-hidden
          className="absolute inset-0 -z-20 size-full object-cover object-top"
          src={videoUrl}
          poster={fallbackImageUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />

        {/* Overlay */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-black/48" />

        {/* Content */}
        <div className="my-container-x w-full pt-24 pb-12.5 sm:pt-28 sm:pb-20">
          <div className="mx-auto flex flex-col items-center text-center">
            <h1 className="text-4xl leading-tight font-semibold text-background sm:text-5xl lg:text-6xl xl:text-[64px]">
              Hey, <span className="text-primary">Water Warrior!</span>
            </h1>

            <p className="mt-4 max-w-175 text-sm leading-6 text-background sm:mt-6 sm:text-base">
              Millions of liters of rainwater go to waste every year. Discover
              your property&rsquo;s rainwater harvesting potential and get a
              customized report at a nominal cost.
            </p>

            {/* On small screens the label may wrap onto two lines instead of overflowing */}
            <PrimaryButton
              btnType="solid-primary"
              className="mt-8 min-h-11 max-w-full items-stretch text-left whitespace-normal sm:mt-12 sm:items-center sm:text-center sm:whitespace-nowrap"
            >
              Discover how much water you could save
            </PrimaryButton>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full z-10">
        <div className="my-container-x flex justify-center sm:justify-end translate-y-1/2">
          <Image
            src="/images/patent-badge.png"
            alt="patent-badge"
            aria-hidden
            width={200}
            height={200}
            quality={100}
            priority={false}
            className="pointer-events-none z-10 select-none h-auto w-40 md:w-45 lg:w-50"
          />
        </div>
      </div>
    </section>
  );
}
