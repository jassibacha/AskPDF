import { type ClassValue, clsx } from "clsx"
import { Metadata } from "next";
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
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${path}`

  // If the VERCEL_URL environment variable is not set, use localhost as the base URL for development SSR
  return `http://localhost:3000${path}`
}

export function constructMetadata({
  title = "AskPDF - AI-Powered PDF Generator",
  description = "AskPDF is a free and open-source PDF analyzer powered by AI.",
  image = "/social-img.jpg", // TODO: Update this
  icons = "/favicon.ico", // TODO: Update this
  noIndex = true,
}: {
  title?: string
  description?: string
  image?: string
  icons?: string
  noIndex?: boolean
} = {}): Metadata {

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      //type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: '@jassibacha'
    },
    icons,
    metadataBase: new URL("https://askpdf.jbdev.ca"),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false
      },
    })
  }
}

export function generateViewport() {
  return {
    themeColor: '#FFF',
  };
}