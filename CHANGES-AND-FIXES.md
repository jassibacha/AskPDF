### This guide is updated as of Jan 13, 2023.

Note: To be able to build this app exactly as intended, you can use Josh's [`pnmp-lock.yaml` file](https://github.com/joschan21/quill/blob/master/pnpm-lock.yaml) to get his exact versions of all node_modules. 

If you want to build using more recent/up-to-date modules, you can follow along here:

## Kinde's 'getUser()' requires await now [[1:27:12](https://www.youtube.com/watch?v=ucX2zXAZ1I0&t=5233s)]

Any and all uses of Kinde's `getUser()` are a bit different, they require `await` in the newest version [[info here](https://kinde.com/docs/developer-tools/nextjs-sdk/#migration-guide)]

**ORIGINAL:**
```jsx
const FunctionName = () => {
    const { getUser } = getKindeServerSession()
    const user = getUser()
    ...
```
**NEW VERSION:**
```jsx
const FunctionName = async () => {
    const { getUser } = getKindeServerSession()
    const user = await getUser()
    ...
```

A list of areas I had to add/update `await getUser()` on:
- `src/app/dashboard/page.tsx` - come back and link these later
- `src/trpc/index.ts` - come back and link these later
- [2:44:58] `src/trpc/trpc.ts` 
- [3:29:12] `src/app/dashboard/[fileid]/page.tsx`
- [4:19:54] `src/app/api/uploadthing/core.ts`
- [6:42:08] `src/app/api/message/route.ts`
- [9:03:21] `src/app/pricing/page.tsx`
- [9:28:05] `src/lib/stripe.ts`

Note: This also means you need to update certain functions like `src/app/dashboard/page.tsx` to `async` when you call await inside.



## Uploadthing setup + Typesafe errors [[4:13:32](https://www.youtube.com/watch?v=ucX2zXAZ1I0&t=15213s)]
### Changes in install, and potential typesafe errors

