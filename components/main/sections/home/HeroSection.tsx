import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import { Fragment } from "react";
import {
  isExternalUrl,
  resolveHeroSlideText,
  splitHeroTitle,
  type HeroSlideView,
} from "@/lib/appearance/hero-slides";
import HeroSlider, { type HeroSliderItem } from "./HeroSlider";

const headingClass =
  "text-4xl leading-tight font-semibold text-background sm:text-5xl lg:text-6xl xl:text-[64px]";
const descriptionClass =
  "mt-4 max-w-175 text-sm leading-6 text-background sm:mt-6 sm:text-base";
const buttonClass =
  "mt-8 min-h-11 max-w-full items-stretch text-left whitespace-normal sm:mt-12 sm:items-center sm:text-center sm:whitespace-nowrap";

export default async function HeroSection({
  slides = [],
  videoUrl,
  fallbackImageUrl,
}: {
  slides?: HeroSlideView[];
  /** Used for the default slide when no active slides exist. */
  videoUrl: string;
  fallbackImageUrl: string;
}) {
  const t = await getTranslations("Home");
  const tCommon = await getTranslations("Common");
  const locale = await getLocale();

  let items: HeroSliderItem[];

  if (slides.length > 0) {
    items = slides.map((slide, index) => {
      const text = resolveHeroSlideText(slide, locale);
      const Heading = index === 0 ? "h1" : "h2";
      const showButton = Boolean(text.buttonLabel && slide.buttonUrl);

      return {
        id: slide.id,
        mediaType: slide.mediaType,
        mediaUrl: slide.mediaUrl,
        posterUrl: slide.posterUrl,
        content: (
          <>
            <Heading className={headingClass}>
              {splitHeroTitle(text.title).map((part, i) =>
                part.highlight ? (
                  <span key={i} className="text-primary">
                    {part.text}
                  </span>
                ) : (
                  <Fragment key={i}>{part.text}</Fragment>
                ),
              )}
            </Heading>
            {text.description && (
              <p className={descriptionClass}>{text.description}</p>
            )}
            {showButton && (
              <PrimaryButton
                btnType="solid-primary"
                className={buttonClass}
                href={slide.buttonUrl}
                localized={!isExternalUrl(slide.buttonUrl)}
              >
                {text.buttonLabel}
              </PrimaryButton>
            )}
          </>
        ),
      };
    });
  } else {
    // Default hero: identical to the previous single-video hero.
    items = [
      {
        id: "default",
        mediaType: "video",
        mediaUrl: videoUrl,
        posterUrl: fallbackImageUrl,
        content: (
          <>
            <h1 className={headingClass}>
              {t.rich("heroTitle", {
                highlight: (chunks) => (
                  <span className="text-primary">{chunks}</span>
                ),
              })}
            </h1>
            <p className={descriptionClass}>{t("heroDescription")}</p>
            <PrimaryButton
              btnType="solid-primary"
              className={buttonClass}
              href="/#save-water"
              localized
            >
              {t("heroCta")}
            </PrimaryButton>
          </>
        ),
      },
    ];
  }

  return (
    <section className="relative -mt-30">
      <HeroSlider items={items} />

      <div className="absolute bottom-0 translate-y-full left-0 z-10 w-full">
        <div className="my-container-x flex justify-center sm:justify-end">
          <Image
            src="/images/patent-badge.png"
            alt={tCommon("patentBadgeAlt")}
            aria-hidden
            width={200}
            height={200}
            quality={100}
            priority={false}
            className="pointer-events-none z-10 h-auto w-40 select-none md:w-45 lg:w-50 -translate-y-1/2"
          />
        </div>
      </div>
    </section>
  );
}
