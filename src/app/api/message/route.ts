import { db } from "@/db"
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/dist/types/server"
import { NextRequest } from "next/server"

export const POST = async (request: NextRequest) => {
    // Endpoint for asking a question to a pdf file
    const body = await request.json()

    const { getUser } = getKindeServerSession()
    const user = await getUser()

    const userId = user?.id

    if (!userId) return new Response('Unauthorized', { status: 401 })

    const { fileId, message } = SendMessageValidator.parse(body)

    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId
        },
    })

    if (!file) return new Response('File not found', { status: 404 })

    await db.message.create({
        data: {
            text: message,
            isUserMessage: true,
            userId,
            fileId
        }
    })

    //
}