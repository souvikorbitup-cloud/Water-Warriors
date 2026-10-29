"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonType =
  | "solid-primary"
  | "solid-secondary"
  | "outline-white"
  | "outline"
  | "underline";

type ShapedType = Extract<ButtonType, "solid-primary" | "solid-secondary">;
type PlainType = Exclude<ButtonType, ShapedType>;

type ButtonSize = "sm" | "md";

interface PrimaryButtonProps {
  children: ReactNode;

  // If href is provided, the button renders as a Link
  href?: string;

  btnType?: ButtonType;
  size?: ButtonSize;

  startIcon?: ReactNode;
  endIcon?: ReactNode;

  onClick?: () => void;
  disabled?: boolean;
  className?: string;

  type?: "button" | "submit" | "reset";

  full?: boolean;
}

/* ------------------------------------------------------------------
   Solid buttons: two-piece shape (label + slanted arrow cap)
------------------------------------------------------------------- */

const shapedSizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 text-sm",
  md: "h-10 text-sm sm:h-11.5",
};

const shapedStyles: Record<ShapedType, { fill: string; text: string }> = {
  "solid-primary": {
    fill: "bg-primary group-hover:bg-primary/90",
    text: "text-primary-foreground",
  },
  "solid-secondary": {
    fill: "bg-secondary group-hover:bg-secondary/90",
    text: "text-heading",
  },
};

/* ------------------------------------------------------------------
   Outline / underline buttons keep the simple pill look
------------------------------------------------------------------- */

const plainSizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-4 py-2 text-sm sm:px-8 sm:py-3",
};

const plainVariantClasses: Record<PlainType, string> = {
  "outline-white":
    "border border-white bg-transparent text-white shadow-none hover:bg-white/5",

  outline:
    "border border-heading bg-transparent text-heading shadow-none hover:bg-black/5",

  underline: "border-b border-heading text-heading rounded-none px-0.5!",
};

const isShaped = (type: ButtonType): type is ShapedType =>
  type === "solid-primary" || type === "solid-secondary";

export default function PrimaryButton({
  children,
  href,
  btnType = "solid-secondary",
  size = "md",
  onClick,
  startIcon,
  endIcon,
  disabled = false,
  className,
  type = "button",
  full = false,
}: PrimaryButtonProps) {
  const shaped = isShaped(btnType);

  const buttonClasses = shaped
    ? cn(
        "group relative inline-flex items-center justify-center font-medium whitespace-nowrap transition-transform duration-300 active:scale-[0.98] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        shapedSizeClasses[size],
        shapedStyles[btnType].text,
        className,
      )
    : cn(
        "group relative inline-flex h-auto items-center justify-center gap-2 rounded-xl text-center font-medium transition-all duration-300 active:translate-y-0 cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        plainSizeClasses[size],
        plainVariantClasses[btnType as PlainType],
        className,
      );

  const content = shaped ? (
    <ShapedContent
      fill={shapedStyles[btnType].fill}
      startIcon={startIcon}
      endIcon={endIcon}
      full={full}
    >
      {children}
    </ShapedContent>
  ) : (
    <>
      {startIcon && (
        <span className="flex shrink-0 items-center">{startIcon}</span>
      )}
      <span>{children}</span>
      {endIcon && <span className="flex shrink-0 items-center">{endIcon}</span>}
    </>
  );

  // Render as Link
  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-disabled={disabled}
        className={cn(
          buttonClasses,
          disabled && "pointer-events-none cursor-not-allowed opacity-50",
        )}
      >
        {content}
      </Link>
    );
  }

  // Render as normal button
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {content}
    </button>
  );
}

/* ------------------------------------------------------------------
   Shaped content: label piece + slanted arrow cap
------------------------------------------------------------------- */

function ShapedContent({
  children,
  fill,
  startIcon,
  endIcon,
  full,
}: {
  children: ReactNode;
  fill: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  full: boolean;
}) {
  const arrow = endIcon ?? (
    <ArrowRight className="size-4.5" strokeWidth={1.5} />
  );

  return (
    <>
      {/* Label piece: rounded left side, slanted right side */}
      <span
        className={`relative flex h-full items-center gap-2 pr-8 pl-6.25 ${full ? "grow justify-center" : ""}`}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 right-7.5 left-0 rounded-l-xl transition-colors duration-300",
            fill,
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 right-2.25 w-12 -skew-x-20 rounded-xl transition-colors duration-300",
            fill,
          )}
        />
        {startIcon && (
          <span className="relative flex shrink-0 items-center">
            {startIcon}
          </span>
        )}
        <span className="relative">{children}</span>
      </span>

      {/* Arrow cap: slanted left side, rounded right side */}
      <span className="relative flex h-full w-13 items-center justify-center pl-2 transition-transform duration-300 group-hover:-translate-x-1">
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 right-0 left-7 rounded-r-xl transition-colors duration-300",
            fill,
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-2.25 w-8.5 -skew-x-20 rounded-l-xl rounded-t-xl transition-colors duration-300",
            fill,
          )}
        />

        {/* Arrow swap: current arrow exits right, a new one enters from the left */}
        <span className="relative flex size-6 items-center justify-center overflow-hidden">
          <span className="flex transition-transform duration-300 ease-out group-hover:translate-x-full">
            {arrow}
          </span>
          <span
            aria-hidden
            className="absolute inset-0 flex -translate-x-full items-center justify-center transition-transform duration-300 ease-out group-hover:translate-x-0"
          >
            {arrow}
          </span>
        </span>
      </span>
    </>
  );
}
