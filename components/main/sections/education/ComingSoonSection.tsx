import Image from "next/image";
import { Clock } from "lucide-react";

export default function ComingSoonSection() {
  return (
    <section className="relative isolate overflow-hidden bg-secondary/35 container-y-pad">
      {/* Decorative background shapes */}
      <Image
        src="/section-images/w-logo-dark.svg"
        alt=""
        aria-hidden
        width={2000}
        height={2000}
        sizes="100vw"
        priority={false}
        className="pointer-events-none absolute -top-10 left-[-35%] -z-20 h-100 rotate-35 select-none"
      />
      <Image
        src="/section-images/w-logo-dark.svg"
        alt=""
        aria-hidden
        width={2000}
        height={2000}
        sizes="100vw"
        priority={false}
        className="pointer-events-none absolute -top-10 right-[-35%] -z-20 h-100 -rotate-35 select-none"
      />

      <div className="my-container-x">
        <div className="mx-auto flex flex-col items-center text-center">
          <h2 className="text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
            More Learning Is on the Way
          </h2>

          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground sm:mt-8 sm:px-4.5 sm:py-2">
            <Clock className="size-4" aria-hidden />
            Coming Soon
          </span>
        </div>
      </div>
    </section>
  );
}
