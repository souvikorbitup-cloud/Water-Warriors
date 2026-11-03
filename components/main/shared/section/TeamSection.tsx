"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import gsap from "gsap";

import type { Swiper as SwiperType } from "swiper";
import { A11y, Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { cn } from "@/lib/utils";

import "swiper/css";
import "swiper/css/effect-fade";

export interface TeamSectionMember {
  full_name: string;
  job_role: string;
  tag: string[];
  description: string;
  avatar_url: string;
}

interface TeamSectionProps {
  title: string;
  members: TeamSectionMember[];
  className?: string;
  autoplayDelay?: number;
}

type Direction = "next" | "prev";

const FLIGHT_DURATION = 0.9;
const FLIGHT_EASE = "power3.inOut";
const OVERLAY_RADIUS = 16;
/** How long a button-click direction hint stays valid (ms). */
const DIRECTION_HINT_TTL = 1500;

/** Text blocks: fade + rise in when their slide becomes active. */
const reveal =
  "translate-y-5 opacity-0 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none motion-reduce:translate-y-0 group-[.swiper-slide-active]/slide:translate-y-0 group-[.swiper-slide-active]/slide:opacity-100";

/** Image frame: fade only (no movement) so it never fights the flying overlay. */
const revealFade =
  "opacity-0 transition-opacity duration-700 ease-out motion-reduce:transition-none group-[.swiper-slide-active]/slide:opacity-100";

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

const isInViewport = (rect: DOMRect) =>
  rect.bottom > 0 &&
  rect.top < window.innerHeight &&
  rect.right > 0 &&
  rect.left < window.innerWidth;

export default function TeamSection({
  title,
  members,
  className,
  autoplayDelay = 6000,
}: TeamSectionProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const previewImageRef = useRef<HTMLDivElement>(null);

  const animationRef = useRef<gsap.core.Tween | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  // Real element hidden while the overlay flies (big image or preview frame).
  const hiddenElRef = useRef<HTMLElement | null>(null);

  // Source of truth for the previous slide (avoids stale closures in Swiper callbacks).
  const activeIndexRef = useRef(0);
  // Direction hint from button clicks (disambiguates 2-member sliders).
  const directionHintRef = useRef<{ dir: Direction; at: number } | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  /**
   * Kill any running transition and restore the real elements.
   */
  const cleanupAnimation = () => {
    animationRef.current?.kill();
    animationRef.current = null;

    overlayRef.current?.remove();
    overlayRef.current = null;

    if (hiddenElRef.current) {
      gsap.set(hiddenElRef.current, { clearProps: "opacity" });
      hiddenElRef.current = null;
    }
  };

  /**
   * Fly a copy of an image from `sourceRect` to a destination that is
   * re-measured on every frame (so it stays accurate during scroll, resize,
   * autoHeight changes and slide fades).
   */
  const flyImage = ({
    sourceRect,
    getTargetRect,
    imageUrl,
    hiddenEl,
  }: {
    sourceRect: DOMRect;
    getTargetRect: () => DOMRect | null;
    imageUrl: string;
    hiddenEl: HTMLElement;
  }) => {
    cleanupAnimation();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const initialTarget = getTargetRect();
    if (!initialTarget) return;

    // Nothing visible to animate (e.g. autoplay while scrolled away).
    if (!isInViewport(sourceRect) && !isInViewport(initialTarget)) return;

    // Hide the real element so it doesn't show through / duplicate the overlay.
    hiddenElRef.current = hiddenEl;
    gsap.set(hiddenEl, { opacity: 0 });

    const overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: 50;
      overflow: hidden;
      border-radius: ${OVERLAY_RADIUS}px;
      pointer-events: none;
      will-change: transform, width, height;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
      backface-visibility: hidden;
    `;

    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = "";
    image.decoding = "async";
    image.draggable = false;
    image.style.cssText = `
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    `;

    overlay.appendChild(image);
    document.body.appendChild(overlay);
    overlayRef.current = overlay;

    gsap.set(overlay, {
      x: sourceRect.left,
      y: sourceRect.top,
      width: sourceRect.width,
      height: sourceRect.height,
    });

    const progress = { value: 0 };
    let lastTarget = initialTarget;

    animationRef.current = gsap.to(progress, {
      value: 1,
      duration: FLIGHT_DURATION,
      ease: FLIGHT_EASE,

      onUpdate: () => {
        lastTarget = getTargetRect() ?? lastTarget;
        const t = progress.value;

        gsap.set(overlay, {
          x: lerp(sourceRect.left, lastTarget.left, t),
          y: lerp(sourceRect.top, lastTarget.top, t),
          width: lerp(sourceRect.width, lastTarget.width, t),
          height: lerp(sourceRect.height, lastTarget.height, t),
        });
      },

      onComplete: () => {
        // The final frame matches the target, so the swap is seamless.
        if (hiddenElRef.current === hiddenEl) {
          gsap.set(hiddenEl, { clearProps: "opacity" });
          hiddenElRef.current = null;
        }

        overlay.remove();
        if (overlayRef.current === overlay) overlayRef.current = null;
        animationRef.current = null;
      },
    });
  };

  /**
   * FORWARD: the small "next" preview grows into the active slide's image.
   */
  const animateForward = (
    swiper: SwiperType,
    sourceRect: DOMRect,
    imageUrl: string,
  ) => {
    const activeSlide = swiper.slides[swiper.activeIndex] as
      | HTMLElement
      | undefined;
    const activeFrame = activeSlide?.querySelector<HTMLElement>(
      "[data-team-active-image]",
    );
    const targetImage = activeFrame?.querySelector<HTMLImageElement>("img");

    if (!activeFrame || !targetImage) return;

    flyImage({
      sourceRect,
      imageUrl,
      hiddenEl: targetImage,
      getTargetRect: () => activeFrame.getBoundingClientRect(),
    });
  };

  /**
   * REVERSE: the outgoing slide's big image shrinks back into the preview
   * (which now represents the member we just left).
   */
  const animateReverse = (swiper: SwiperType, imageUrl: string) => {
    const previewFrame = previewImageRef.current;
    if (!previewFrame) return;

    const outgoingSlide = swiper.slides[swiper.previousIndex] as
      | HTMLElement
      | undefined;
    const outgoingFrame = outgoingSlide?.querySelector<HTMLElement>(
      "[data-team-active-image]",
    );
    if (!outgoingFrame) return;

    // Measure now: this is where the big image currently sits.
    const sourceRect = outgoingFrame.getBoundingClientRect();

    flyImage({
      sourceRect,
      imageUrl,
      // Hide the whole preview frame; it re-renders with the outgoing member.
      hiddenEl: previewFrame,
      getTargetRect: () => previewFrame.getBoundingClientRect(),
    });

    // Hide the outgoing big image too, so it doesn't fade out underneath.
    const outgoingImage = outgoingFrame.querySelector<HTMLImageElement>("img");
    if (outgoingImage && overlayRef.current) {
      gsap.set(outgoingImage, { opacity: 0 });
      gsap.delayedCall(FLIGHT_DURATION + 0.05, () => {
        gsap.set(outgoingImage, { clearProps: "opacity" });
      });
    }
  };

  const consumeDirectionHint = (): Direction | null => {
    const hint = directionHintRef.current;
    directionHintRef.current = null;

    if (!hint || Date.now() - hint.at > DIRECTION_HINT_TTL) return null;
    return hint.dir;
  };

  const goTo = (dir: Direction) => {
    directionHintRef.current = { dir, at: Date.now() };

    if (dir === "next") swiperRef.current?.slideNext();
    else swiperRef.current?.slidePrev();
  };

  const handleSlideChange = (swiper: SwiperType) => {
    const length = members.length;
    const previousIndex = activeIndexRef.current;
    const nextRealIndex = swiper.realIndex;

    if (length > 1 && nextRealIndex !== previousIndex) {
      const forwardIndex = (previousIndex + 1) % length;
      const backwardIndex = (previousIndex - 1 + length) % length;

      // Button hint wins; otherwise infer from indices (autoplay, swipes).
      const direction: Direction | null =
        consumeDirectionHint() ??
        (nextRealIndex === forwardIndex
          ? "next"
          : nextRealIndex === backwardIndex
            ? "prev"
            : null);

      if (direction === "next" && previewImageRef.current) {
        // Measure before React re-renders the preview with the following member.
        const sourceRect = previewImageRef.current.getBoundingClientRect();
        animateForward(swiper, sourceRect, members[nextRealIndex].avatar_url);
      } else if (direction === "prev") {
        // The outgoing member's image flies into the preview.
        animateReverse(swiper, members[previousIndex].avatar_url);
      } else {
        cleanupAnimation();
      }
    } else {
      cleanupAnimation();
    }

    activeIndexRef.current = nextRealIndex;
    setActiveIndex(nextRealIndex);
  };

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      cleanupAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the active index valid if the members list shrinks.
  useEffect(() => {
    if (activeIndexRef.current >= members.length) {
      activeIndexRef.current = 0;
      setActiveIndex(0);
    }
  }, [members.length]);

  if (!members.length) return null;

  const nextMember = members[(activeIndex + 1) % members.length];

  return (
    <section className={cn("container-y-pad overflow-hidden", className)}>
      <div className="my-container-x">
        {/* Section Heading */}
        <h2 className="text-center text-3xl leading-tight font-semibold text-balance sm:text-4xl lg:text-5xl">
          {title}
        </h2>

        <div className="mt-8 flex flex-col gap-6 sm:mt-12 lg:flex-row lg:items-end lg:gap-6">
          {/* ==================================
              NEXT MEMBER PREVIEW
          =================================== */}

          {members.length > 1 && (
            <button
              type="button"
              onClick={() => goTo("next")}
              aria-label={`Show next: ${nextMember.full_name}`}
              className="group flex w-full items-center overflow-hidden rounded-2xl bg-foreground/25 text-left transition-colors duration-300 hover:bg-foreground/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:order-1 lg:block lg:w-60 lg:shrink-0"
            >
              {/* Preview Image */}
              <div
                ref={previewImageRef}
                className="relative size-20 shrink-0 overflow-hidden sm:size-24 lg:aspect-square lg:size-auto lg:w-full"
              >
                <Image
                  key={nextMember.full_name}
                  src={nextMember.avatar_url}
                  alt=""
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 240px, 96px"
                  className="animate-in fade-in object-cover duration-500 transition-transform ease-out group-hover:scale-110"
                />
              </div>

              {/* Preview Details */}
              <div className="min-w-0 flex-1 px-4 py-3 lg:px-6 lg:py-4.5">
                <p
                  key={nextMember.full_name}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-500 font-heading text-base leading-snug font-semibold text-heading sm:text-lg"
                >
                  {nextMember.full_name}
                </p>

                <p className="mt-0.5 text-sm text-paragraph">
                  {nextMember.job_role}
                </p>
              </div>
            </button>
          )}

          {/* ==================================
              ACTIVE MEMBER SLIDER
          =================================== */}

          <Swiper
            modules={[EffectFade, Autoplay, A11y]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            speed={850}
            loop={members.length > 1}
            slidesPerView={1}
            autoHeight
            autoplay={
              autoplayDelay > 0 && members.length > 1
                ? {
                    delay: autoplayDelay,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
                : false
            }
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              activeIndexRef.current = swiper.realIndex;
              setActiveIndex(swiper.realIndex);
            }}
            onSlideChange={handleSlideChange}
            className="w-full min-w-0 lg:order-2 lg:flex-1"
          >
            {members.map((member, index) => (
              <SwiperSlide
                key={`${member.full_name}-${index}`}
                className="group/slide"
              >
                <div className="grid items-start gap-6 md:grid-cols-[220px_1fr] md:gap-8 lg:grid-cols-[319px_1fr]">
                  {/* Member Image */}
                  <div
                    data-team-active-image
                    className={cn(
                      "relative mx-auto aspect-[0.59] w-full max-w-64 overflow-hidden rounded-2xl sm:max-w-72 md:mx-0 md:max-w-none",
                      revealFade,
                    )}
                  >
                    <Image
                      src={member.avatar_url}
                      alt={member.full_name}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 319px, (min-width: 768px) 220px, 288px"
                      className="object-cover"
                    />
                  </div>

                  {/* Member Details */}
                  <div className="flex min-w-0 flex-col md:min-h-full md:justify-center">
                    <h3
                      className={cn(
                        "font-heading text-xl font-semibold wrap-break-word text-heading sm:text-2xl",
                        reveal,
                      )}
                    >
                      {member.full_name}
                    </h3>

                    <p
                      className={cn(
                        "mt-1 text-sm sm:text-[15px] group-[.swiper-slide-active]/slide:delay-100",
                        reveal,
                      )}
                    >
                      {member.job_role}
                    </p>

                    <ul
                      className={cn(
                        "mt-3.5 flex flex-wrap gap-2 group-[.swiper-slide-active]/slide:delay-200",
                        reveal,
                      )}
                    >
                      {member.tag.filter(Boolean).map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-heading/80 px-3 py-1 text-sm text-paragraph sm:px-4 sm:py-1.5 sm:text-[15px]"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>

                    <p
                      className={cn(
                        "mt-5 text-sm leading-6.5 sm:mt-6 sm:text-[15px] group-[.swiper-slide-active]/slide:delay-300",
                        reveal,
                      )}
                    >
                      {member.description}
                    </p>

                    {members.length > 1 && (
                      <div
                        className={cn(
                          "mt-6 flex items-center gap-3.5 sm:mt-8 group-[.swiper-slide-active]/slide:delay-500",
                          reveal,
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => goTo("prev")}
                          aria-label="Previous team member"
                          title="Previous"
                          className="group/arrow flex size-9 items-center justify-center rounded-full border border-heading text-heading transition-all duration-300 hover:scale-105 hover:bg-heading hover:text-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer"
                        >
                          <ArrowLeft className="size-4 transition-transform duration-300 group-hover/arrow:-translate-x-0.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => goTo("next")}
                          aria-label="Next team member"
                          title="Next"
                          className="group/arrow flex size-9 items-center justify-center rounded-full border border-heading text-heading transition-all duration-300 hover:scale-105 hover:bg-heading hover:text-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer"
                        >
                          <ArrowRight className="size-4 transition-transform duration-300 group-hover/arrow:translate-x-0.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
