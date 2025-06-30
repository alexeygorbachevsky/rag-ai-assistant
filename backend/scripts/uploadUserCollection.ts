#!/usr/bin/env node

// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
// import { QdrantVectorStore } from "@langchain/qdrant";
//
// import { UserCollectionDataLoader } from "../src/utils/userCollectionDataLoader";
// import { validateEnv } from "../src/config/env";
//
// const uploadUserCollection = async () => {
//     const envConfig = validateEnv(process.env);
//
//     const dataLoader = new UserCollectionDataLoader();
//     const embeddings = new HuggingFaceInferenceEmbeddings({
//         model: "sentence-transformers/all-MiniLM-L6-v2",
//         apiKey: envConfig.HF_API_TOKEN,
//     });
//
//     const textSplitter = new RecursiveCharacterTextSplitter({
//         chunkSize: 1000,
//         chunkOverlap: 100,
//     });
//
//     try {
//         const files = await dataLoader.loadAllFiles();
//
//         if (files.length === 0) {
//             process.exit(1);
//         }
//
//         const documents: Document[] = [];
//
//         for (const file of files) {
//             const content = dataLoader.formatArtworkForEmbedding(file);
//
//             if (content.trim()) {
//                 const chunks = await textSplitter.createDocuments(
//                     [content],
//                     [
//                         {
//                             objectId: file.id,
//                             title: file.title || "Untitled",
//                             artist: file.artist || "Unknown Artist",
//                             source: file.source,
//                         },
//                     ],
//                 );
//
//                 documents.push(...chunks);
//             } else if (documents.length < 3) {
//                 console.log(`Debug: empty content for file ${file.id}`);
//                 console.log("File keys:", Object.keys(file));
//                 console.log("Sample values:", Object.entries(file).slice(0, 5));
//             }
//         }
//
//          await QdrantVectorStore.fromDocuments(documents, embeddings, {
//             url: envConfig.QDRANT_URL,
//             apiKey: envConfig.QDRANT_API_KEY,
//             // TODO
//             collectionName: "mia_collection",
//         });
//
//         console.log(
//             `Vector store created successfully! Indexed ${documents.length} document chunks from ${files.length} artwork files.`,
//         );
//     } catch (error) {
//         process.exit(1);
//     }
// };
//
// uploadUserCollection();
