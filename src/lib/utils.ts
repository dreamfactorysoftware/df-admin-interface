import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging Tailwind CSS classes with clsx
 * Handles conditional classes and prevents conflicts through tailwind-merge
 * 
 * @param inputs - Class values to merge (strings, objects, arrays, etc.)
 * @returns Merged class string with conflicts resolved
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}