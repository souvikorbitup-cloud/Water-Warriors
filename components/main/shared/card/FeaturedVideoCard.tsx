"use client";

import { useState, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Play, Pause } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatShortDate, getYouTubeId } from "@/lib/video-utils";
import type { VideoProvider } from "@/lib/models/Diyguide.model";

function getVimeoEmbedUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    if (!/(^|\.)vimeo\.com$/i.test(url.hostname)) return null;

    const segments = url.pathname.split("/").filter(Boolean);
    const idIndex = segments.findIndex((segment) => /^\d+$/.test(segment));
    if (idIndex === -1) return null;

    const params = new URLSearchParams({
      api: "1",
      autoplay: "1",
      playsinline: "1",
      title: "0",
      byline: "0",
      portrait: "0",
    });
    const hash =
      url.searchParams.get("h") ??
      (idIndex === segments.length - 2 ? segments[idIndex + 1] : null);
    if (hash) params.set("h", hash);

    return `https://player.vimeo.com/video/${segments[idIndex]}?${params}`;
  } catch {
    return null;
  }
}

export interface FeaturedVideoCardProps {
  /** Resolved URL for the selected video provider */
  videoUrl: string;
  videoProvider: VideoProvider;
  thumbnailUrl: string;
  title: string;
  /** ISO date, e.g. "2026-10-15" */
  publishDate: string | null;
  duration: number | null;
  className?: string;
  /**
   * Controlled mode: when `playing` is passed, the parent decides which card is playing.
   */
  playing?: boolean;
  onPlay?: () => void;
  /** Thin vertical divider between the title and the play button */
  showDivider?: boolean;
}

export default function FeaturedVideoCard({
  videoUrl,
  videoProvider,
  thumbnailUrl,
  title,
  publishDate,
  duration,
  className,
  playing,
  onPlay,
}: FeaturedVideoCardProps) {
  const t = useTranslations("Video");
  const locale = useLocale();
  const [localPlaying, setLocalPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isControlled = playing !== undefined;
  const isPlaying = isControlled ? playing : localPlaying;

  const videoId = getYouTubeId(videoUrl);
  const vimeoEmbedUrl =
    videoProvider === "external" ? getVimeoEmbedUrl(videoUrl) : null;
  const isPlayingYouTube = isPlaying && videoProvider === "youtube" && videoId;
  const isPlayingVimeo = isPlaying && vimeoEmbedUrl;
  const isNativeVideo =
    videoProvider === "cloudinary" ||
    (videoProvider === "external" && !vimeoEmbedUrl);
  const isPlayingNativeVideo = isPlaying && isNativeVideo;

  const handlePlay = () => {
    if (!isControlled) {
      setLocalPlaying(true);
    }

    setIsPaused(isNativeVideo);
    onPlay?.();
  };

  const handlePause = () => {
    if (isNativeVideo) {
      videoRef.current?.pause();
    } else if (videoProvider === "youtube") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "pauseVideo",
          args: [],
        }),
        "https://www.youtube.com",
      );
    } else {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "pause" }),
        "https://player.vimeo.com",
      );
    }

    setIsPaused(true);
  };

  const handleResume = () => {
    if (isNativeVideo) {
      const video = videoRef.current;
      if (video) {
        void video.play().then(
          () => setIsPaused(false),
          () => setIsPaused(true),
        );
      }
      return;
    }

    if (videoProvider === "youtube") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "playVideo",
          args: [],
        }),
        "https://www.youtube.com",
      );
    } else {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "play" }),
        "https://player.vimeo.com",
      );
    }

    setIsPaused(false);
  };

  return (
    <article
      className={cn(
        "group relative aspect-4/3 w-full overflow-hidden rounded-xl border border-border bg-foreground sm:aspect-video lg:aspect-auto lg:h-full",
        className,
      )}
    >
      {/* Media: thumbnail first, player after pressing play */}
      {isPlayingNativeVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          src={videoUrl}
          poster={thumbnailUrl || undefined}
          title={title}
          autoPlay
          controls
          playsInline
          onPlay={() => setIsPaused(false)}
          onPause={() => setIsPaused(true)}
        />
      ) : isPlayingYouTube ? (
        <iframe
          ref={iframeRef}
          className="absolute inset-0 size-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : isPlayingVimeo ? (
        <iframe
          ref={iframeRef}
          className="absolute inset-0 size-full"
          src={vimeoEmbedUrl}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          unoptimized
          sizes="(min-width: 1024px) 600px, 100vw"
          className="object-cover"
        />
      )}

      {/* Title overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-foreground/80 px-4 py-4 transition-transform duration-500 ease-out sm:px-6 sm:py-5 lg:px-8 lg:py-6",
          isPlaying &&
            "pointer-events-none translate-y-full group-hover:translate-y-0",
        )}
      >
        <div className="pr-20 sm:pr-28">
          <h3 className="line-clamp-2 text-base leading-snug font-medium text-background sm:text-xl lg:text-[22px]">
            {title}
          </h3>

          {(publishDate || duration != null) && (
            <p className="mt-1.5 flex items-center text-xs text-background sm:mt-2 sm:text-sm lg:text-base">
              {publishDate ? (
                <time dateTime={publishDate}>
                  {formatShortDate(publishDate, locale)}
                </time>
              ) : null}

              {publishDate && duration != null ? (
                <span
                  aria-hidden
                  className="mx-2 inline-block h-3.5 w-px bg-current sm:h-4"
                />
              ) : null}

              {duration != null ? (
                <span>{t("duration", { minutes: duration })}</span>
              ) : null}
            </p>
          )}
        </div>

        {/* Vertical divider */}
        <span
          aria-hidden
          className="absolute inset-y-3 right-18 w-px bg-background/20 sm:inset-y-4 sm:right-27"
        />

        {/* Play button */}
        {!isPlaying && (
          <button
            type="button"
            onClick={handlePlay}
            aria-label={t("play", { title })}
            title={t("playVideo")}
            className="absolute top-1/2 right-4 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background text-heading transition-transform duration-300 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:right-5 sm:size-11.25"
          >
            <Play className="size-4.5 fill-current sm:size-5" />
          </button>
        )}

        {/* Pause / Resume button */}
        {isPlaying && (
          <button
            type="button"
            onClick={isPaused ? handleResume : handlePause}
            aria-label={isPaused ? t("resume") : t("pause")}
            title={isPaused ? t("resume") : t("pause")}
            className="pointer-events-auto absolute top-1/2 right-4 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background text-heading transition-transform duration-300 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:right-5 sm:size-11.25"
          >
            {isPaused ? (
              <Play className="size-4.5 fill-current sm:size-5" />
            ) : (
              <Pause className="size-4.5 fill-current sm:size-5" />
            )}
          </button>
        )}
      </div>
    </article>
  );
}
