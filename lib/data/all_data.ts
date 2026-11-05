// =============================================================================================
//                                      Main Navbar
// =============================================================================================

export const navLinks = [
  { titleKey: "home", href: "/" },
  { titleKey: "aboutUs", href: "/about-us" },
  { titleKey: "leadership", href: "/leadership" },
  { titleKey: "feedback", href: "/feedback" },
  { titleKey: "contact", href: "/contact-us" },
  { titleKey: "education", href: "/education" },
] as const;

// =============================================================================================
//                                      Main Footer
// =============================================================================================

export const footerNavLinks = [
  { titleKey: "home", href: "/" },
  { titleKey: "aboutUs", href: "/about-us" },
  { titleKey: "leadership", href: "/leadership" },
  { titleKey: "feedback", href: "/feedback" },
  { titleKey: "contact", href: "/contact-us" },
  { titleKey: "education", href: "/education" },
  { titleKey: "privacyPolicy", href: "/privacy-policy" },
] as const;

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
};

// =============================================================================================
//                                      DIY Guides
// =============================================================================================

export interface DIYGuide {
  video_url: string;
  video_thumbnel_url: string;
  translationKey: "0" | "1" | "2" | "3" | "4";
  publish_date: string;
  duration: number;
}

export const diy_guides: DIYGuide[] = [
  {
    video_url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    video_thumbnel_url:
      "https://img.youtube.com/vi/ScMzIvxBSi4/maxresdefault.jpg",
    translationKey: "0",
    publish_date: "2026-10-15",
    duration: 10,
  },
  {
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    video_thumbnel_url:
      "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
    translationKey: "1",
    publish_date: "2026-10-10",
    duration: 8,
  },
  {
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    video_thumbnel_url:
      "https://img.youtube.com/vi/ysz5S6PUM-U/maxresdefault.jpg",
    translationKey: "2",
    publish_date: "2026-09-28",
    duration: 12,
  },
  {
    video_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    video_thumbnel_url:
      "https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg",
    translationKey: "3",
    publish_date: "2026-09-20",
    duration: 6,
  },
  {
    video_url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
    video_thumbnel_url:
      "https://img.youtube.com/vi/LXb3EKWsInQ/maxresdefault.jpg",
    translationKey: "4",
    publish_date: "2026-09-12",
    duration: 15,
  },
];

// =============================================================================================
//                                      Team Mambers
// =============================================================================================

export interface TeamMember {
  type: "Leadership" | "Technical Advisors";
  slug: "leadership" | "technical_advisors";
  translationKey:
    | "rajeshSeshadri"
    | "jaiPrakash"
    | "anandRajuMudunuri"
    | "subashChandraReddy";
  full_name: string;
  avatar_url: string;
}

const team_members: TeamMember[] = [
  {
    type: "Leadership",
    slug: "leadership",
    translationKey: "rajeshSeshadri",
    full_name: "Rajesh Seshadri",
    avatar_url: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    type: "Leadership",
    slug: "leadership",
    translationKey: "jaiPrakash",
    full_name: "Jai Prakash",
    avatar_url: "https://randomuser.me/api/portraits/men/65.jpg",
  },
  {
    type: "Technical Advisors",
    slug: "technical_advisors",
    translationKey: "anandRajuMudunuri",
    full_name: "Anand Raju Mudunuri",
    avatar_url: "https://randomuser.me/api/portraits/men/50.jpg",
  },
  {
    type: "Technical Advisors",
    slug: "technical_advisors",
    translationKey: "subashChandraReddy",
    full_name: "Subash Chandra Reddy",
    avatar_url: "https://randomuser.me/api/portraits/men/55.jpg",
  },
];

export const leadership = team_members.filter(
  (member) => member.slug === "leadership",
);

export const technicalAdvisors = team_members.filter(
  (member) => member.slug === "technical_advisors",
);
