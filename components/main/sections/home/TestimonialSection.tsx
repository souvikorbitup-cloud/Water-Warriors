"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Quote } from "lucide-react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import type { PublicTestimonial } from "@/lib/content/constants";
import { initialsFromName } from "@/lib/content/client-form";

import "swiper/css";
import "swiper/css/pagination";

export default function TestimonialSection({
  testimonials,
}: {
  testimonials: PublicTestimonial[];
}) {
  const t = useTranslations("Home");

  if (!testimonials.length) return null;

  return (
    <section className="container-y-pad overflow-hidden bg-secondary/45 relative">
      {/* Background image overlay */}
      <Image
        src="/images/bg-lines.png"
        alt="bg-lines"
        aria-hidden
        fill
        sizes="100vw"
        priority={false}
        className="pointer-events-none absolute inset-0 z-5 h-full w-full object-cover opacity-50"
        style={{ mixBlendMode: "multiply" }}
      />
      <div className="my-container-x relative z-10">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
          {t("testimonialsTitle")}
        </h2>

        <div className="relative mx-auto mt-8 max-w-135 sm:mt-10">
          {/* Decorative quote marks (stay fixed while slides change) */}
          <Quote
            aria-hidden
            className="absolute top-0 right-0 size-6 fill-primary text-primary sm:size-7 lg:size-8 z-5"
          />
          <Quote
            aria-hidden
            className="absolute top-0 left-0 size-6 rotate-180 fill-primary text-primary sm:size-7 lg:size-8 z-5"
          />

          <Swiper
            modules={[Pagination, Autoplay, A11y]}
            slidesPerView={1}
            loop={testimonials.length > 1}
            autoHeight
            speed={600}
            grabCursor
            autoplay={
              testimonials.length > 1
                ? { delay: 5000, disableOnInteraction: false }
                : false
            }
            pagination={{
              el: ".testimonial-pagination",
              clickable: true,
              bulletClass:
                "inline-block size-2 cursor-pointer rounded-full bg-primary/35 transition-all duration-300",
              bulletActiveClass: "size-2.5! bg-primary!",
            }}
          >
            {testimonials.map((testimonial) => (
              <SwiperSlide key={testimonial.id}>
                <figure className="flex flex-col items-center px-9 text-center sm:px-16 lg:px-17.5">
                  <blockquote>
                    <p className="text-sm leading-6 text-heading sm:text-base">
                      {testimonial.message}
                    </p>
                  </blockquote>

                  <figcaption className="mt-6 flex items-center gap-2.5 sm:mt-8">
                    {testimonial.imageUrl ? (
                      <Image
                        src={testimonial.imageUrl}
                        alt={testimonial.fullName}
                        width={48}
                        height={48}
                        unoptimized
                        className="size-11 shrink-0 rounded-full border-2 border-primary object-cover sm:size-12"
                      />
                    ) : (
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-xs font-semibold text-heading sm:size-12">
                        {initialsFromName(testimonial.fullName)}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-heading text-base leading-snug font-semibold text-heading sm:text-lg">
                        {testimonial.fullName}
                      </p>
                      <p className="text-sm text-paragraph sm:text-base">
                        {testimonial.jobRole}
                      </p>
                    </div>
                  </figcaption>
                </figure>
              </SwiperSlide>
            ))}

            {/* Pagination dots */}
            <div
              slot="container-end"
              className="testimonial-pagination mt-8 flex items-center justify-center gap-2 sm:mt-10"
            />
          </Swiper>
        </div>
      </div>
    </section>
  );
}
