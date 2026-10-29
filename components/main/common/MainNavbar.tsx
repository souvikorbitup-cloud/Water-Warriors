"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Globe, MapPin, Mail, Menu, Phone, X } from "lucide-react";

import Logo from "@/components/icons/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { contactDetails, languages, navLinks } from "@/lib/data/all_data";
import LogoLight from "@/components/icons/LogoLight";

type MainNavbarProps = {
  type?: "dark" | "light";
};

export default function MainNavbar({ type = "light" }: MainNavbarProps) {
  const pathname = usePathname();
  const [language, setLanguage] = useState(languages[0]);

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
              aria-label="Open menu"
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
            <SheetTitle className="sr-only">Main menu</SheetTitle>
            <SheetDescription className="sr-only">
              Site navigation and contact details
            </SheetDescription>

            {/* Header: logo + close */}
            <div className="relative flex items-center justify-center px-4 pt-5 pb-6">
              <Link href="/">
                <Logo className="h-auto w-20 md:w-25" />
              </Link>
              <SheetClose asChild>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="absolute top-5 right-5 flex size-6 items-center justify-center rounded-full border border-muted-foreground text-heading transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </SheetClose>
            </div>

            {/* Links */}
            <nav aria-label="Main" className="px-6 pt-3">
              <ul className="flex flex-col gap-2 md:gap-3">
                {navLinks.map(({ title, href }) => {
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
                          {title}
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
              <h2 className="text-xl md:text-2xl font-normal">Contact Us</h2>

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
                    {contactDetails.location.value}
                  </span>
                </li>
              </ul>
            </div>
          </SheetContent>
        </Sheet>

        {/* Center: logo */}
        <Link
          href="/"
          aria-label="Water Warriors AI home"
          className="justify-self-center"
        >
          {type === "light" ? (
            <LogoLight className={`h-auto w-18 sm:w-20 md:w-25`} />
          ) : (
            <Logo className={`h-auto w-18 sm:w-20 md:w-25`} />
          )}
        </Link>

        {/* Right: language dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Select language"
              className={`flex items-center gap-1.5 justify-self-end rounded-md px-1 py-2 text-sm ${type === "light" ? "text-background" : "text-foreground"} transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:text-base cursor-pointer ring-0!`}
            >
              <Globe className="size-5" />
              <span className="hidden sm:inline">{language.title}</span>
              <ChevronDown className="size-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="min-w-40 rounded-2xl border-0 bg-popover p-3 shadow-xl"
          >
            {languages.map((lang) => {
              const isActive = lang.value === language.value;
              return (
                <DropdownMenuItem
                  key={lang.value}
                  onSelect={() => setLanguage(lang)}
                  className={`cursor-pointer justify-center rounded-lg py-2.5 text-base focus:bg-muted ${
                    isActive
                      ? "font-semibold text-primary focus:text-primary"
                      : "font-normal text-heading"
                  }`}
                >
                  {lang.title}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
