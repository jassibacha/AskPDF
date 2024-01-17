import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { userAgent } from "next/server";
import { createUploadthing, type FileRouter } from "uploadthing/next"

import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { pinecone } from "@/lib/pinecone" // New
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { PLANS } from "@/config/stripe";

const f = createUploadthing();

const middleware = async () => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) throw new Error("Unauthorized")

  const subscriptionPlan = await getUserSubscriptionPlan()
  
  return { subscriptionPlan, userId: user.id}
}

const onUploadComplete = async ({ 
  metadata, file 
}: {
  metadata: Awaited<ReturnType<typeof middleware>>,
  file: {
    key: string
    name: string
    url: string
  }
}) => {

  const isFileExist = await db.file.findFirst({
    where: {
      key: file.key
    }
  })

  // If file already exists, stop running (prevents duplicates)
  if (isFileExist) return

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

    const { subscriptionPlan } = metadata
    const { isSubscribed } = subscriptionPlan

    const isProExceeded = pagesAmt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf
    const isFreeExceeded = pagesAmt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf

    if ((isSubscribed && isFreeExceeded) || (!isSubscribed && isProExceeded)) {
      await db.file.update({
        data: {
          uploadStatus: "FAILED",
        },
        where: {
          id: createdFile.id,
        }
      })
    }

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
}

export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: "16MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter;