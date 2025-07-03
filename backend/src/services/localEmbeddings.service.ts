import { pipeline } from '@huggingface/transformers';

export class LocalEmbeddingsService {
    private model: any;
    private initialized = false;
    
    async initialize() {
        if (!this.initialized) {
            try {
                console.log('Initializing local embeddings model...');
                this.model = await pipeline('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2');
                this.initialized = true;
                console.log('Local embeddings model initialized successfully');
            } catch (error) {
                console.error('Failed to initialize local embeddings model:', error);
                throw error;
            }
        }
    }
    
    async embedQuery(text: string): Promise<number[]> {
        await this.initialize();
        try {
            const result = await this.model(text, { pooling: 'mean' });
            return Array.from(result.data);
        } catch (error) {
            console.error('Error in embedQuery:', error);
            throw error;
        }
    }
    
    async embedDocuments(texts: string[]): Promise<number[][]> {
        await this.initialize();
        try {
            return Promise.all(texts.map(text => this.embedQuery(text)));
        } catch (error) {
            console.error('Error in embedDocuments:', error);
            throw error;
        }
    }
} 