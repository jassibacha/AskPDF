// Old Version
// import { PineconeClient } from "@pinecone-database/pinecone"

// export const getPineconeClient = async () =>{
//     const client = new PineconeClient();

//     await client.init({
//         apiKey: process.env.PINECONE_API_KEY!,
//         environment: process.env.PINECONE_ENVIRONMENT!
//     })
    
//     return client
// }

// Newer version
import { Pinecone } from "@pinecone-database/pinecone";

export const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: 'gcp-starter'
})