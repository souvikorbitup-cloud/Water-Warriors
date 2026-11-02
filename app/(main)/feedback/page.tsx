import FeedbackSection from "@/components/main/sections/feedback/FeedbackSection";
import MainbannerSection from "@/components/main/shared/banner/MainbannerSection";

export default function Feedback() {
  return (
    <>
      <MainbannerSection
        heading={
          <>
            Your experience matters.
            <br />
            <span className="text-primary">Help us make it better. </span>
          </>
        }
        description="Share what worked, what could be clearer and how we can improve your rainwater-harvesting journey."
        classes="max-w-120 sm:max-w-180"
        breadcrumbs={[
          {
            label: "Home",
            href: "/",
          },
          {
            label: "Feedback",
          },
        ]}
      />
      <FeedbackSection />
    </>
  );
}
