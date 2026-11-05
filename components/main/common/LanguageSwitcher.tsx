"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Globe } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

type LanguageSwitcherProps = {
  type?: "dark" | "light";
};

export default function LanguageSwitcher({
  type = "light",
}: LanguageSwitcherProps) {
  const t = useTranslations("LanguageSwitcher");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(nextLocale: AppLocale) {
    const suffix = `${window.location.search}${window.location.hash}`;
    const href = `${pathname}${suffix}`;
    router.replace(href, { locale: nextLocale });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={tCommon("selectLanguage")}
          className={`flex items-center gap-1.5 justify-self-end rounded-md px-1 py-2 text-sm ${type === "light" ? "text-background" : "text-foreground"} transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:text-base cursor-pointer ring-0!`}
        >
          <Globe className="size-5" />
          <span className="hidden sm:inline">{t(locale)}</span>
          <ChevronDown className="size-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="min-w-40 rounded-2xl border-0 bg-popover p-3 shadow-xl"
      >
        {routing.locales.map((item) => {
          const isActive = item === locale;
          return (
            <DropdownMenuItem
              key={item}
              onSelect={() => switchLocale(item)}
              className={`cursor-pointer justify-center rounded-lg py-2.5 text-base focus:bg-muted ${
                isActive
                  ? "font-semibold text-primary focus:text-primary"
                  : "font-normal text-heading"
              }`}
            >
              {t(item)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
