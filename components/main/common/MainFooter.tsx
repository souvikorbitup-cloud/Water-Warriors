"use client";

import LogoLight from "@/components/icons/LogoLight";
import { footerNavLinks, socialLinks } from "@/lib/data/all_data";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type MainFooterProps = {
  visitorCount?: number;
};

export default function MainFooter({ visitorCount = 216 }: MainFooterProps) {
  const pathname = usePathname();

  return (
    <footer className="relative isolate overflow-hidden bg-foreground text-background">
      {/* Decorative background shape */}
      <Image
        src="/section-images/w-logo.svg"
        alt=""
        aria-hidden
        width={2000}
        height={2000}
        sizes="100vw"
        priority={false}
        className="pointer-events-none -z-20 select-none absolute h-180 left-[-50%] top-10 rotate-25"
      />
      <Image
        src="/section-images/w-logo.svg"
        alt=""
        aria-hidden
        width={2000}
        height={2000}
        sizes="100vw"
        priority={false}
        className="pointer-events-none -z-20 select-none absolute h-180 right-[-50%] -top-50"
      />

      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0)_55.4%)]" />

      <div className="my-container-x">
        {/* Top content */}
        <div className="flex flex-col items-center pt-12.5 text-center sm:pt-20 lg:pt-25">
          {/* Logo: WATER text recolored to white for the dark background */}
          <Link href="/">
            <LogoLight className="h-auto w-30 sm:w-40 lg:w-50" />
          </Link>

          <p className="mt-8 max-w-140 text-sm leading-6 text-background sm:mt-10 sm:text-base">
            Lorem ipsum dolor sit amet, consectetur sectetu ipsum dolor
            slit.Lorem i sdefa amet, consectetur sectetu ipsum dolor slit.
          </p>

          {/* Nav links */}
          <nav aria-label="Footer" className="mt-8 sm:mt-10">
            <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-8 lg:gap-x-7.5">
              {footerNavLinks.map(({ title, href }) => {
                const isActive = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={`text-sm font-normal transition-colors hover:text-primary sm:text-base ${
                        isActive ? "text-primary" : "text-background"
                      }`}
                    >
                      {title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Social icons */}
          <ul className="mt-8 flex items-center justify-center gap-3 sm:mt-10 sm:gap-4">
            {socialLinks.map(({ image, url, altText }) => (
              <li key={altText}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={altText}
                  className="flex size-9 items-center justify-center rounded-full border border-background transition-colors hover:border-primary sm:size-10"
                >
                  {altText === "Facebook" ? (
                    <Image
                      src={image}
                      alt=""
                      width={18}
                      height={18}
                      className="size-6 sm:size-8"
                    />
                  ) : (
                    <Image
                      src={image}
                      alt=""
                      width={18}
                      height={18}
                      className="size-4 sm:size-6"
                    />
                  )}
                </a>
              </li>
            ))}
          </ul>

          {/* Visitor counter */}
          <div className="mt-8 rounded-md border border-secondary px-2.5 py-1.5 text-sm font-medium text-secondary animate-color-transition sm:mt-10 sm:text-base">
            Visitors so far: {visitorCount}
          </div>
        </div>

        {/* Divider */}
        <div
          aria-hidden
          className="mt-10 h-px w-full bg-linear-to-r from-transparent via-background/20 to-transparent sm:mt-12"
        />

        {/* Copyright */}
        <p className="mx-auto max-w-250 py-8 text-center text-xs leading-5 text-primary sm:py-10 sm:text-sm sm:leading-6 lg:text-base">
          &copy; {new Date().getFullYear()} Water Warriors AI. All rights
          reserved. All proprietary technology and processes featured on this
          site are protected under national and international patent pending
          status. Unauthorized reproduction or use is strictly prohibited.
        </p>
      </div>
    </footer>
  );
}
