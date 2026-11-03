import {
  BrushCleaning,
  Funnel,
  Layers,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type Tip = {
  text: string;
  icon: LucideIcon;
};

const tips: Tip[] = [
  {
    text: "Clean roofs, gutters and downpipes before the rainy season starts.",
    icon: BrushCleaning,
  },
  {
    text: "Check and wash filters and first-flush diverters after heavy storms.",
    icon: Funnel,
  },
  {
    text: "Keep tanks covered and screened to keep out debris, insects and sunlight.",
    icon: ShieldCheck,
  },
  {
    text: "Inspect recharge pits each year and clear silt so water keeps soaking in.",
    icon: Layers,
  },
];

export default function KeepItWorkingSection() {
  return (
    <section className="container-y-pad overflow-hidden bg-[linear-gradient(180deg,var(--secondary)_0%,rgba(255,255,255,0)_30%,#FFF_100%)]">
      <div className="my-container-x">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
          Keep It Working
        </h2>

        <ul className="mt-8 grid gap-4 sm:mt-12 md:grid-cols-2 lg:gap-8">
          {tips.map(({ text, icon: Icon }, index) => (
            <li
              key={text}
              className="flex items-center gap-4 rounded-2xl border border-border bg-background/60 p-4 sm:gap-5 sm:rounded-3xl sm:px-6 sm:py-6"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-13">
                <Icon
                  className="size-5 sm:size-6"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </span>

              <div>
                <p className="text-base leading-6 font-semibold text-heading">
                  Tip {index + 1}:
                </p>
                <p className="mt-1 text-sm leading-6 sm:text-base sm:leading-6.5">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
