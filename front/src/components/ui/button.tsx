"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "main" | "outline" | "ghost" | "menu-item";
type ButtonSize = "sm" | "md" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-main text-white hover:opacity-90",
  main: "bg-main text-white transition-colors duration-200 hover:bg-main/80 focus-visible:bg-main/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-60 disabled:hover:bg-main disabled:focus-visible:bg-main",
  outline:
    "border bg-transparent hover:bg-gray-200 dark:bg-dark-500 dark:text-white dark:hover:bg-gray-800",
  ghost: "hover:bg-muted",
  "menu-item": "w-full justify-start hover:bg-gray-200 dark:hover:bg-gray-700",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2 text-base",
  icon: "p-2",
};

const joinClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

export const Button = ({
  variant = "default",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={joinClasses(
        "inline-flex items-center justify-center rounded-md cursor-pointer transition-colors duration-200 bg-white dark:bg-dark-500",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
};
