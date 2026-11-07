export default function FAQSectionSkeleton() {
  return (
    <section
      className="container-y-pad bg-secondary/35"
      aria-hidden
      role="status"
    >
      <div className="my-container-x grid gap-8 lg:grid-cols-[0.58fr_1fr]">
        <div className="space-y-4">
          <div className="h-12 w-64 max-w-full rounded-lg bg-heading/10" />
          <div className="h-16 w-80 max-w-full rounded-lg bg-heading/10" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-16 border-b border-border bg-heading/5"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
