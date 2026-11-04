interface RechargeMattersSectionProps {
  litres?: string;
  location?: string;
}

const highlights = [
  "For instance, this collected water may be used for outdoor tasks like watering gardens and landscaping, as well as for indoor uses such as toilet flushing, potentially leading to noticeable reductions in household water-related expenses over time.",
  "Beyond direct consumption, directing this considerable amount of rainwater into the ground can play a vital role in local groundwater recharge. This process helps to replenish underground water reserves, supporting the natural water cycle in your immediate area.",
  "Such efforts contribute to overall water resilience for the region, minimizing stormwater runoff and fostering a more sustainable approach to managing this precious resource.",
];

export default function RechargeMattersSection({
  litres = "634,672",
  location = "Mega Hills, Hyderabad",
}: RechargeMattersSectionProps) {
  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        <h2 className="text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl xl:text-[52px]">
          Why Rainwater Recharge Matters.
        </h2>

        <p className="mt-4 max-w-285 text-base leading-normal sm:mt-5 lg:text-lg">
          Harvesting approximately {litres} litres of rainwater annually at your
          location in {location}, represents a substantial potential for
          augmenting your household water supply. This significant volume could
          be strategically utilized for various non-potable needs, reducing the
          demand on other sources.
        </p>

        <div className="mt-6 max-w-285 space-y-4 sm:mt-8 sm:space-y-6">
          {highlights.map((text) => (
            <p
              key={text}
              className="border-l-4 border-primary pl-4 text-base leading-normal sm:pl-5 lg:text-lg"
            >
              {text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
