import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import type { FileData } from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class MIACollectionDataLoader {
    private dataPath: string;

    constructor() {
        this.dataPath = join(__dirname, "../../data/objects");
    }

    async loadAllFiles(): Promise<FileData[]> {
        const artworks: FileData[] = [];

        const directories = await readdir(this.dataPath, { withFileTypes: true });

        for (const dir of directories) {
            if (dir.isDirectory() && dir.name === "0") {
                const dirPath = join(this.dataPath, dir.name);
                const files = await readdir(dirPath);

                for (const file of files) {
                    if (file.endsWith(".json")) {
                        try {
                            const filePath = join(dirPath, file);
                            const content = await readFile(filePath, "utf-8");

                            if (!content.trim()) {
                                continue;
                            }

                            const data = JSON.parse(content);

                            if (!data || typeof data !== "object") {
                                continue;
                            }

                            const artwork = {
                                id: data.id || file.replace(".json", ""),
                                title: data.title,
                                description: data.description,
                                artist: data.artist,
                                culture: data.culture,
                                country: data.country,
                                medium: data.medium,
                                style: data.style,
                                begin: data.begin,
                                end: data.end,
                                text: data.text,
                                dated: data.dated,
                                classification: data.classification,
                                object_name: data.object_name,
                                nationality: data.nationality,
                            };

                            artworks.push(artwork as FileData);
                        } catch {
                            //
                        }
                    }
                }
            }
        }

        return artworks;
    }

    formatArtworkForEmbedding(artwork: FileData): string {
        const parts: string[] = [];

        if (artwork.title) {
            parts.push(`Title: ${artwork.title}`);
        }
        if (artwork.artist) {
            parts.push(`Artist: ${artwork.artist}`);
        }
        if (artwork.nationality) {
            parts.push(`Nationality: ${artwork.nationality}`);
        }
        if (artwork.dated) {
            parts.push(`Date: ${artwork.dated}`);
        }
        if (artwork.classification) {
            parts.push(`Classification: ${artwork.classification}`);
        }
        if (artwork.object_name) {
            parts.push(`Object: ${artwork.object_name}`);
        }
        if (artwork.description) {
            parts.push(`Description: ${artwork.description}`);
        }
        if (artwork.text) {
            parts.push(`Text: ${artwork.text}`);
        }

        if (artwork.begin && artwork.end) {
            parts.push(`Period: ${artwork.begin}-${artwork.end}`);
        } else if (artwork.begin) {
            parts.push(`Period: from ${artwork.begin}`);
        } else if (artwork.end) {
            parts.push(`Period: until ${artwork.end}`);
        }

        return parts.join("\n");
    }
}
