import { ReactNode, createContext, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/app/_trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";

type StreamResponse = {
    addMessage: () => void,
    message: string,
    handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void,
    isLoading: boolean
}

export const ChatContext = createContext<StreamResponse>({
    addMessage: () => {},
    message: '',
    handleInputChange: () => {},
    isLoading: false
})

interface Props {
    fileId: string,
    children: ReactNode
}

export const ChatContextProvider = ({ fileId, children }: Props) => {
    const [message, setMessage] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)

    // useContext() became useUtils()
    const utils = trpc.useContext()

    const {toast} = useToast()

    // Saving the message temporarily in case there's an issue in stream
    const backupMessage = useRef('')

    const { mutate: sendMessage } = useMutation({
        mutationFn: async ({ message }: { message: string }) => {
            const response = await fetch('/api/message', {
                method: "POST",
                body: JSON.stringify({
                    fileId,
                    message
                })
            })

            if (!response.ok) {
                throw new Error('Failed to send message')
            }

            return response.body
        },
        // Optimistic Update: Called as soon as we press 'send' 
        onMutate: async ({ message}) => {
            backupMessage.current = message // Save the message temporarily
            setMessage('') // Reset the message

            // Step 1: Cancel outgoing refetches while we optimistically update
            await utils.getFileMessages.cancel()

            // Step 2: 
            const previousMessages = utils.getFileMessages.getInfiniteData()

            // Step 3: 
            utils.getFileMessages.setInfiniteData(
                {fileId, limit: INFINITE_QUERY_LIMIT},
                (old) => {
                    if (!old) {
                        return {
                            pages: [],
                            pageParams: []
                        }
                    }

                    let newPages = [...old.pages]
                    let latestPage = newPages[0]!

                    latestPage.messages = [
                        {
                            createdAt: new Date().toISOString(),
                            id: crypto.randomUUID(),
                            text: message,
                            isUserMessage: true
                        },
                        ...latestPage.messages
                    ]

                    newPages[0] = latestPage

                    return {
                        ...old,
                        pages: newPages
                    }
                }
            )

            setIsLoading(true)

            return {
                previousMessages: previousMessages?.pages.flatMap((page) => page.messages) ?? []
            }
        },
        onSuccess: async (stream) => {
            setIsLoading(false)

            // If there's no stream, we didn't get a message back from GPT
            if (!stream) {
                return toast({
                    title: 'There was a problem sending this message',
                    description: 'Please refresh the page and try again',
                    variant: 'destructive'
                })
            }

            // We have a message, let's get it in chunks
            const reader = stream.getReader()
            const decoder = new TextDecoder()
            let done = false
            // Accumulated Response
            let accResponse = ''

            while (!done) {
                const { value, done: doneReading } = await reader.read()
                done = doneReading
                const chunkValue = decoder.decode(value)
                accResponse += chunkValue

                // Append the chunk to the actual message
                utils.getFileMessages.setInfiniteData(
                    {fileId, limit: INFINITE_QUERY_LIMIT},
                    (old) => {
                        if (!old) {
                            return {
                                pages: [],
                                pageParams: []
                            }
                        }

                        // Check if the last message has an id of "ai-response", if not, create a new ai message
                        let isAiResponseCreated = old.pages.some(
                            (page) => page.messages.some((message) => message.id === "ai-response")
                        )

                        let updatedPages = old.pages.map((page) => {
                            // check if page is the first page (which contains the last message, that we care about)
                            if (page === old.pages[0]) {
                                let updatedMessages

                                // If the last message isn't  an ai-response, we need to create a new one
                                if (!isAiResponseCreated) {
                                    updatedMessages = [
                                        {
                                            createdAt: new Date().toISOString(),
                                            id: "ai-response",
                                            text: accResponse,
                                            isUserMessage: false
                                        },
                                        ...page.messages
                                    ]
                                } else {
                                    // Else there already is an ai message for last message, so we can just update it
                                    updatedMessages = page.messages.map((message) => {
                                        // If this is the last message, update it with the new response
                                        if (message.id === "ai-response") {
                                            return {
                                                ...message,
                                                text: accResponse
                                            }
                                        }

                                        // Otherwise, leave it as it is
                                        return message
                                    })
                                }

                                return {
                                    ...page, 
                                    messages: updatedMessages
                                }
                            }

                            return page
                        })

                        return {...old, pages: updatedPages}
                    }
                )
            }

        },
        onError: (_, __, context) => {
            // Something went wrong, let's put the text back into the textarea field
            setMessage(backupMessage.current)
            utils.getFileMessages.setData(
                {fileId}, 
                {messages: context?.previousMessages ?? []}
            )
        },
        onSettled: async () => {
            // If it fails or succeeds, run this
            setIsLoading(false)
            // Refresh the entire data 
            await utils.getFileMessages.invalidate({fileId})
        }
    })

    const addMessage = () => sendMessage({ message })

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(event.target.value)
    }
    


    return (
        <ChatContext.Provider value={{
            addMessage,
            message,
            handleInputChange,
            isLoading
        }}>
            {children}
        </ChatContext.Provider>
    )
}