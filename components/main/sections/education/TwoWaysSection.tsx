import Image from "next/image";

import { Groundwater } from "@/components/icons";

export default function TwoWaysSection() {
  return (
    <section className="container-y-pad overflow-hidden bg-secondary/35">
      <div className="my-container-x">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
          Two Ways to Use Rainwater
        </h2>

        <div className="mt-8 grid gap-6 sm:mt-12 md:grid-cols-2 lg:gap-8">
          {/* Option 1: store it */}
          <article className="overflow-hidden rounded-2xl border border-border bg-card sm:rounded-3xl">
            <div className="relative aspect-3/2 w-full sm:aspect-2/1">
              <Image
                src="/section-images/rain-collect.png"
                alt="Rainwater flowing from a downpipe into a green storage tank in a garden"
                fill
                sizes="(min-width: 1200px) 590px, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="p-5 sm:p-7">
              <h3 className="text-xl font-semibold text-heading sm:text-2xl lg:text-[26px]">
                Option 1: Store It for Use
              </h3>
              <p className="mt-3 text-sm leading-6.5 sm:text-[15px]">
                Collect rainwater in a covered tank or sump and use it for
                gardening, cleaning, flushing and other non-drinking needs. It
                reduces the water you draw from taps, borewells or tankers.
              </p>
            </div>
          </article>

          {/* Option 2: recharge the ground */}
          <article className="overflow-hidden rounded-2xl border border-border bg-card sm:rounded-3xl">
            <div
              aria-hidden
              className="relative aspect-3/2 w-full overflow-hidden sm:aspect-2/1 [&_svg]:size-full [&_svg]:object-cover"
            >
              <Groundwater />
            </div>

            <div className="p-5 sm:p-7">
              <h3 className="text-xl font-semibold text-heading sm:text-2xl lg:text-[26px]">
                Option 2: Recharge the Ground
              </h3>
              <p className="mt-3 text-sm leading-6.5 sm:text-[15px]">
                Direct rainwater into a recharge pit, trench or old well so it
                soaks back into the soil. This helps replenish the groundwater
                that borewells in your neighbourhood depend on.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
