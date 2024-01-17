import { db } from "@/db"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import Dashboard from "@/components/Dashboard"
import { getUserSubscriptionPlan } from "@/lib/stripe"


async function Page() {
    const {getUser} = getKindeServerSession()
    const user = await getUser()

    if (!user || !user.id) {
        redirect('/auth-callback?origin=dashboard')
    }

    const dbUser = await db.user.findFirst({
        where: {
            id: user.id
        }
    })

    if (!dbUser) {
        redirect('/auth-callback?origin=dashboard')
    }

    const subscriptionPlan = await getUserSubscriptionPlan()

    return (
        <div><Dashboard subscriptionPlan={subscriptionPlan} /></div>
    )
}

export default Page