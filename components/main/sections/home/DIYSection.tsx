import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import FeaturedVideoCard from "@/components/main/shared/card/FeaturedVideoCard";
import { formatShortDate } from "@/lib/video-utils";
import { diy_guides } from "@/lib/data/all_data";

export default function DIYSection() {
  const [featured, ...rest] = diy_guides;
  const upNext = rest.slice(0, 3);

  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
          Step-by-Step DIY Guides
        </h2>

        <div className="mt-8 grid gap-6 sm:mt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14.5">
          {/* Left: playable featured video (stacks on top on mobile) */}
          <FeaturedVideoCard
            videoUrl={featured.video_url}
            thumbnailUrl={featured.video_thumbnel_url}
            title={featured.titile}
            publishDate={featured.publish_date}
            duration={featured.duration}
          />

          {/* Right: next 3 videos, each links to /education */}
          <ul className="flex flex-col justify-between gap-5 lg:gap-6">
            {upNext.map((guide) => (
              <li key={guide.video_url}>
                <Link
                  href="/education"
                  className="group flex items-center gap-3.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <div className="relative aspect-3/2 w-32 shrink-0 overflow-hidden rounded-xl sm:w-38">
                    <Image
                      src={guide.video_thumbnel_url}
                      alt={guide.titile}
                      fill
                      unoptimized
                      sizes="152px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background/60 text-heading">
                      <Play className="size-3.5 fill-current" />
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-sm leading-6 font-medium text-heading transition-colors group-hover:text-primary sm:text-base">
                      {guide.titile}
                    </h3>
                    <p className="mt-2 flex items-center text-sm text-paragraph/80 sm:mt-3 sm:text-base">
                      <time dateTime={guide.publish_date}>
                        {formatShortDate(guide.publish_date)}
                      </time>
                      <span
                        aria-hidden
                        className="mx-2 inline-block h-3.5 w-px bg-current sm:h-4"
                      />
                      <span>{guide.duration}</span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
