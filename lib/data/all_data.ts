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
