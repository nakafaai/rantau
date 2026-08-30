import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges conditional Tailwind class names into one stable class string. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
