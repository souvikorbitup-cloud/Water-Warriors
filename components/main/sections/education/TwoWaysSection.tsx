import { getTranslations } from "next-intl/server";
import Image from "next/image";

import { Groundwater } from "@/components/icons";

export default async function TwoWaysSection() {
  const t = await getTranslations("Education");
  const tCommon = await getTranslations("Common");

  return (
    <section className="container-y-pad overflow-hidden bg-secondary/35">
      <div className="my-container-x">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
          {t("twoWaysTitle")}
        </h2>

        <div className="mt-8 grid gap-6 sm:mt-12 md:grid-cols-2 lg:gap-8">
          {/* Option 1: store it */}
          <article className="overflow-hidden rounded-2xl border border-border bg-card sm:rounded-3xl">
            <div className="relative aspect-3/2 w-full sm:aspect-2/1">
              <Image
                src="/section-images/rain-collect.png"
                alt={tCommon("rainCollectAlt")}
                fill
                sizes="(min-width: 1200px) 590px, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="p-5 sm:p-7">
              <h3 className="text-xl font-semibold text-heading sm:text-2xl lg:text-[26px]">
                {t("option1Title")}
              </h3>
              <p className="mt-3 text-sm leading-6.5 sm:text-[15px]">
                {t("option1Description")}
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
                {t("option2Title")}
              </h3>
              <p className="mt-3 text-sm leading-6.5 sm:text-[15px]">
                {t("option2Description")}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
