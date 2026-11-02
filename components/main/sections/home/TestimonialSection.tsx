"use client";

import Image from "next/image";
import { Quote } from "lucide-react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";

const testimonials = [
  {
    full_name: "Isabella Marin",
    job_role: "Education Creator",
    message:
      "The experience has been amazing! The platform is easy to use, well-designed, and offers everything I need. It has made my daily work much more efficient.",
    img_url: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    full_name: "Daniel Cooper",
    job_role: "Digital Marketing Specialist",
    message:
      "I absolutely love the simplicity and attention to detail. Everything works smoothly, and the overall experience has exceeded my expectations.",
    img_url: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    full_name: "Sophia Williams",
    job_role: "Content Creator",
    message:
      "A fantastic experience from start to finish! The quality, usability, and thoughtful features make this platform stand out. Highly recommended!",
    img_url: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    full_name: "Michael Anderson",
    job_role: "Business Consultant",
    message:
      "This has made things so much easier for me. I appreciate the smooth experience, professional approach, and excellent attention to user needs.",
    img_url: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    full_name: "Olivia Bennett",
    job_role: "Entrepreneur",
    message:
      "I'm genuinely impressed! The experience is seamless, the design is beautiful, and everything feels thoughtfully put together. Looking forward to using it more!",
    img_url: "https://randomuser.me/api/portraits/women/79.jpg",
  },
];

export default function TestimonialSection() {
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
          What Our Users Say
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
            {testimonials.map(({ full_name, job_role, message, img_url }) => (
              <SwiperSlide key={full_name}>
                <figure className="flex flex-col items-center px-9 text-center sm:px-16 lg:px-17.5">
                  <blockquote>
                    <p className="text-sm leading-6 text-heading sm:text-base">
                      {message}
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
                        {job_role}
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
