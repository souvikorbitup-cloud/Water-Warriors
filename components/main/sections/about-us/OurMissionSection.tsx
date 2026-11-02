import Image from "next/image";
import { Target } from "lucide-react";

export default function OurMissionSection() {
  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        {/* Intro + image */}
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-9">
          <div className="pt-8 sm:pt-0">
            <h2 className="text-3xl leading-[1.15] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
              A Water Conscious Future Starts at Home.
            </h2>

            <div className="mt-5 space-y-5 text-base leading-normal text-paragraph sm:mt-6 lg:mt-9 lg:space-y-8 lg:text-lg">
              <p>
                Rain falls on our roofs, yet its potential often goes unnoticed.
                We believe understanding that potential is a meaningful first
                step towards making better use of the water around us.
              </p>
              <p>
                Our mission is to make rainwater-harvesting potential easier to
                explore. Water Warriors AI brings location and rooftop area
                together to help homeowners, offices and buildings see what
                could be possible for their property.
              </p>
            </div>

            <blockquote className="mt-7 border-l-4 border-primary pl-4 sm:pl-5">
              <p className="font-heading text-xl leading-snug font-medium text-heading lg:text-2xl">
                Make the first step towards rainwater harvesting an informed
                one.
              </p>
            </blockquote>
          </div>

          <figure>
            <div className="relative aspect-10/7 w-full overflow-hidden rounded-2xl sm:rounded-3xl">
              <Image
                src="/section-images/rain-collect.png"
                alt="Rainwater flowing from a downpipe into a green storage tank in a garden"
                fill
                sizes="(min-width: 1280px) 590px, (min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-4 text-sm text-paragraph lg:mt-5">
              From rainfall to a resource: a different way to look at the water
              that reaches your roof.
            </figcaption>
          </figure>
        </div>

        {/* Mission card */}
        <div className="mt-10 rounded-2xl border border-border bg-primary p-5 text-primary-foreground sm:rounded-3xl sm:p-7 lg:mt-12">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-4 lg:gap-x-5 lg:gap-y-3">
            <span className="flex size-10.5 items-center justify-center rounded-full bg-background text-heading">
              <Target className="size-5" />
            </span>

            <h3 className="text-xl font-medium text-heading sm:text-2xl lg:text-[26px]">
              Our Mission
            </h3>

            <p className="col-span-2 text-base leading-normal text-heading lg:col-span-1 lg:col-start-2 lg:text-lg">
              Water Warriors is a tool designed to help homeowners, building
              managers, and sustainability advocates understand the rainwater
              harvesting potential of their properties. Every year, billions of
              litres of fresh rainwater are lost to runoff because we lack the
              tools to visualize its potential. We are changing that.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
