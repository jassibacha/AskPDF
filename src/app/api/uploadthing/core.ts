import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { userAgent } from "next/server";
import { createUploadthing, type FileRouter } from "uploadthing/next"

import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { pinecone } from "@/lib/pinecone" // New

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
        const pageLevelDocs = await loader.load();
        const pagesAmt = pageLevelDocs.length

        // vectorize and index entire document
        const pineconeIndex = pinecone.Index("askpdf")
        const embeddings = await new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
        })

        await PineconeStore.fromDocuments(
          pageLevelDocs, 
          embeddings, 
          {
            pineconeIndex,
            namespace: createdFile.id
          }
        )

        await db.file.update({
          data: {
            uploadStatus: "SUCCESS",
          },
          where: {
            id: createdFile.id
          }
        })

      } catch (err) {
        console.dir(err, { depth: null });
        console.log(`Error Type: ${typeof err}\n Error:${err}`);
        await db.file.update({
          data: {
            uploadStatus: "FAILED",
          },
          where: {
            id: createdFile.id
          }
        })
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter;