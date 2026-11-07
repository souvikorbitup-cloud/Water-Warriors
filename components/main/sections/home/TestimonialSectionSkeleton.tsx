export default function TestimonialSectionSkeleton() {
  return (
    <section
      className="container-y-pad bg-secondary/45"
      aria-hidden
      role="status"
    >
      <div className="my-container-x">
        <div className="mx-auto h-10 w-64 max-w-full rounded-lg bg-heading/10" />
        <div className="mx-auto mt-10 max-w-135 space-y-6">
          <div className="mx-auto h-24 w-full rounded-lg bg-heading/10" />
          <div className="flex items-center justify-center gap-3">
            <div className="size-12 rounded-full bg-heading/10" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-heading/10" />
              <div className="h-3 w-24 rounded bg-heading/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
