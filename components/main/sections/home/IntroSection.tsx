"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

import PrimaryButton from "@/components/main/shared/button/PrimaryButton";
import Image from "next/image";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// Each line is a 200%-wide gradient: left half = filled (final) color, right half = unfilled grey.
// Sliding background-position from 100% to 0% "fills" the line from left to right.
const LINE_STYLES = {
  display: "block",
  width: "fit-content",
  marginInline: "auto",
  backgroundImage:
    "linear-gradient(to right, var(--paragraph) 50%, color-mix(in oklab, var(--paragraph) 28%, transparent) 50%)",
  backgroundSize: "200% 100%",
  backgroundRepeat: "no-repeat",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

export default function IntroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = textRef.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      // Skip the effect entirely for users who prefer reduced motion
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        SplitText.create(el, {
          type: "lines",
          linesClass: "reveal-line",
          autoSplit: true, // re-splits on resize / font load so lines stay accurate
          onSplit(self) {
            gsap.set(self.lines, LINE_STYLES);

            return gsap.fromTo(
              self.lines,
              { backgroundPosition: "100% 0" },
              {
                backgroundPosition: "0% 0",
                ease: "none",
                duration: 1,
                stagger: 1, // one line after another
                scrollTrigger: {
                  trigger: el,
                  start: "top 80%",
                  end: "bottom 50%",
                  scrub: true,
                },
              },
            );
          },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="container-y-pad overflow-hidden relative"
    >
      {/* Decorative background shape */}
      <Image
        src="/section-images/w-logo-light.svg"
        alt=""
        aria-hidden
        width={2000}
        height={2000}
        sizes="100vw"
        priority={false}
        className="pointer-events-none -z-20 select-none absolute h-120 left-[-70%] md:left-[-50%] top-0 rotate-25"
      />
      <Image
        src="/section-images/w-logo-light.svg"
        alt=""
        aria-hidden
        width={2000}
        height={2000}
        sizes="100vw"
        priority={false}
        className="pointer-events-none -z-20 select-none absolute h-120 right-[-50%] -top-50"
      />
      <div className="my-container-x pt-10 sm:pt-0">
        <div className="mx-auto flex flex-col items-center text-center">
          <p
            ref={textRef}
            className="max-w-177.5 text-base leading-normal sm:text-lg lg:text-xl"
          >
            Every year, millions of liters of fresh rainwater go to waste
            because we do not divert it appropriately. This site helps you
            understand the rainwater harvesting potential that your home,
            office, or building premises can provide-turning unused rainfall
            into a powerful, sustainable resource. To help you take the next
            step, we provide a comprehensive customized report for a nominal
            cost.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:mt-10.5 sm:flex-row sm:gap-5">
            <PrimaryButton
              href="/sample-report"
              btnType="solid-secondary"
              size="sm"
            >
              View a sample report here
            </PrimaryButton>

            <PrimaryButton href="/demo" btnType="solid-primary" size="sm">
              Click here for a demo
            </PrimaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}
