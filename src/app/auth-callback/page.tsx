"use client"

import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { trpc } from "@/app/_trpc/client"


function Page() {
    const router = useRouter()

    const searchParams = useSearchParams()
    const origin = searchParams.get('origin')
    
    trpc.authCallback.useQuery(undefined, {
        onSuccess: ({success}) => {
            if (success) {
                // user is synced to database
                router.push(origin ? `${origin}` : '/dashboard')
            }
        },
        onError: (err) => {
            if (err.data?.code === 'UNAUTHORIZED') {
                // user is not authenticated, force them to sign in
                router.push('/sign-in')
            }
        },
        // retry: true,
        // retryDelay: 500
    })

    return (
        <div className="w-full mt-24 flex justify-center">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-800" />
                <h3 className="font-semibold text-xl">Setting up your account...</h3>
                <p className="text-sm text-zinc-500">You will be redirected soon</p>
            </div>
        </div>
    )
}

export default Page