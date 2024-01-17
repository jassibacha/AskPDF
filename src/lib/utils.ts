import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class values into a single class string.
 * 
 * @param inputs - The class values to be combined.
 * @returns The combined class string.
 */
export function cn(...inputs: ClassValue[]) {
  // Merge the class values using the clsx library
  return twMerge(clsx(inputs))
}

/**
 * Generate an absolute URL based on the provided path.
 * 
 * @param {string} path - The relative path to be converted to an absolute URL.
 * @returns {string} The absolute URL.
 */
export function absoluteUrl(path: string) {
  // If we're on the client side, return the relative path
  if (typeof window !== "undefined") return path;

  // If the VERCEL_URL environment variable is set, use it to construct the absolute URL
  if (process.env.VERCEL_URL) return `${process.env.VERCEL_URL}${path}`

  // If the VERCEL_URL environment variable is not set, use localhost as the base URL for development SSR
  return `http://localhost:3000${path}`
}
