"use client";

import { useState } from "react";
import FeaturedVideoCard from "../../shared/card/FeaturedVideoCard";

const diy_guides = [
  {
    video_url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    video_thumbnel_url:
      "https://img.youtube.com/vi/ScMzIvxBSi4/maxresdefault.jpg",
    titile: "How to Build a Simple Rainwater Harvesting System at Home",
    publish_date: "2026-10-15",
    duration: "10 min",
  },
  {
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    video_thumbnel_url:
      "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
    titile: "DIY Rainwater Collection: A Beginner's Step-by-Step Guide",
    publish_date: "2026-10-10",
    duration: "8 min",
  },
  {
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    video_thumbnel_url:
      "https://img.youtube.com/vi/ysz5S6PUM-U/maxresdefault.jpg",
    titile: "How to Create an Affordable Rainwater Storage System",
    publish_date: "2026-09-28",
    duration: "12 min",
  },
  {
    video_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    video_thumbnel_url:
      "https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg",
    titile: "Easy DIY Rooftop Rainwater Harvesting Techniques",
    publish_date: "2026-09-20",
    duration: "6 min",
  },
  {
    video_url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
    video_thumbnel_url:
      "https://img.youtube.com/vi/LXb3EKWsInQ/maxresdefault.jpg",
    titile: "Rainwater Filtration: Make Your Own Water Filter at Home",
    publish_date: "2026-09-12",
    duration: "15 min",
  },
];

export default function DIYGuidesSection() {
  // Only one video can play at a time: starting another one unmounts the previous player
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  return (
    <section className="container-y-pad overflow-hidden">
      <div className="my-container-x">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-4xl lg:text-5xl">
          Step-by-Step DIY Guides
        </h2>

        <ul className="mt-8 grid gap-6 sm:mt-12 md:grid-cols-2 lg:gap-8">
          {diy_guides.map((guide) => (
            <li key={guide.video_url}>
              <FeaturedVideoCard
                videoUrl={guide.video_url}
                thumbnailUrl={guide.video_thumbnel_url}
                title={guide.titile}
                publishDate={guide.publish_date}
                duration={guide.duration}
                playing={activeVideoUrl === guide.video_url}
                onPlay={() => setActiveVideoUrl(guide.video_url)}
                className="sm:aspect-[1.44] lg:aspect-[1.44] lg:h-auto"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
