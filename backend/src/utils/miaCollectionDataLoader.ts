import { readdir, readFile } from "fs/promises";
import { join, basename } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import type { FileData } from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class MIACollectionDataLoader {
    private dataPath: string;
    private processedCount = 0;

    constructor() {
        this.dataPath = join(__dirname, "../../data/objects");
    }

    async loadAllFiles(): Promise<FileData[]> {
        const artworks: FileData[] = [];

        const directories = await readdir(this.dataPath, { withFileTypes: true });

        for (let i = 0; i < directories.length; i++) {
            const dir = directories[i];

            if (!dir.isDirectory()) {
                continue;
            }

            try {
                const dirPath = join(this.dataPath, dir.name);
                const files = await readdir(dirPath);
                const jsonFiles = files.filter(file => file.endsWith(".json"));

                const validResults: FileData[] = [];
                for (let fileIndex = 0; fileIndex < jsonFiles.length; fileIndex++) {
                    const file = jsonFiles[fileIndex];
                    const result = await this.loadSingleFile(join(dirPath, file));
                    if (result) {
                        validResults.push(result);
                    }
                }

                artworks.push(...validResults);
            } catch (error) {
                console.error(`Error processing directory ${dir.name}:`, error);
            }
        }

        return artworks;
    }

    private async loadSingleFile(filePath: string): Promise<FileData | null> {
        try {
            const content = await readFile(filePath, "utf-8");

            if (!content.trim()) {
                return null;
            }

            const data = JSON.parse(content);

            if (!data || typeof data !== "object") {
                return null;
            }

            const artwork: FileData = {
                id: String(data.id || basename(filePath, ".json")),
                filename: basename(filePath),
                title: data.title,
                description: data.description,
                artist: data.artist,
                culture: data.culture,
                country: data.country,
                continent: data.continent,
                style: data.style,
                begin: data.begin,
                end: data.end,
                text: data.text,
                dated: data.dated,
                classification: data.classification,
                object_name: data.object_name,
                nationality: data.nationality,
                // medium: data.medium,
                // inscription: data.inscription,
                // markings: data.markings,
            };

            this.processedCount++;
            return artwork;
        } catch (error) {
            // Silently ignore parsing errors for invalid JSON files
            return null;
        }
    }

    formatArtworkForEmbedding(artwork: FileData): string {
        const sections: string[] = [];

        if (artwork.title) {
            sections.push(`Title: ${artwork.title}`);
        }

        if (artwork.artist) {
            sections.push(`Artist: ${artwork.artist}`);
        }

        if (artwork.nationality) {
            sections.push(`Nationality: ${artwork.nationality}`);
        }

        if (artwork.object_name) {
            sections.push(`Object: ${artwork.object_name}`);
        }

        if (artwork.culture) {
            sections.push(`Culture: ${artwork.culture}`);
        }

        if (artwork.country) {
            sections.push(`Country: ${artwork.country}`);
        }

        if (artwork.style) {
            sections.push(`Style: ${artwork.style}`);
        }

        if (artwork.classification) {
            sections.push(`Classification: ${artwork.classification}`);
        }

        if (artwork.description) {
            sections.push(`Description: ${artwork.description}`);
        }

        if (artwork.text && artwork.text !== artwork.description) {
            sections.push(`Context: ${artwork.text}`);
        }

        if (artwork.dated) {
            sections.push(`Dated: ${artwork.dated}`);
        } else if (artwork.begin && artwork.end) {
            sections.push(`Period: ${artwork.begin}-${artwork.end}`);
        } else if (artwork.begin) {
            sections.push(`Period: from ${artwork.begin}`);
        } else if (artwork.end) {
            sections.push(`Period: until ${artwork.end}`);
        }

        // if (artwork.inscription && artwork.inscription.length > 5) {
        //     sections.push(`Inscription: ${artwork.inscription}`);
        // }
        //
        // if (artwork.markings && artwork.markings.length > 5) {
        //     sections.push(`Markings: ${artwork.markings}`);
        // }

        return sections.join(". ");
    }
}
