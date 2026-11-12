"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Play } from "lucide-react";

import FeaturedVideoCard from "@/components/main/shared/card/FeaturedVideoCard";
import { formatShortDate } from "@/lib/video-utils";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { PublicDiyGuide } from "@/lib/content/constants";

export default function DIYSection({
  guides,
  error = false,
}: {
  guides: PublicDiyGuide[];
  error?: boolean;
}) {
  const t = useTranslations("Home");
  const tVideo = useTranslations("Video");
  const locale = useLocale();
  const [featured, ...rest] = guides;
  const upNext = rest.slice(0, 3);

  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
          {t("diyTitle")}
        </h2>

        {error ? (
          <p className="mt-8 text-center text-sm text-muted-foreground sm:mt-12">
            {t("diyError")}
          </p>
        ) : !featured ? (
          <p className="mt-8 text-center text-sm text-muted-foreground sm:mt-12">
            {t("diyEmpty")}
          </p>
        ) : (
          <div
            className={cn(
              "mt-8 grid gap-6 sm:mt-12 sm:min-h-80",
              upNext.length > 0 && "lg:grid-cols-[1.1fr_1fr] lg:gap-14.5",
            )}
          >
            <FeaturedVideoCard
              videoUrl={featured.videoUrl}
              thumbnailUrl={featured.thumbnailUrl}
              title={featured.title}
              publishDate={featured.publishedAt}
              duration={featured.durationMinutes}
            />

            {upNext.length > 0 ? (
              <ul className="flex flex-col justify-between gap-5 lg:gap-6">
                {upNext.map((guide) => (
                  <li key={guide.id}>
                    <Link
                      href="/education/#diy-guides"
                      className="group flex items-center gap-3.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                      <div className="relative aspect-3/2 w-32 shrink-0 overflow-hidden rounded-xl bg-heading/10 sm:w-38">
                        {guide.thumbnailUrl ? (
                          <Image
                            src={guide.thumbnailUrl}
                            alt={guide.title}
                            fill
                            unoptimized
                            sizes="152px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : null}
                        <span className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background/60 text-heading">
                          <Play className="size-3.5 fill-current" />
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-sm leading-6 font-medium text-heading transition-colors group-hover:text-primary sm:text-base">
                          {guide.title}
                        </h3>
                        {(guide.publishedAt ||
                          guide.durationMinutes != null) && (
                          <p className="mt-2 flex items-center text-sm text-paragraph/80 sm:mt-3 sm:text-base">
                            {guide.publishedAt ? (
                              <time dateTime={guide.publishedAt}>
                                {formatShortDate(guide.publishedAt, locale)}
                              </time>
                            ) : null}
                            {guide.publishedAt &&
                            guide.durationMinutes != null ? (
                              <span
                                aria-hidden
                                className="mx-2 inline-block h-3.5 w-px bg-current sm:h-4"
                              />
                            ) : null}
                            {guide.durationMinutes != null ? (
                              <span>
                                {tVideo("duration", {
                                  minutes: guide.durationMinutes,
                                })}
                              </span>
                            ) : null}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
