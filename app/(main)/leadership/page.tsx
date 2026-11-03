import MainbannerSection from "@/components/main/shared/banner/MainbannerSection";

export default function Leadership() {
  return (
    <>
      <MainbannerSection
        heading={
          <>
            Every rooftop
            <br />
            <span className="text-primary">holds a possibility.</span>
          </>
        }
        description="We help homeowners, offices and buildings discover their rainwater-harvesting potential, one property at a time."
        classes="max-w-80 sm:max-w-140"
        breadcrumbs={[
          {
            label: "Home",
            href: "/",
          },
          {
            label: "Leadership",
          },
        ]}
      />
    </>
  );
}
