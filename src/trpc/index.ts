import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";
import { privateProcedure, publicProcedure, router } from "./trpc";

export const appRouter = router({
    authCallback: publicProcedure.query(async () => {

        //console.log('authCallback trpc route firing')
        const { getUser } = getKindeServerSession()
        //console.log('authCallback: awaiting getUser')
        const user = await getUser()
        //console.log('authCallback, user:', user)

        if (!user || !user.id || !user.email) throw new TRPCError({ code: 'UNAUTHORIZED' })

        // if (user.id) {
        //     console.log('User id found', user.id)
        // }

        // Check if user exists in database
        const dbUser = await db.user.findFirst({
            where: {
                id: user.id
            }
        })

        // User doesn't exist in db, create user in db
        if (!dbUser) {
            //console.log('dbUser not found')
            await db.user.create({
                data: {
                    id: user.id,
                    email: user.email
                }
            })
        } else {
            //console.log('dbUser found', dbUser.email)
        }

        return { success: true }
    }),
    getUserFiles: privateProcedure.query(async ({ctx}) => {
        const { userId } = ctx

        return await db.file.findMany({
            where: {
                userId
            }
        })
    })
})

export type AppRouter = typeof appRouter;