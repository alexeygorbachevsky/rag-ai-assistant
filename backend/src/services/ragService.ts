import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

import type { SearchResult, CacheEntry } from "../types/index.js";

import { RedisCacheService } from "./redisCacheService.js";
// import { StreamCacheUtil } from "../utils/streamCache.js";
import { FastifyBaseLogger } from "fastify";

export class RAGService {
    private embeddings!: HuggingFaceInferenceEmbeddings;
    private vectorStore: QdrantVectorStore | null = null;
    private openrouter!: ReturnType<typeof createOpenRouter>;
    private cacheService!: RedisCacheService;
    private logger: FastifyBaseLogger;

    constructor(logger: FastifyBaseLogger) {
        this.logger = logger;
        this.openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY as string,
        });

        this.embeddings = new HuggingFaceInferenceEmbeddings({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            apiKey: process.env.HF_API_TOKEN as string,
        });

        this.cacheService = new RedisCacheService({}, this.logger);

        this.initialize();
    }

    initialize() {
        this.initializeVectorStore();
        this.cacheService.connect();
    }

    async initializeVectorStore(): Promise<void> {
        try {
            this.vectorStore = await QdrantVectorStore.fromExistingCollection(this.embeddings, {
                url: process.env.QDRANT_URL,
                apiKey: process.env.QDRANT_API_KEY,
                collectionName: "mia_collection",
            });
        } catch (error) {
            this.logger?.error(
                `Failed to initialize vector store: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
        }
    }

    async ask(messages?: Array<{ role: "user" | "assistant"; content: string }>): Promise<Response> {
        try {
            const response = streamText({
                model: this.openrouter("deepseek/deepseek-chat-v3-0324"),
                messages,
                temperature: 0.3,
                maxTokens: 512,
            });

            return response.toDataStreamResponse();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

            return new Response(`Error: ${errorMessage}`, {
                status: 500,
                headers: { "Content-Type": "text/plain" },
            });
        }
    }

    async askRAG(
        question: string,
        conversationHistory: Array<{ role: "user" | "assistant" | "system"; content: string }> = [],
        startTime: number,
    ): Promise<Response> {
        const ragStartTime = Date.now();

        try {
            // const cached = await this.cacheService.get(question);
            // if (cached) {
            //     this.logger?.info(`Cache hit for question: "${question}"`);
            //     this.logger?.info(`Retrieved sources from cache: [${cached.sources.join(", ")}]`);
            //
            //     return StreamCacheUtil.createSimpleStreamResponse(cached.answer, cached.sources);
            // }

            const searchStartTime = Date.now();

            if (!this.vectorStore) {
                throw new Error("Vector store not initialized");
            }

            const searchResults = await this.vectorStore.similaritySearchWithScore(question, 10);
            const searchTime = Date.now() - searchStartTime;

            const filteredResults = searchResults.filter(([_doc, score]) => score > 0.7);

            console.log("FILTERED_RESULTS", filteredResults.length);

            const finalResults = filteredResults.length >= 2 ? filteredResults : searchResults.slice(0, 8);

            console.log("finalResults", finalResults.length);

            const { sources, contexts } = this.extractSourcesAndContexts(finalResults);

            console.log("sources", sources);

            this.logger?.info(
                `Vector search completed in ${searchTime}ms, found ${finalResults.length} documents with scores: ${finalResults.map(([_, score]) => score.toFixed(3)).join(", ")}`,
            );
            this.logger?.info(`Retrieved sources: [${sources.join(", ")}]`);

            const context = contexts.join("\n\n");
            console.log("context", context);
            const messages = await this.buildPrompt(question, context, sources, conversationHistory);

            const llmStartTime = Date.now();
            const response = streamText({
                model: this.openrouter("mistralai/mistral-small-3.2-24b-instruct"),
                // model: this.openrouter("deepseek/deepseek-chat-v3-0324"),
                messages,
                onFinish: async result => {
                    const processingTime = Date.now() - startTime;
                    this.logger?.info(`Request processed in ${processingTime}ms`);

                    const llmTime = Date.now() - llmStartTime;
                    const totalTime = Date.now() - ragStartTime;

                    this.logger?.info(`LLM response generated in ${llmTime}ms, total RAG time: ${totalTime}ms`);
                    this.logger?.info(
                        `Answer quality metrics - length: ${result.text.length} chars, tokens: ${result.usage?.totalTokens || "unknown"}`,
                    );

                    const cacheEntry: CacheEntry = {
                        answer: result.text,
                        sources,
                        timestamp: Date.now(),
                    };
                    await this.cacheService.set(question, cacheEntry);
                },
                onError: error => {
                    this.logger?.error("Stream error:", error);
                },
            });

            return response.toDataStreamResponse();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            this.logger?.error(`RAG processing failed: ${errorMessage}`);

            return new Response(`RAG Error: ${errorMessage}`, {
                status: 500,
                headers: { "Content-Type": "text/plain" },
            });
        }
    }

    private extractSourcesAndContexts(
        searchResults: Array<[{ metadata: Record<string, unknown>; pageContent: string }, number]>,
    ): {
        sources: string[];
        contexts: string[];
    } {
        const contexts: string[] = [];
        const sources: string[] = [];

        for (const [_doc] of searchResults) {
            const metadata = _doc.metadata as SearchResult["metadata"];
            const source = metadata.title || metadata.objectId || "Unknown";

            sources.push(source);
            contexts.push(_doc.pageContent);
        }

        return { sources, contexts };
    }

    private buildPromptRaw(question: string, context: string, sources: string[]): string {
        const sourcesText =
            sources.length > 0
                ? "\n\n**Sources:**\n" +
                  sources.map((source: string, index: number) => `${index + 1}. ${source}`).join("\n")
                : "";

        return `You are a knowledgeable art historian and museum curator. Using the provided context about artworks from the Minneapolis Institute of Art collection, answer the user's question accurately and informatively.

Context:
${context}

Question: ${question}

Instructions:
- Base your answer only on the provided context
- If the context doesn't contain relevant information, say so
- Be specific about artworks, artists, and details when possible
- Keep your response concise but informative
- Do not make up information not present in the context
- Do NOT include source numbers or references in the main text of your answer
- At the end of your answer, include a Sources section with ONLY the sources you actually used in your answer
- Number the sources consecutively starting from 1 (1, 2, 3, etc.) in the Sources section
- Sources format: "**Sources:**\n1. [Source Title]\n2. [Source Title]\n3. [Source Title]"

Available sources:${sourcesText}`;
    }

    private async buildPrompt(
        question: string,
        context: string,
        sources: string[],
        conversationHistory: Array<{ role: "user" | "assistant" | "system"; content: string }> = [],
    ): Promise<Array<{ role: "user" | "assistant" | "system"; content: string }>> {
        const sourcesText =
            sources.length > 0
                ? "\n\n**Sources:**\n" +
                  sources.map((source: string, index: number) => `${index + 1}. ${source}`).join("\n")
                : "";

        const prompt = ChatPromptTemplate.fromMessages([
            [
                "system",
                `You are a knowledgeable art historian and museum curator. Using the provided context about artworks from the Minneapolis Institute of Art collection, answer the user's question accurately and informatively.

Context:
{context}

Instructions:
- Base your answer only on the provided context
- If the context doesn't contain relevant information, say so
- Be specific about artworks, artists, and details when possible
- Keep your response concise but informative
- Do not make up information not present in the context
- Do NOT include source numbers or references in the main text of your answer
- At the end of your answer, include a Sources section with ONLY the sources you actually used in your answer
- Number the sources consecutively starting from 1 (1, 2, 3, etc.) in the Sources section
- Sources format: "**Sources:**\n1. [Source Title]\n2. [Source Title]\n3. [Source Title]"

Available sources:
{sources}`,
            ],
            ["human", "{question}"],
        ]);

        const baseMessages = await prompt.formatMessages({
            context: context,
            question: question,
            sources: sourcesText,
        });

        const formattedBaseMessages = baseMessages.map(msg => ({
            role: (msg.getType() === "system" ? "system" : "user") as "user" | "assistant" | "system",
            content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        }));

        return [formattedBaseMessages[0], ...conversationHistory, formattedBaseMessages[1]];
    }

    async disconnect(): Promise<void> {
        await this.cacheService.disconnect();
    }
}
