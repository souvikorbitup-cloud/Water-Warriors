import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import Loding from "@/components/main/shared/loading/Loding";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bakahu.com"),

  title: {
    default: "Water Warriors AI | Healthy Food Rooted in Nature",
    template: "%s | Water Warriors AI",
  },

  description:
    "Discover wholesome, nutritious, and sustainably sourced food from Water Warriors AI. Supporting farmers, reducing food waste, and bringing natural goodness to every home.",

  keywords: ["Water Warriors AI"],

  authors: [{ name: "Water Warriors AI" }],
  creator: "Water Warriors AI",

  openGraph: {
    title: "Water Warriors AI | Healthy Food Rooted in Nature",
    description:
      "Wholesome, nutritious, and sustainably sourced food that supports farmers, reduces waste, and brings natural goodness to your table.",
    url: "https://bakahu.com",
    siteName: "Water Warriors AI",
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Water Warriors AI | Healthy Food Rooted in Nature",
    description:
      "Wholesome, nutritious, and sustainably sourced food that supports farmers and brings natural goodness to every home.",
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        montserrat.variable,
        poppins.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full bg-white flex flex-col">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">
              <Loding />
            </div>
          }
        >
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Suspense>
      </body>
    </html>
  );
}
