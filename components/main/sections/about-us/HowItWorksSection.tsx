import Image from "next/image";
import {
  Check,
  FileChartColumn,
  MapPin,
  PenTool,
  type LucideIcon,
} from "lucide-react";

type Step = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const steps: Step[] = [
  {
    title: "Find your property",
    description:
      "Use the map icon to pinpoint your location, or enter your location in the search bar.",
    icon: MapPin,
  },
  {
    title: "Mark your rooftop",
    description:
      "Choose the pen icon and place at least four points across your rooftop or open area on the map.",
    icon: PenTool,
  },
  {
    title: "Explore the potential",
    description:
      "Get a customized report at free of cost to understand your property’s rainwater-harvesting potential.",
    icon: FileChartColumn,
  },
];

const principles = [
  {
    title: "Property-first thinking",
    description:
      "A home, an office or a building — start with the place that matters to you.",
  },
  {
    title: "Clarity over complexity",
    description:
      "A focused journey from finding your location to understanding your potential.",
  },
  {
    title: "Honest about estimates",
    description:
      "All measurements are approximate and intended for reference only.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        {/* Part 1: steps */}
        <header className="max-w-205">
          <h2 className="text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
            From a Location To a Clearer Picture.
          </h2>
          <p className="mt-4 text-base leading-relaxed sm:mt-5 lg:text-lg">
            You don't need to begin with all the answers. Start with your
            property, select its collection area and explore its
            rainwater-harvesting potential.
          </p>
        </header>

        <ol className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <li
              key={title}
              className="rounded-2xl bg-secondary/35 p-5 sm:rounded-3xl sm:nth-3:col-span-2 lg:nth-3:col-span-1"
            >
              <div className="flex items-start justify-between">
                <span className="flex size-10.5 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-11.5">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span
                  aria-hidden
                  className="font-heading text-4xl leading-none font-medium text-primary sm:text-[42px]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-semibold text-heading sm:mt-6 lg:text-[26px]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6.5 sm:mt-4 sm:text-[15px]">
                {description}
              </p>
            </li>
          ))}
        </ol>

        <hr className="my-10 border-border lg:my-16" />

        {/* Part 2: principles */}
        <div className="grid items-start gap-8 md:grid-cols-2 lg:grid-cols-[1fr_1.6fr_1.3fr] lg:gap-10">
          <div className="md:col-span-2 lg:col-span-1">
            <h2 className="text-3xl leading-[1.2] font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
              Thoughtful <br className="hidden lg:block" />
              By Design.
            </h2>
            <p className="mt-4 text-base leading-relaxed sm:mt-5 lg:text-lg">
              We focus on a useful starting point, not a one-size-fits-all
              answer.
            </p>
          </div>

          <div className="relative aspect-3/2 w-full overflow-hidden rounded-2xl sm:rounded-3xl">
            <Image
              src="/section-images/rain-collect.png"
              alt="Rainwater flowing from a downpipe into a green storage tank in a garden"
              fill
              sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <ul className="flex flex-col gap-5 lg:gap-6">
            {principles.map(({ title, description }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-heading">
                  <Check className="size-3.5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-xl leading-7 font-semibold text-heading lg:text-[22px]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6.5 sm:text-[15px]">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
