import { getTranslations } from "next-intl/server";
import {
  BrushCleaning,
  Funnel,
  Layers,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const tips: { Icon: LucideIcon; index: 0 | 1 | 2 | 3 }[] = [
  { Icon: BrushCleaning, index: 0 },
  { Icon: Funnel, index: 1 },
  { Icon: ShieldCheck, index: 2 },
  { Icon: Layers, index: 3 },
];

export default async function KeepItWorkingSection() {
  const t = await getTranslations("Education");
  return (
    <section className="container-y-pad overflow-hidden bg-[linear-gradient(180deg,var(--secondary)_0%,rgba(255,255,255,0)_30%,#FFF_100%)]">
      <div className="my-container-x">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
          {t("keepTitle")}
        </h2>

        <ul className="mt-8 grid gap-4 sm:mt-12 md:grid-cols-2 lg:gap-8">
          {tips.map(({ Icon, index }) => (
            <li
              key={index}
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
                  {t("tipLabel", { number: index + 1 })}
                </p>
                <p className="mt-1 text-sm leading-6 sm:text-base sm:leading-6.5">
                  {t(`tips.${index}`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
