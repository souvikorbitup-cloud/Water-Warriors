import type { Metadata } from "next";
import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import PrimaryButton from "@/components/main/shared/button/PrimaryButton";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for could not be found.",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 sm:px-6">
      <Card className="w-full max-w-2xl border-none shadow-none ring-0">
        <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-10 sm:py-16">
          {/* 404 */}
          <h1 className="font-heading text-5xl font-bold tracking-tight text-primary sm:text-6xl md:text-7xl">
            404
          </h1>

          {/* Title */}
          <h2 className="mt-4 font-heading text-2xl font-semibold text-heading sm:text-3xl md:text-4xl">
            Page Not Found
          </h2>

          {/* Description */}
          <p className="mt-4 max-w-md text-sm leading-relaxed text-paragraph sm:text-base">
            The page you are looking for may have been moved, deleted, or never
            existed.
          </p>

          {/* Actions */}
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <PrimaryButton href="/" lifColor="light">
              Back to Home
            </PrimaryButton>
            <PrimaryButton btnType="outline" href="/contact-us">
              Contact Support
            </PrimaryButton>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
