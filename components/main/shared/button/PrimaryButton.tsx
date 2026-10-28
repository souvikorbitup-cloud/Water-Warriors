"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonType =
  | "solid-primary"
  | "solid-secondary"
  | "outline-white"
  | "outline"
  | "underline";

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
  lifColor?: "dark" | "light" | undefined;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-4 py-2 text-sm sm:px-8 sm:py-3",
};

const variantClasses: Record<ButtonType, string> = {
  "solid-primary":
    "border-0 ring-0 bg-primary text-primary-foreground hover:bg-primary/90 text-white",

  "solid-secondary":
    "border-0 ring-0 bg-secondary text-heading hover:bg-secondary/90",

  "outline-white":
    "border border-white bg-transparent text-white shadow-none hover:bg-white/5",

  outline:
    "border border-heading bg-transparent text-heading shadow-none hover:bg-black/5",

  underline: "border-b border-heading text-heading rounded-none px-0.5!",
};

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
  lifColor,
}: PrimaryButtonProps) {
  const buttonClasses = cn(
    "inline-flex h-auto items-center justify-center gap-2 rounded-full text-center font-medium transition-all duration-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 relative group overflow-hidden cursor-pointer",
    sizeClasses[size],
    variantClasses[btnType],
    className,
  );
  const iconClasses =
    "transition-all duration-300 absolute -bottom-8 right-0 rotate-57 group-hover:-bottom-3 group-hover:rotate-20";

  const iColor = lifColor && lifColor === "dark" ? "#215F30" : "#ffffff";

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
        {startIcon && (
          <span className="flex shrink-0 items-center">{startIcon}</span>
        )}
        <span>{children}</span>
        {endIcon && (
          <span className="flex shrink-0 items-center">{endIcon}</span>
        )}
        {lifColor && (
          <span className={iconClasses}>
            <SvgIcon iconColor={iColor} />
          </span>
        )}
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
      {startIcon && (
        <span className="flex shrink-0 items-center">{startIcon}</span>
      )}
      <span>{children}</span>
      {endIcon && <span className="flex shrink-0 items-center">{endIcon}</span>}
      {lifColor && (
        <span className={iconClasses}>
          <SvgIcon iconColor={iColor} />
        </span>
      )}
    </button>
  );
}

const SvgIcon = ({ iconColor }: { iconColor: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="31"
      height="44"
      viewBox="0 0 31 44"
      fill="none"
    >
      <path
        d="M26.8578 1.20944C26.7826 1.13276 26.5315 0.991704 26.3031 0.844341C25.7993 0.518116 25.3506 0.0497561 24.7083 0.00855926C23.4442 -0.0718854 22.7054 0.408343 21.878 1.12241C20.7547 2.0894 19.676 3.15313 18.5668 4.26539C18.4317 4.40433 17.8319 5.02683 17.7118 5.20169C17.5871 5.37561 17.6656 5.52307 17.6956 5.65188C17.9008 6.55907 18.5446 8.12754 18.9306 8.86572C20.3369 11.5383 22.0064 13.4782 23.754 15.8852C23.8293 15.9904 23.9177 16.1048 23.8832 16.1745C23.8488 16.2441 23.6648 15.9941 23.6388 15.9581C23.1353 15.2836 22.7152 14.7116 22.1032 14.0347C22.0861 14.018 22.0275 13.833 21.8557 13.6731C21.4248 13.2719 20.9107 12.6653 20.4196 12.1949C18.9879 10.8206 17.5862 9.48966 16.418 7.88431C16.3863 7.84279 16.5097 7.76719 16.266 7.84672C16.0222 7.92625 15.3497 8.37836 15.2186 8.61013C14.2078 10.4369 14.0425 12.6093 11.9596 13.3652C11.2647 13.6178 10.2111 13.4576 9.82278 14.0225C8.92417 15.3289 9.86972 17.0947 9.43847 18.6564C9.11776 19.8134 7.87194 20.4443 7.67317 21.7555C7.53831 22.6415 7.79385 23.7364 7.43209 24.5192C8.3317 26.8343 9.01979 29.0932 10.7846 31.243C11.4288 32.0295 12.0836 32.1718 12.8325 32.6795C12.8899 32.7175 12.9696 32.7097 12.9928 32.7999C11.1051 31.9174 9.7429 30.8881 8.44703 29.0946C7.8089 27.777 7.19568 26.4624 6.57213 25.1412C5.41826 25.5806 4.27432 25.9869 3.51118 26.8915C2.93999 27.5702 2.75572 28.5185 2.38156 29.3426C3.31762 31.2094 4.60261 32.843 5.89095 34.6043C6.20903 35.0416 6.47056 35.52 6.69754 35.9825C6.2676 35.472 5.93257 34.8582 5.50654 34.355C4.33116 32.9738 3.01043 31.7821 1.67969 30.5664C1.40366 30.7248 1.11 31.5916 1.05152 31.7943C0.730745 32.8944 0.737334 33.8859 0.49444 34.923C-3.12813 50.417 14.8281 37.5198 0.405616 42.4192C0.669365 42.9637 0.706312 43.1881 1.35294 43.3332C1.64671 43.4019 2.01766 43.1402 2.28314 43.0782C2.9397 42.9164 3.71699 42.7902 4.42147 42.7959C5.93615 42.8069 7.33061 43.4551 8.837 43.3834C11.0282 43.2805 12.5366 42.4994 14.1024 41.2941C14.8382 40.7257 16.1146 40.3201 16.7429 39.4799C19.2827 36.086 19.118 38.1226 21.2 36.6474C23.0814 35.3115 24.0067 32.8538 25.0796 30.8206C26.3893 28.3415 26.1605 29.525 26.8206 26.8622C26.9421 26.3721 26.9367 26.0183 27.0928 25.5726C27.517 24.349 28.5543 23.4762 29.1805 22.4385C30.3276 20.5343 30.8252 18.5108 31.0032 16.0343C31.0047 16.0215 31.0064 15.9912 30.9893 15.9745C30.7457 15.7138 30.4078 14.9787 30.7101 15.0807C30.45 12.8325 30.1524 10.5657 29.6899 8.26307C29.2274 5.96045 29.0125 3.44323 26.8703 1.22513L26.8578 1.20944Z"
        fill={iconColor}
      />
    </svg>
  );
};
