#!/usr/bin/env node

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { QdrantVectorStore } from "@langchain/qdrant";
// import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

import { LocalEmbeddingsService } from "../src/services/localEmbeddings.service.js";
import { EMBEDDING_MODEL } from "./constants/embeddings.js";
import { MIACollectionDataLoader } from "./utils/miaCollectionDataLoader.js";

const uploadMIACollection = async () => {
    const dataLoader = new MIACollectionDataLoader();

    const embeddings = new LocalEmbeddingsService(EMBEDDING_MODEL);
    await embeddings.initialize();

    // const embeddings = new HuggingFaceInferenceEmbeddings({
    //     model: EMBEDDING_MODEL,
    //     apiKey: process.env.HF_API_TOKEN,
    // });

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100,
    });

    const vectorStore = new QdrantVectorStore(embeddings, {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: "mia_collection",
    });

    try {
        console.log("Loading files from MIA collection...");
        const files = await dataLoader.loadAllFiles();

        if (!files.length) {
            console.error("No files found in MIA collection");
            process.exit(1);
        }

        const BATCH_SIZE = 10;
        let totalUploaded = 0;

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);

            const batchPromises = batch.map(async file => {
                try {
                    const content = dataLoader.formatArtworkForEmbedding(file);

                    if (!content.trim()) {
                        return [];
                    }

                    return await textSplitter.createDocuments(
                        [content],
                        [
                            {
                                objectId: file.id,
                                object_name: file.object_name,
                                title: file.title || "Untitled",
                                artist: file.artist || "Unknown",
                                country: file.country,
                                continent: file.continent,
                                dated: file.dated,
                                filename: file.filename,
                            },
                        ],
                    );
                } catch (error) {
                    console.error(`Error processing file ${file.filename}:`, error);
                    return [];
                }
            });

            const batchResults = await Promise.all(batchPromises);

            const batchDocuments = batchResults.flat();

            if (batchDocuments.length) {
                await vectorStore.addDocuments(batchDocuments);
                totalUploaded += batchDocuments.length;

                console.log("Loaded:", totalUploaded);
            }
        }
    } catch (error) {
        console.error("Error uploading MIA collection:", error);
        process.exit(1);
    }
};

uploadMIACollection().catch(error => {
    console.error("Fatal error in uploadMIACollection:", error);
    process.exit(1);
});
