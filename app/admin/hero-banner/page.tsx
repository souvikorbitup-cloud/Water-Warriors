import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePagePermission } from "@/lib/auth/auth-server-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getHeroSlides } from "@/lib/services/hero-slides";
import HeroSlidesManager from "./settings-form";

export const metadata: Metadata = { title: "Hero Slides" };

export default function HeroBannerPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Loading hero slides"
          className="space-y-4"
        >
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      }
    >
      <HeroBannerContent />
    </Suspense>
  );
}

async function HeroBannerContent() {
  await requirePagePermission(PERMISSIONS.appearanceManage);
  return <HeroSlidesManager initialSlides={await getHeroSlides()} />;
}