UploadThings Docs show a [different pnpm / npm install](https://docs.uploadthing.com/getting-started/appdir#install-the-packages)

```
pnpm add uploadthing @uploadthing/react
```
*Note: You actually manually end up installing `@uploadthing/react` a bit later.*

And there was also a set of TypeSafe errors inside of `src/app/api/uploadthing/core.ts` when I loaded it up, if anyone else encounters this, it's an issue with your version of Typescript being under `4.9`. Make sure it's `4.9` or higher:

1. `CTRL+Shift+P` / `CMD+Shift+P`
2. Search `Select Type...`
3. Choose `TypeScript: Select TypeScript Version...`
4. Check what version is selected, I swapped it to `Use Workspace Version` and problem solved.

*For a bit more info on why the VSCode version is different, and how to change the version of VSCode (if you want) take a look at the [VSCode docs here](https://code.visualstudio.com/docs/typescript/typescript-compiling#_using-newer-typescript-versions).*

## Message route 'userId' issues [[6:42:15](https://youtu.be/ucX2zXAZ1I0?si=FviZ3aL-kwQbgO8D&t=24135)]

`src/app/api/message/route.ts` this was giving a TS Error: `Property 'id' does not exist on type 'KindeUser | null'.`
```jsx
const { getUser } = getKindeServerSession()
const user = await getUser()

const { id: userId } = user
```

Fix:

```jsx
const { getUser } = getKindeServerSession()
const user = await getUser()
// Use optional chaining to access 'id' property
const userId = user?.id
```

With this modification, if `user` is `null` or `undefined`, `userId` will also be `undefined`, and the check `if (!userId)` will handle the unauthorized case as before. If `user` is not `null` or `undefined`, `userId`  will hold its `id` property.

## Pinecone Errors [[7:14:20](https://youtu.be/ucX2zXAZ1I0?si=-ix9PxdE4G4qtZr_&t=26064)]
### Fixing Pinecone errors, oh the errors..

Okay this one actually took me a while, I couldn't see any errors but I wasn't getting any results in Pinecone's dashboard like Josh had Namespaces available after uploading something. 

Shoutouts to the Discord and everyone who was dealing with this, I had to navigate a few fixes to figure everything out, but with [SiddarthPant](https://github.com/SiddharthPant/)'s fix from the Discord I managed to get the Namespaces updating.

>  **OpenAI Credits:** You need to confirm that your OpenAI account has credits available, your free credits can expire over time! I checked and mine were expired (you can see they're red in the bar in [https://platform.openai.com/usage](https://platform.openai.com/usage) instead of green if they're expired.) To correct this, either make a new account, or throw $5 into your account so you have working credits. (If you need to throw money onto your account maybe give it 5-10 minutes as well?)

**`src/lib/pinecone.ts`** - Using the newer config that Josh showed

```ts
import { Pinecone } from "@pinecone-database/pinecone";

export const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
    environment:  process.env.PINECONE_ENVIRONMENT!
})
```
*Note: I moved the environment call to the `.env` as well, just seemed cleaner in case I needed to edit it down the road.*

**`src/app/api/uploadthing/core.ts`** 
```ts
// ... other imports ...

import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { pinecone } from "@/lib/pinecone"

const f = createUploadthing();

export const ourFileRouter = {
  
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    
    .middleware(async ({ req }) => {
        // ... middleware logic ...
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // ... createdFile const ...

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

        // ...additional logic...

      } catch (err) {
        // Super awesome error logging
        console.dir(err, { depth: null });
        console.log(`Error Type: ${typeof err}\n Error:${err}`);

        // ...error handling etc
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter;
```
*Note: I had originally commented out the `namespace: createdFile.id` but I realized it's necessary in order for Pinecone to be able to separate your vectors per file, so I reworked this.*

**`src/app/api/message/route.ts`**
```ts
// ... other imports ...

import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { pinecone } from "@/lib/pinecone"
import { PineconeStore } from "langchain/vectorstores/pinecone"
import { openai } from "@/lib/openai"
import { OpenAIStream, StreamingTextResponse } from "ai"

export const POST = async (request: NextRequest) => {
    // ...initial setup...

    // 1: Vectorize message
    const embeddings = await new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
    })

    const pineconeIndex = pinecone.Index("askpdf")

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        namespace: file.id
    })

    // ...additional logic...
}
```



## Optimistic Message Updates, Passing Ref TS Error [[8:53:48](https://youtu.be/ucX2zXAZ1I0?si=KjHQz1F9XiJxEWrR&t=32028)]

After doing Josh's update to pass the ref from `Messages.tsx` into `Message.tsx` I got a TS Error:

```
Component definition is missing display name
```

This was happening because ESLint cannot automatically infer a display name for the component when we use forwardRef. This display name is useful for debugging, especially when inspecting components in React DevTools.

To resolve this issue, we can explicitly set a display name for the Message component. This can be done by assigning a displayName property to the component after you define it. Here's how:

```tsx
const Message = forwardRef<HTMLDivElement, MessageProps>(({ 
    message, 
    isNextMessageSamePerson
}: ref) => {
    // ... Existing Code ...
});

Message.displayName = 'Message'; // Add this line!

export default Message;
```


## Stripe getUserSubscriptionPlan() apiVersion issue [[9:29:26](https://youtu.be/ucX2zXAZ1I0?si=KjHQz1F9XiJxEWrR&t=32028)]

I got an on the `src/lib/stripe.ts` here after installing Stripe: `Type '"2023-08-16"' is not assignable to type '"2023-10-16"'.` this occured on the line where apiVersion is set in the stripe object initialization.

**`src/lib/stripe.ts`**
```ts
// ... imports ...

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2023-08-16', // Update this to 2023-10-16 worked for me
  typescript: true,
})

export async function getUserSubscriptionPlan() {
  // ... function logic ...
}
```