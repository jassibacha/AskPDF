"use client"
import { useState } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog"

 // client component

function UploadButton() {
    const [isOpen, setIsOpen] = useState<boolean>(false)

    return (
        <Dialog open={isOpen} onOpenChange={(v: boolean) => {
            if (!v) {
                setIsOpen(v)
            }
        }}>
            <DialogTrigger onClick={() => setIsOpen(true)} asChild>
                <Button>Upload PDF</Button>
            </DialogTrigger>

            <DialogContent>
                Example
            </DialogContent>
        </Dialog>
    )
}

export default UploadButton