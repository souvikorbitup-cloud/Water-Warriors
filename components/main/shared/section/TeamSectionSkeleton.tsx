export default function TeamSectionSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <section className={className} aria-hidden role="status">
      <div className="my-container-x container-y-pad">
        <div className="mx-auto h-10 w-72 max-w-full rounded-lg bg-heading/10" />
        <div className="mt-12 grid gap-8 md:grid-cols-[220px_1fr] lg:grid-cols-[319px_1fr]">
          <div className="aspect-[0.59] w-full rounded-2xl bg-heading/10" />
          <div className="space-y-4">
            <div className="h-7 w-48 rounded bg-heading/10" />
            <div className="h-4 w-32 rounded bg-heading/10" />
            <div className="h-24 w-full rounded bg-heading/10" />
          </div>
        </div>
      </div>
    </section>
  );
}
