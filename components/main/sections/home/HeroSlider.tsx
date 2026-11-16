"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { Swiper as SwiperType } from "swiper";
import { A11y, Autoplay, EffectFade, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

export type HeroSliderItem = {
  id: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  posterUrl: string | null;
  content: ReactNode;
};

const themeVars = {
  "--swiper-pagination-color": "var(--primary)",
  "--swiper-pagination-bullet-inactive-color": "#ffffff",
  "--swiper-pagination-bullet-inactive-opacity": "0.6",
} as CSSProperties;

// Only the active slide's video plays.
function syncVideos(swiper: SwiperType) {
  swiper.slides.forEach((slide, i) => {
    const video = slide.querySelector("video");

    if (!video) return;

    if (i === swiper.activeIndex) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}

function handleInit(swiper: SwiperType) {
  syncVideos(swiper);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    swiper.autoplay?.stop();
  }
}

export default function HeroSlider({ items }: { items: HeroSliderItem[] }) {
  const multiple = items.length > 1;

  return (
    <Swiper
      modules={multiple ? [A11y, Autoplay, EffectFade, Pagination] : [A11y]}
      effect={multiple ? "fade" : undefined}
      fadeEffect={{ crossFade: true }}
      rewind={multiple}
      allowTouchMove={multiple}
      autoplay={
        multiple
          ? {
              delay: 7000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }
          : false
      }
      pagination={
        multiple
          ? {
              clickable: true,
              bulletClass: "swiper-pagination-bullet hero-pagination-bullet",
              bulletActiveClass:
                "swiper-pagination-bullet-active hero-pagination-bullet-active",
            }
          : false
      }
      onInit={handleInit}
      onSlideChange={syncVideos}
      style={themeVars}
      className="hero-swiper w-full [&_.swiper-pagination]:bottom-24! sm:[&_.swiper-pagination]:bottom-6!"
    >
      {items.map((item, index) => (
        <SwiperSlide key={item.id}>
          {/* Inner wrapper handles the flex layout */}
          <div className="relative isolate flex min-h-150 items-center justify-center overflow-hidden sm:min-h-[80vh]">
            {item.mediaType === "video" ? (
              <video
                aria-hidden
                className="absolute inset-0 -z-20 size-full object-cover object-top"
                src={item.mediaUrl}
                poster={item.posterUrl ?? undefined}
                autoPlay={index === 0}
                loop
                muted
                playsInline
                preload={index === 0 ? "auto" : "metadata"}
              />
            ) : (
              <Image
                src={item.mediaUrl}
                alt=""
                fill
                sizes="100vw"
                priority={index === 0}
                className="absolute inset-0 -z-20 size-full object-cover object-top"
              />
            )}

            {/* Overlay */}
            <div aria-hidden className="absolute inset-0 -z-10 bg-black/48" />

            {/* Content */}
            <div className="my-container-x w-full pt-24 pb-12.5 sm:pt-28 sm:pb-20">
              <div className="mx-auto flex flex-col items-center text-center">
                {item.content}
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
