import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"


function Dashboard() {
    const {getUser} = getKindeServerSession()
    const user = getUser()

    //console.log('user: ', user)

    if (!user || !user.id) redirect('/auth-callback?origin=dashboard')

    return (
        <div>test {user.email}</div>
    )
}

export default Dashboard