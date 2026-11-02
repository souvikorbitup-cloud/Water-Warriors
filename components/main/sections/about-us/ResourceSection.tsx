import { CloudRain, House, Megaphone, type LucideIcon } from "lucide-react";

type Highlight = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const highlights: Highlight[] = [
  {
    title: "Rain is an opportunity",
    description:
      "Rainwater reaches the places where we live and work. Harvesting begins by recognising it as a resource, rather than simply letting it flow away.",
    icon: CloudRain,
  },
  {
    title: "Every property is different",
    description:
      "Location and collection area matter. Looking at your own rooftop makes the conversation about rainwater more relevant to your home or building.",
    icon: House,
  },
  {
    title: "Awareness comes first",
    description:
      "Understanding what might be possible helps, you ask better questions and take a more considered approach to rainwater harvesting.",
    icon: Megaphone,
  },
];

export default function ResourceSection() {
  return (
    <section className="container-y-pad overflow-hidden bg-secondary/35">
      <div className="my-container-x">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
            A Resource Worth a Second Look.
          </h2>
          <p className="mt-4 max-w-120 text-sm leading-6 sm:mt-5 sm:text-base lg:mt-6">
            A more thoughtful relationship with water can begin with the rain
            that already falls on your property.
          </p>
        </div>

        <ul className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-5">
          {highlights.map(({ title, description, icon: Icon }) => (
            <li
              key={title}
              className="rounded-2xl bg-card p-5 sm:rounded-3xl sm:p-6 md:nth-3:col-span-2 lg:nth-3:col-span-1"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-12.5">
                <Icon className="size-5 sm:size-5.5" aria-hidden />
              </span>

              <h3 className="mt-5 text-xl font-semibold text-heading sm:mt-6 sm:text-2xl">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 sm:mt-4 sm:text-[15px]">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
