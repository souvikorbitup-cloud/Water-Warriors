"use client";

import { useTranslations } from "next-intl";
import { MapPin, Mail, Phone, X } from "lucide-react";

import { Logo, LogoLight } from "@/components/icons";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { contactDetails, navLinks } from "@/lib/data/all_data";
import LanguageSwitcher from "./LanguageSwitcher";

type MainNavbarProps = {
  type?: "dark" | "light";
};

export default function MainNavbar({ type = "light" }: MainNavbarProps) {
  const pathname = usePathname();
  const t = useTranslations("Common");

  return (
    <header
      className={`relative z-50 ${type === "light" ? "bg-transparent" : "bg-white border-b border-b-[#C9C9C9]"}`}
    >
      <div className="px-2.5 sm:px-4 grid grid-cols-[1fr_auto_1fr] items-center py-4 sm:py-5">
        {/* Left: slide-over menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={t("openMenu")}
              className="flex size-10 items-center justify-center justify-self-start rounded-md text-background transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="14"
                viewBox="0 0 18 14"
                fill="none"
              >
                <path
                  d="M1 1H17M1 7H17M1 13H8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke={`${type === "light" ? "#fff" : "#202020"}`}
                  className="group-hover:stroke-primary transition"
                />
              </svg>
            </button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-full! max-w-full gap-0 overflow-y-auto bg-background p-0 sm:max-w-100 [&>button.absolute]:hidden"
          >
            <SheetTitle className="sr-only">{t("mainMenu")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("siteNavigation")}
            </SheetDescription>

            {/* Header: logo + close */}
            <div className="relative flex items-center justify-center px-4 pt-5 pb-6">
              <Link href="/">
                <Logo className="h-auto w-20 md:w-25" />
              </Link>
              <SheetClose asChild>
                <button
                  type="button"
                  aria-label={t("closeMenu")}
                  className="absolute top-5 right-5 flex size-6 items-center justify-center rounded-full border border-muted-foreground text-heading transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </SheetClose>
            </div>

            {/* Links */}
            <nav aria-label={t("mainNavigation")} className="px-6 pt-3">
              <ul className="flex flex-col gap-2 md:gap-3">
                {navLinks.map(({ titleKey, href }) => {
                  const isActive = pathname === href;
                  return (
                    <li key={href}>
                      <SheetClose asChild>
                        <Link
                          href={href}
                          aria-current={isActive ? "page" : undefined}
                          className={`block py-2 text-sm md:text-base transition-colors hover:text-primary ${
                            isActive
                              ? "font-semibold text-primary"
                              : "font-normal text-heading"
                          }`}
                        >
                          {t(titleKey)}
                        </Link>
                      </SheetClose>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <hr className="mx-4 mt-6 border-t border-heading/80" />

            {/* Contact */}
            <div className="px-6 pt-8 pb-10">
              <h2 className="text-xl md:text-2xl font-normal">
                {t("contactUs")}
              </h2>

              <ul className="mt-3 md:mt-5 flex flex-col gap-3 md:gap-5 text-base text-heading">
                <li>
                  <a
                    href={contactDetails.phone.href}
                    className="flex items-center gap-3 hover:text-primary text-sm md:text-base"
                  >
                    <Phone className="size-4 md:size-5 shrink-0" />
                    {contactDetails.phone.value}
                  </a>
                </li>
                <li>
                  <a
                    href={contactDetails.email.href}
                    className="flex items-center gap-3 break-all hover:text-primary text-sm md:text-base"
                  >
                    <Mail className="size-4 md:size-5 shrink-0" />
                    {contactDetails.email.value}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 md:size-5 shrink-0" />
                  <span className="text-sm md:text-base">
                    {t("officeLocation")}
                  </span>
                </li>
              </ul>
            </div>
          </SheetContent>
        </Sheet>

        {/* Center: logo */}
        <Link
          href="/"
          aria-label={t("logoHome")}
          className="justify-self-center"
        >
          {type === "light" ? (
            <LogoLight className={`h-auto w-18 sm:w-20 md:w-25`} />
          ) : (
            <Logo className={`h-auto w-18 sm:w-20 md:w-25`} />
          )}
        </Link>

        {/* Right: language dropdown */}
        <LanguageSwitcher type={type} />
      </div>
    </header>
  );
}
