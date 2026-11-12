export default function DIYGuidesSectionSkeleton() {
  return (
    <section className="container-y-pad" aria-hidden role="status">
      <div className="my-container-x">
        <div className="mx-auto h-10 w-80 max-w-full rounded-lg bg-heading/10" />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:gap-8">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="aspect-[1.44] w-full rounded-xl bg-heading/10"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
