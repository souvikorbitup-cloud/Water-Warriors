import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type BreadcrumbColor = "dark" | "light";

type BreadcrumbAlign = "left" | "center" | "right";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];

  color?: BreadcrumbColor;
  align?: BreadcrumbAlign;

  className?: string;
}

const breadcrumbVariants: Record<BreadcrumbColor, string> = {
  dark: "border-heading bg-white/15 text-heading",
  light: "border-white/50 bg-white/10 text-white",
};

const breadcrumbAlignments: Record<BreadcrumbAlign, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

export default function Breadcrumb({
  items,
  color = "dark",
  align = "center",
  className,
}: BreadcrumbProps) {
  const t = useTranslations("Common");

  return (
    <nav
      aria-label={t("breadcrumb")}
      className={cn(
        "mb-3 sm:mb-6 inline-flex rounded-full px-4 py-1.5 font-body text-xs sm:text-sm backdrop-blur-sm md:px-5",
        breadcrumbVariants[color],
        className,
      )}
    >
      <ol
        className={cn("flex items-center gap-2", breadcrumbAlignments[align])}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-2"
            >
              {index > 0 && (
                <span
                  className={cn(
                    "flex items-center",
                    color === "dark" ? "text-heading/60" : "text-white/60",
                  )}
                >
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              )}

              {isLast || !item.href ? (
                <span className="font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "transition-colors",
                    color === "dark"
                      ? "text-heading hover:text-primary"
                      : "text-white hover:text-card-bg",
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
