export default function DIYSectionSkeleton() {
  return (
    <section className="container-y-pad" aria-hidden role="status">
      <div className="my-container-x">
        <div className="mx-auto h-10 w-80 max-w-full rounded-lg bg-heading/10" />
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-14.5">
          <div className="aspect-video w-full rounded-xl bg-heading/10" />
          <div className="flex flex-col justify-between gap-5">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-center gap-3.5">
                <div className="h-20 w-32 shrink-0 rounded-xl bg-heading/10 sm:w-38" />
                <div className="w-full space-y-2">
                  <div className="h-4 w-4/5 rounded bg-heading/10" />
                  <div className="h-3 w-24 rounded bg-heading/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
