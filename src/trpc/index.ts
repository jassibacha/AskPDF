import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { absoluteUrl } from "@/lib/utils";
import { getUserSubscriptionPlan, stripe } from "@/lib/stripe";
import { PLANS } from "@/config/stripe";

export const appRouter = router({
    authCallback: publicProcedure.query(async () => {
        // Get the user from the KindeServer session
        const { getUser } = getKindeServerSession()
        const user = await getUser()
    
        // If the user is not authenticated, throw an error
        if (!user || !user.id || !user.email) throw new TRPCError({ code: 'UNAUTHORIZED' })
    
        // Check if user exists in the database
        const dbUser = await db.user.findFirst({
            where: {
                id: user.id
            }
        })
    
        // If the user doesn't exist in the database, create a new user
        if (!dbUser) {
            await db.user.create({
                data: {
                    id: user.id,
                    email: user.email
                }
            })
        }
    
        // Return a success response
        return { success: true }
    }),
    // Get user files from the database
    getUserFiles: privateProcedure.query(async ({ ctx }) => {
        // Extract the user ID from the context
        const { userId } = ctx
    
        // Query the database for files belonging to the user
        return await db.file.findMany({
            where: {
                userId
            }
        })
    }),
    /**
     * Creates a Stripe session for managing billing
     * @param ctx - The context object containing user information
     * @returns The URL of the Stripe session
     * @throws TRPCError with code 'UNAUTHORIZED' if the user is not authenticated or authorized
     */
    createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
        const { userId } = ctx

        const billingUrl = absoluteUrl("/dashboard/billing")

        if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

        // Retrieve the user from the database
        const dbUser = await db.user.findFirst({
            where: {
                id: userId
            }
        })

        if (!dbUser) throw new TRPCError({ code: 'UNAUTHORIZED' })

        // Get the user's subscription plan
        const subscriptionPlan = await getUserSubscriptionPlan()
        
        if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
            // Create a billing portal session if the user is already subscribed and has a Stripe customer ID
            const stripeSession = await stripe.billingPortal.sessions.create({
                customer: dbUser.stripeCustomerId,
                return_url: billingUrl
            })

            return { url: stripeSession.url }
        }

        // Create a checkout session for the user to subscribe to the "Pro" plan
        const stripeSession = await stripe.checkout.sessions.create({
            success_url: billingUrl,
            cancel_url: billingUrl,
            payment_method_types: ['card'], // Don't think PayPal is an option for Canada Testing
            mode: 'subscription',
            billing_address_collection: 'auto',
            line_items: [
                {
                    price: PLANS.find((plan) => plan.name === "Pro")?.price.priceIds.test, // Will need to swap to production
                    quantity: 1
                }
            ],
            metadata: {
                userId: userId
            }
        })

        return { url: stripeSession.url }
    }),
    getFileMessages: privateProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).nullish(),
                cursor: z.string().nullish(),
                fileId: z.string()
            })
        ).query(async ({ ctx, input }) => {
            const { userId } = ctx
            const { fileId, cursor } = input
            const limit = input.limit ?? INFINITE_QUERY_LIMIT

            const file = await db.file.findFirst({
                where: {
                    id: fileId,
                    userId
                }
            })

            if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

            const messages = await db.message.findMany({
                take: limit + 1,
                where: {
                    fileId
                },
                orderBy: {
                    createdAt: "desc"
                },
                cursor: cursor ? { id: cursor } : undefined,
                select: {
                    id: true,
                    isUserMessage: true,
                    createdAt: true,
                    text: true
                }
            })

            let nextCursor: typeof cursor | undefined = undefined

            if (messages.length > limit) {
                const nextItem = messages.pop()
                nextCursor = nextItem?.id
            }

            return {
                messages,
                nextCursor
            }
        }),
    getFileUploadStatus: privateProcedure.input(
        z.object({fileId: z.string()})
    ).query(async ({ ctx, input}) => {
        const file = await db.file.findFirst({
            where: {
                id: input.fileId,
                userId: ctx.userId
            },
        })

        if (!file) return { status: "PENDING" as const}

        return { status: file.uploadStatus }
    }),
    getFile: privateProcedure.input(
        z.object({ key: z.string() })
    ).mutation(async ({ ctx, input }) => {
        const { userId } = ctx

        const file = await db.file.findFirst({
            where: {
                key: input.key,
                userId
            }
        })

        if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

        return file
    }),
    deleteFile: privateProcedure.input(
        z.object({ id: z.string() })
    ).mutation(async ({ ctx, input }) => {
        const { userId } = ctx

        const file = await db.file.findFirst({
            where: {
                id: input.id,
                userId,
            },
        })

        if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

        await db.file.delete({
            where: {
                id: input.id
            }
        })

        return file
    }),
})

export type AppRouter = typeof appRouter;