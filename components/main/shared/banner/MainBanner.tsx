import Image from "next/image";
import { ReactNode } from "react";

import Breadcrumb from "../breadcrumb/Breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MainBannerProps {
  fallbackImageUrl: string;
  heading: ReactNode;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  classes?: string;
}

export default function MainBanner({
  fallbackImageUrl,
  heading,
  description,
  breadcrumbs,
  classes,
}: MainBannerProps) {
  return (
    <section className="relative -mt-30">
      <div className="isolate flex min-h-120 items-center justify-center overflow-hidden sm:min-h-[65vh]">
        {/* Background Image */}
        <Image
          src={fallbackImageUrl}
          alt="Hero banner"
          fill
          priority
          className="absolute inset-0 -z-20 size-full object-cover object-top"
        />

        {/* Overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-black/48"
        />

        {/* Content */}
        <div className="my-container-x w-full py-24 sm:py-28">
          <div
            className={`mx-auto flex flex-col items-center text-center ${classes}`}
          >
            <Breadcrumb color="light" align="center" items={breadcrumbs} />

            <h1 className="mt-1 sm:mt-3 text-4xl leading-tight font-semibold text-background sm:text-5xl lg:text-6xl xl:text-[64px]">
              {heading}
            </h1>

            <p className="mt-4 max-w-175 text-sm leading-6 text-background sm:mt-6 sm:text-base">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Patent Badge */}
      <div className="absolute bottom-0 left-0 z-10 w-full">
        <div className="my-container-x flex translate-y-1/2 justify-center sm:justify-end">
          <Image
            src="/images/patent-badge.png"
            alt="Patent badge"
            aria-hidden="true"
            width={200}
            height={200}
            className="pointer-events-none z-10 h-auto w-40 select-none md:w-45 lg:w-50"
          />
        </div>
      </div>
    </section>
  );
}
