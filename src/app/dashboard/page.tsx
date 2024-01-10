import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"


async function Dashboard() {
    const {getUser} = getKindeServerSession()
    //console.log('dashboard: awaiting getUser')
    const user = await getUser()
    //console.log('dashboard, user:', user)

    //console.log('user: ', user)

    if (!user || !user.id) {
        //console.log ('dashboard error: user cant be found')
        redirect('/auth-callback?origin=dashboard')
    } else {
        //console.log('dashboard: user found')
    }

    return (
        <div>test {user.email}</div>
    )
}

export default Dashboard