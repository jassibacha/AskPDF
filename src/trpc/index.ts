import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
    authCallback: publicProcedure.query(async () => {
        const { getUser } = getKindeServerSession()
        const user = await getUser() // Had to add await here

        if (!user || !user.id || !user.email) throw new TRPCError({ code: 'UNAUTHORIZED' })

        // Check if user exists in database
        const dbUser = await db.user.findFirst({
            where: {
                id: user.id
            }
        })

        // User doesn't exist in db, create user in db
        if (!dbUser) {
            await db.user.create({
                data: {
                    id: user.id,
                    email: user.email
                }
            })
        }

        return { success: true }
    })
})

export type AppRouter = typeof appRouter;