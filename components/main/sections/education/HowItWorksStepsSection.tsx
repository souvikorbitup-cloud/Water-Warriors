import type { ComponentType } from "react";

import { Chanel, Clean, Rainfall, Storage } from "@/components/icons";

type Step = {
  title: string;
  description: string;
  Icon: ComponentType;
};

const steps: Step[] = [
  {
    title: "Catch",
    description:
      "Your roof collects the rain that falls on it — the larger the roof, the more water you can capture.",
    Icon: Rainfall,
  },
  {
    title: "Channel",
    description:
      "Gutters and downpipes carry the water away from the roof edge to a single collection point.",
    Icon: Chanel,
  },
  {
    title: "Clean",
    description:
      "A first-flush diverter sends the dirtiest first rain away, and a mesh or sand filter removes leaves and grit.",
    Icon: Clean,
  },
  {
    title: "Store or Recharge",
    description:
      "The clean water is either stored in a tank for later use or guided into the ground through a recharge pit.",
    Icon: Storage,
  },
];

export default function HowItWorksStepsSection() {
  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl pt-8 sm:pt-0">
          How It Works
        </h2>

        <ol className="mt-8 grid gap-8 sm:mt-10 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
          {steps.map(({ title, description, Icon }, index) => (
            <li key={title}>
              {/* Illustration card */}
              <div className="relative aspect-[1.55] overflow-hidden rounded-2xl bg-secondary/35 sm:rounded-3xl">
                <span className="absolute top-3 left-3 z-10 rounded-full bg-primary px-3 py-1 text-xs leading-snug font-medium text-primary-foreground sm:top-3.5 sm:left-3.5 sm:text-sm">
                  Step {index + 1}
                </span>

                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center p-4 [&_svg]:size-full [&_svg]:object-contain"
                >
                  <Icon />
                </div>
              </div>

              <h3 className="mt-4 text-xl font-semibold text-heading sm:mt-6 sm:text-2xl">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 sm:mt-3 sm:text-base sm:leading-6.5">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
