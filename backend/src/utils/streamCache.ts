export class StreamCacheUtil {
    private static readonly CHUNK_DELAY = 30;
    private static readonly ENCODER = new TextEncoder();

    static createSimpleStreamResponse(answer: string, _sources: string[]): Response {
        const encoder = StreamCacheUtil.ENCODER;
        const chunks = StreamCacheUtil.chunkText(answer);

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    const formattedChunk = `0:${JSON.stringify(chunk)}\n`;
                    controller.enqueue(encoder.encode(formattedChunk));

                    if (i < chunks.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, StreamCacheUtil.CHUNK_DELAY));
                    }
                }

                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Cache-Hit": "true",
            },
        });
    }

    private static chunkText(text: string): string[] {
        const words = text.split(" ");
        const chunks: string[] = [];
        let currentChunk = "";

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const separator = i === words.length - 1 ? "" : " ";

            if (currentChunk.length + word.length + separator.length <= 25) {
                currentChunk += word + separator;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = word + separator;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks.length > 0 ? chunks : [text];
    }
}
