"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Show the button once the page has scrolled further than this (px). */
const SHOW_AFTER_PX = 10;

interface ScrollToTopProps {
  /** Accessible name. Pass a translated string, e.g. t("scrollToTop"). */
  label?: string;
  className?: string;
}

export default function ScrollToTop({
  label = "Scroll to top",
  className,
}: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll(); // correct state on mount / after a refresh mid-page
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={label}
      title={label}
      // Hidden state is removed from tab order and pointer events.
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        "fixed bottom-4 right-4 z-50 flex size-11 items-center justify-center rounded-full cursor-pointer",
        "bg-primary text-primary-foreground shadow-lg shadow-black/15",
        "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary/90",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        "sm:bottom-8 sm:right-8",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
        className,
      )}
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  );
}
