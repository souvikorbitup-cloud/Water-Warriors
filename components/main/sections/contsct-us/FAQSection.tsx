"use client";

import Image from "next/image";
import { CircleMinus, CirclePlus } from "lucide-react";
import { Accordion } from "radix-ui";

const faqs = [
  {
    question: "What do I need to get started?",
    answer:
      "Start with your property’s location. Use the map icon or location search, then select the pen icon to mark at least four points across your rooftop or open area.",
  },
  {
    question: "Can I explore an office or a building?",
    answer:
      "Yes. Whether it’s a home, an office or a building, select its location and mark the rooftop or open area you’d like to explore.",
  },
  {
    question: "Is there a cost for the report?",
    answer:
      "The customized report is available at a nominal cost. You can explore your location and rooftop on the map before deciding.",
  },
  {
    question: "Are the measurements exact?",
    answer:
      "No. All measurements are approximate and intended for reference only. We value your privacy and never store your data.",
  },
];

export default function FAQSection() {
  return (
    <section className="container-y-pad relative isolate overflow-hidden bg-secondary/35">
      {/* Decorative background shapes */}
      <Image
        src="/section-images/w-logo-dark.svg"
        alt=""
        aria-hidden
        width={2000}
        height={2000}
        sizes="100vw"
        priority={false}
        className="pointer-events-none absolute top-0 left-[-70%] -z-20 h-120 rotate-25 select-none md:left-[-50%]"
      />
      <Image
        src="/section-images/w-logo-dark.svg"
        alt=""
        aria-hidden
        width={2000}
        height={2000}
        sizes="100vw"
        priority={false}
        className="pointer-events-none absolute -top-50 right-[-50%] -z-20 h-120 select-none"
      />

      <div className="my-container-x">
        <div className="grid items-start gap-8 lg:grid-cols-[0.58fr_1fr] lg:gap-12">
          {/* Left: heading */}
          <div>
            <h2 className="text-3xl leading-[1.15] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
              Before you get <br className="hidden lg:block" />
              in touch.
            </h2>
            <p className="mt-4 max-w-85 text-base leading-normal sm:mt-6 lg:text-lg">
              A few useful answers about exploring your property’s potential.
            </p>
          </div>

          {/* Right: accordion */}
          <Accordion.Root
            type="single"
            collapsible
            defaultValue="item-0"
            className="w-full"
          >
            {faqs.map(({ question, answer }, index) => (
              <Accordion.Item
                key={question}
                value={`item-${index}`}
                className="not-last:border-b border-border first:pt-0"
              >
                <Accordion.Header asChild>
                  <h3>
                    <Accordion.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left font-heading text-lg leading-snug font-semibold text-heading transition-colors hover:text-heading/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:py-6 sm:text-xl lg:text-2xl">
                      {question}
                      <CirclePlus
                        aria-hidden
                        strokeWidth={1.5}
                        className="size-5 shrink-0 text-heading group-data-[state=open]:hidden"
                      />
                      <CircleMinus
                        aria-hidden
                        strokeWidth={1.5}
                        className="hidden size-5 shrink-0 text-heading group-data-[state=open]:block"
                      />
                    </Accordion.Trigger>
                  </h3>
                </Accordion.Header>

                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <p className="pr-8 pb-5 text-sm leading-6.5 sm:pr-12 sm:text-[15px]">
                    {answer}
                  </p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </div>
    </section>
  );
}
