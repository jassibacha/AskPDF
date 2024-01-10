import { PrismaClient } from '@prisma/client'

// Extending the global Node.js namespace to include a variable for caching the PrismaClient
declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient
}

// Declare a variable to hold the Prisma client instance
let prisma: PrismaClient

// Check if the environment is production
if (process.env.NODE_ENV === 'production') {
  // In production, always create a new PrismaClient instance
  prisma = new PrismaClient()
} else {
  // In development or other non-production environments
  if (!global.cachedPrisma) {
    // If the global PrismaClient instance isn't already created, create and cache it
    global.cachedPrisma = new PrismaClient()
  }
  // Use the cached PrismaClient instance
  prisma = global.cachedPrisma
}

// Export the Prisma client instance for use throughout the application
export const db = prisma
