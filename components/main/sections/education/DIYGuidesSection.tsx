"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import FeaturedVideoCard from "../../shared/card/FeaturedVideoCard";
import { diy_guides } from "@/lib/data/all_data";

export default function DIYGuidesSection() {
  // Only one video can play at a time: starting another one unmounts the previous player
  const t = useTranslations("Education");
  const tGuides = useTranslations("DiyGuides");
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  return (
    <section className="container-y-pad overflow-hidden" id="diy-guides">
      <div className="my-container-x">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
          {t("diyTitle")}
        </h2>

        <ul className="mt-8 grid gap-6 sm:mt-12 md:grid-cols-2 lg:gap-8">
          {diy_guides.map((guide) => (
            <li key={guide.video_url}>
              <FeaturedVideoCard
                videoUrl={guide.video_url}
                thumbnailUrl={guide.video_thumbnel_url}
                title={tGuides(guide.translationKey)}
                publishDate={guide.publish_date}
                duration={guide.duration}
                playing={activeVideoUrl === guide.video_url}
                onPlay={() => setActiveVideoUrl(guide.video_url)}
                className="sm:aspect-[1.44] lg:aspect-[1.44] lg:h-auto"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
