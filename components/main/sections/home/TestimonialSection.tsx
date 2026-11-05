"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Quote } from "lucide-react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";

const testimonials = [
  {
    key: "0",
    full_name: "Isabella Marin",
    img_url: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    key: "1",
    full_name: "Daniel Cooper",
    img_url: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    key: "2",
    full_name: "Sophia Williams",
    img_url: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    key: "3",
    full_name: "Michael Anderson",
    img_url: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    key: "4",
    full_name: "Olivia Bennett",
    img_url: "https://randomuser.me/api/portraits/women/79.jpg",
  },
] as const;

export default function TestimonialSection() {
  const t = useTranslations("Home");
  const tTestimonials = useTranslations("Testimonials");

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
            loop
            autoHeight
            speed={600}
            grabCursor
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{
              el: ".testimonial-pagination",
              clickable: true,
              bulletClass:
                "inline-block size-2 cursor-pointer rounded-full bg-primary/35 transition-all duration-300",
              bulletActiveClass: "size-2.5! bg-primary!",
            }}
          >
            {testimonials.map(({ key, full_name, img_url }) => (
              <SwiperSlide key={full_name}>
                <figure className="flex flex-col items-center px-9 text-center sm:px-16 lg:px-17.5">
                  <blockquote>
                    <p className="text-sm leading-6 text-heading sm:text-base">
                      {tTestimonials(`${key}.message`)}
                    </p>
                  </blockquote>

                  <figcaption className="mt-6 flex items-center gap-2.5 sm:mt-8">
                    <Image
                      src={img_url}
                      alt={full_name}
                      width={48}
                      height={48}
                      unoptimized
                      className="size-11 shrink-0 rounded-full border-2 border-primary object-cover sm:size-12"
                    />
                    <div className="text-left">
                      <p className="font-heading text-base leading-snug font-semibold text-heading sm:text-lg">
                        {full_name}
                      </p>
                      <p className="text-sm text-paragraph sm:text-base">
                        {tTestimonials(`${key}.job_role`)}
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
