// =============================================================================================
//                                      Main Navbar
// =============================================================================================

export const navLinks = [
  { title: "Home", href: "/" },
  { title: "About Us", href: "/about-us" },
  { title: "Leadership", href: "/leadership" },
  { title: "Feedback", href: "/feedback" },
  { title: "Contact", href: "/contact-us" },
  { title: "Education", href: "/education" },
];

export const languages = [
  { title: "India - English", value: "english" },
  { title: "हिन्दी", value: "hindi" },
  { title: "தமிழ்", value: "tamil" },
  { title: "తెలుగు", value: "telugu" },
];

// =============================================================================================
//                                      Main Footer
// =============================================================================================

export const footerNavLinks = [
  { title: "Home", href: "/" },
  { title: "About Us", href: "/about-us" },
  { title: "Leadership", href: "/leadership" },
  { title: "Feedback", href: "/feedback" },
  { title: "Contact", href: "/contact-us" },
  { title: "Education", href: "/education" },
  { title: "Privacy Policy", href: "/privacy-policy" },
  { title: "Terms And Conditions", href: "/terms-and-conditions" },
];

export const socialLinks = [
  {
    image: "/social-logo/facebook.svg",
    url: "https://www.facebook.com/",
    altText: "Facebook",
  },
  {
    image: "/social-logo/x.svg",
    url: "https://www.x.com/",
    altText: "X",
  },
  {
    image: "/social-logo/instagram.svg",
    url: "https://www.instagram.com/",
    altText: "Instagram",
  },
  {
    image: "/social-logo/youtube.svg",
    url: "https://www.youtube.com/",
    altText: "YouTube",
  },
];

// =============================================================================================
//                                      Contact
// =============================================================================================

export const contactDetails = {
  phone: { value: "+91 9111 111 222", href: "tel:+919111111222" },
  email: {
    value: "info@waterwarrors.com",
    href: "mailto:info@waterwarrors.com",
  },
  location: {
    value:
      "Lorem ipsum dolor sit amet, consectetur sectetu ipsum dolor slit Lorem ipsum dolor slit, 564335",
  },
};

// =============================================================================================
//                                      DIY Guides
// =============================================================================================

export interface DIYGuide {
  video_url: string;
  video_thumbnel_url: string;
  titile: string;
  publish_date: string;
  duration: string;
}

export const diy_guides: DIYGuide[] = [
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

// =============================================================================================
//                                      Team Mambers
// =============================================================================================

export interface TeamMember {
  type: "Leadership" | "Technical Advisors";
  slug: "leadership" | "technical_advisors";
  full_name: string;
  job_role: string;
  tag: string[];
  description: string;
  avatar_url: string;
}

const team_members: TeamMember[] = [
  {
    type: "Leadership",
    slug: "leadership",
    full_name: "Rajesh Seshadri",
    job_role: "Founder & CEO",
    tag: ["Environmentalist at heart, IT by profession."],
    description:
      "My commitment to the environment isn't just an interest; it's a calling. After spearheading numerous CSR initiatives—planting trees on a massive scale and building infrastructure to harvest and recharge our precious groundwater—I saw something that changed me. I witnessed the staggering, heartbreaking waste of rainwater in our communities. I knew right then that simply observing the problem wasn't enough; it demanded relentless action. That realization became the catalyst for Water Warriors. Capturing this wasted resource and turning this crisis into a sustainable future isn't just a project for me—it is my life's mission.",
    avatar_url:
      "https://ui-avatars.com/api/?name=Rajesh+Seshadri&size=500&background=215F30&color=ffffff",
  },
  {
    type: "Leadership",
    slug: "leadership",
    full_name: "Jai Prakash",
    job_role: "Chief Technology Officer",
    tag: ["Technology for a sustainable tomorrow."],
    description:
      "Driving technology and innovation to create meaningful environmental impact. Focused on building scalable digital solutions, intelligent systems, and technology-driven strategies that make rainwater harvesting more accessible and effective. At Water Warriors, the goal is to combine technology, innovation, and sustainability to create lasting change.",
    avatar_url:
      "https://ui-avatars.com/api/?name=Jai+Prakash&size=500&background=215F30&color=ffffff",
  },
  {
    type: "Technical Advisors",
    slug: "technical_advisors",
    full_name: "Anand Raju Mudunuri",
    job_role: "Technical Advisor, Water Warriors AI",
    tag: ["Making every drop count."],
    description:
      "Anand takes industrial climate goals from ambition to audited outcomes. With 15+ years of experience, he has advised EU and Indian clients on GHG accounting, disclosure, net-zero strategy and climate risk. He has developed climate adaptation frameworks, delivered capacity building programs, and built tools that became client-facing services. Conceptualization and execution of carbon projects, including mangrove restoration, biogas and plantation, and their subsequent registration under Gold Standard® certification has been his major accomplishment. At Water Warriors AI, he brings this climate and decarbonisation expertise to one purpose: making every drop count.",
    avatar_url:
      "https://ui-avatars.com/api/?name=Anand+Raju+Mudunuri&size=500&background=215F30&color=ffffff",
  },
  {
    type: "Technical Advisors",
    slug: "technical_advisors",
    full_name: "Additional Technical Advisor",
    job_role: "Technical Advisor",
    tag: ["Expertise driving sustainable innovation."],
    description:
      "Bringing technical knowledge and industry insights to support innovative water conservation initiatives. Focused on exploring practical solutions, strengthening technical strategies, and helping communities adopt sustainable rainwater harvesting practices.",
    avatar_url:
      "https://ui-avatars.com/api/?name=Technical+Advisor&size=500&background=215F30&color=ffffff",
  },
];

export const leadership = team_members.filter(
  (member) => member.slug === "leadership",
);

export const technicalAdvisors = team_members.filter(
  (member) => member.slug === "technical_advisors",
);
