import { pipeline } from "@huggingface/transformers";
import { AllTasks } from "@huggingface/transformers/types/pipelines";

export class LocalEmbeddingsService {
    private model?: AllTasks["feature-extraction"];
    private initialized = false;
    private modelName: string;

    constructor(modelName: string) {
        this.modelName = modelName;
    }

    async initialize() {
        if (!this.initialized) {
            try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                this.model = await pipeline("feature-extraction", this.modelName);
                this.initialized = true;
            } catch (error) {
                console.error("Failed to initialize local embeddings model:", error);
                throw error;
            }
        }
    }

    async embedQuery(text: string): Promise<number[]> {
        await this.initialize();
        if (!this.model) {
            throw new Error("Model not initialized");
        }

        try {
            const result = await this.model(text, { pooling: "mean" });

            return Array.from(result.data);
        } catch (error) {
            console.error("Error in embedQuery:", error);
            throw error;
        }
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        await this.initialize();

        if (!this.model) {
            throw new Error("Model not initialized");
        }

        return Promise.all(texts.map(text => this.embedQuery(text)));
    }
}
