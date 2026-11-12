"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import FeaturedVideoCard from "../../shared/card/FeaturedVideoCard";
import type { PublicDiyGuide } from "@/lib/content/constants";

export default function DIYGuidesSection({
  guides,
  error = false,
}: {
  guides: PublicDiyGuide[];
  error?: boolean;
}) {
  const t = useTranslations("Education");
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  return (
    <section className="container-y-pad overflow-hidden" id="diy-guides">
      <div className="my-container-x">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
          {t("diyTitle")}
        </h2>

        {error ? (
          <p className="mt-8 text-center text-sm text-muted-foreground sm:mt-12">
            {t("diyError")}
          </p>
        ) : guides.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground sm:mt-12">
            {t("diyEmpty")}
          </p>
        ) : (
          <ul className="mt-8 grid gap-6 sm:mt-12 md:grid-cols-2 lg:gap-8">
            {guides.map((guide) => (
              <li key={guide.id}>
                <FeaturedVideoCard
                  videoUrl={guide.videoUrl}
                  thumbnailUrl={guide.thumbnailUrl}
                  title={guide.title}
                  publishDate={guide.publishedAt}
                  duration={guide.durationMinutes}
                  playing={activeVideoUrl === guide.id}
                  onPlay={() => setActiveVideoUrl(guide.id)}
                  className="sm:aspect-[1.44] lg:aspect-[1.44] lg:h-auto"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
