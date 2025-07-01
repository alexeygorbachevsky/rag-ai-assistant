import type { FastifyBaseLogger } from "fastify";
import type { CoreMessage } from "ai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import type { VectorStoreService } from "./vectorStoreService.js";
import type { LLMService } from "./llmService.js";
import type { RedisCacheService } from "./redisCacheService.js";
import type { SearchResult } from "../types/index.js";
import { StreamCacheUtil } from "../utils/streamCache.js";

export interface RAGConfig {
    scoreThreshold: number;
    maxResults: number;
}

export class RAGOrchestrationService {
    private vectorStoreService: VectorStoreService;
    private llmService: LLMService;
    private cacheService?: RedisCacheService;
    private config: RAGConfig;
    private logger: FastifyBaseLogger;

    constructor(
        vectorStoreService: VectorStoreService,
        llmService: LLMService,
        config: RAGConfig,
        logger: FastifyBaseLogger,
        cacheService?: RedisCacheService,
    ) {
        this.vectorStoreService = vectorStoreService;
        this.llmService = llmService;
        this.cacheService = cacheService;
        this.config = config;
        this.logger = logger;
    }

    async processRAGQuery(
        question: string,
        conversationHistory: CoreMessage[] = [],
        startTime: number,
        modelName?: string,
    ): Promise<Response> {
        const ragStartTime = Date.now();

        try {
            if (this.cacheService) {
                const cached = await this.cacheService.get(question);
                if (cached) {
                    this.logger.info(`Cache hit for question: "${question}"`);
                    return StreamCacheUtil.createSimpleStreamResponse(cached.answer, cached.sources);
                }
            }
            const searchStartTime = Date.now();
            const searchResults = await this.vectorStoreService.search(question, this.config.maxResults);
            const searchTime = Date.now() - searchStartTime;

            const filteredResults = searchResults
                .filter(([_doc, score]) => score > this.config.scoreThreshold)
                .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

            this.logger.info(`Vector search completed in ${searchTime}ms, found ${filteredResults.length} documents`);

            const { sources, contexts } = this.extractSourcesAndContexts(filteredResults);
            this.logger.info(`Retrieved sources: [${sources.join(", ")}]`);

            const context = contexts.join("\n\n");
            // const convertedHistory = this.convertConversationHistory(conversationHistory);
            const messages = await this.buildPrompt(question, context, sources, conversationHistory);
            const llmStartTime = Date.now();

            return await this.llmService.generateResponse(
                messages,
                modelName,
                async result => {
                    const processingTime = Date.now() - startTime;
                    const llmTime = Date.now() - llmStartTime;
                    const totalTime = Date.now() - ragStartTime;

                    this.logger.info(`Request processed in ${processingTime}ms`);
                    this.logger.info(`LLM response generated in ${llmTime}ms, total RAG time: ${totalTime}ms`);
                    this.logger.info(
                        `Answer quality metrics - length: ${result.text.length} chars, tokens: ${result.usage?.totalTokens || "unknown"}`,
                    );

                    if (this.cacheService) {
                        await this.cacheService.set(question, {
                            answer: result.text,
                            sources,
                            timestamp: Date.now(),
                        });
                    }
                },
                event => {
                    this.logger.error("Stream error:", event.error);
                },
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            this.logger.error(`RAG processing failed: ${errorMessage}`);

            return new Response(`RAG Error: ${errorMessage}`, {
                status: 500,
                headers: { "Content-Type": "text/plain" },
            });
        }
    }

    private extractSourcesAndContexts(
        searchResults: Array<[{ metadata: Record<string, unknown>; pageContent: string }, number]>,
    ): { sources: string[]; contexts: string[] } {
        const contexts: string[] = [];
        const sources: string[] = [];

        for (const [doc] of searchResults) {
            const metadata = doc.metadata as SearchResult["metadata"];
            const baseSource = metadata.title || metadata.objectId || "Unknown";
            const source = metadata.filename ? `${baseSource} (${metadata.filename})` : baseSource;

            sources.push(source);
            contexts.push(doc.pageContent);
        }

        return { sources, contexts };
    }

    private async buildPrompt(
        question: string,
        context: string,
        sources: string[],
        conversationHistory: CoreMessage[] = [],
    ): Promise<CoreMessage[]> {
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
}
