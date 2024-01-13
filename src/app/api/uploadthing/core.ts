import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { userAgent } from "next/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import { PDFLoader } from "langchain/document_loaders/fs/pdf";

const f = createUploadthing();


export const ourFileRouter = {
  
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    
    .middleware(async ({ req }) => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user || !user.id) throw new Error("Unauthorized")
      
      return {userId: user.id}
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const createdFile = await db.file.create({
        data: {
          key: file.key,
          name: file.name,
          userId: metadata.userId,
          url: file.url,
          //url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`, // If there's any issues with file url
          uploadStatus: "PROCESSING",
        }
      })

      try {
        const response = await fetch(file.url)
        const blob = await response.blob()

        const loader = new PDFLoader(blob)

      } catch (err) {
        
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter;