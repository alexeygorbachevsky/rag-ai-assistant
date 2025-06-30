// import { JSONLoader } from "langchain/document_loaders/fs/json";
// import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
// import type { Document } from "@langchain/core/documents";
// import { dirname, join } from "path";
// import { fileURLToPath } from "url";
//
// import type { FileData, RawFileData } from "../types/index.js";
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
//
// export class UserCollectionDataLoader {
//     private dataPath: string;
//
//     constructor() {
//         this.dataPath = join(__dirname, "../../data/objects");
//     }
//
//     private generateId(rawData: RawFileData, source: string): string {
//         if (rawData.id) {
//             return rawData.id.toString();
//         }
//
//         return source.split("/").pop()?.replace(".json", "") || Math.random().toString(36).substr(2, 9);
//     }
//
//     private transformRawData(rawData: RawFileData, source: string): FileData {
//         return {
//             id: this.generateId(rawData, source),
//             source,
//             ...rawData,
//         };
//     }
//
//     private hasMinimumContent(artwork: FileData): boolean {
//         const contentFields = Object.values(artwork).filter(
//             value => typeof value === "string" && value.trim().length > 0,
//         );
//
//         return contentFields.length >= 2;
//     }
//
//     async loadAllFiles(): Promise<FileData[]> {
//         const files: FileData[] = [];
//         const startTime = Date.now();
//
//         try {
//             const folderZeroPath = join(this.dataPath, "0");
//             console.log(`Loading from: ${folderZeroPath}`);
//             const loader = new DirectoryLoader(folderZeroPath, {
//                 ".json": (path: string) => new JSONLoader(path, ""),
//             });
//
//             const docs: Document[] = await loader.load();
//
//             let processedCount = 0;
//             const totalDocs = docs.length;
//
//             console.log(`Start loading ${totalDocs} files...`);
//
//             for (const doc of docs) {
//                 try {
//                     if (processedCount < 3) {
//                         console.log(`Debug pageContent for ${doc.metadata.source}:`, doc.pageContent.substring(0, 200));
//                     }
//
//                     const rawData: RawFileData = JSON.parse(doc.pageContent);
//                     const file = this.transformRawData(rawData, doc.metadata.source || "");
//
//                     const hasContent = this.hasMinimumContent(file);
//                     if (hasContent) {
//                         files.push(file);
//                     }
//
//                     processedCount++;
//
//                     if (processedCount % 100 === 0 || processedCount === totalDocs) {
//                         const percentage = Math.round((processedCount / totalDocs) * 100);
//                         const elapsedTime = Date.now() - startTime;
//                         const avgTimePerFile = elapsedTime / processedCount;
//                         const remainingFiles = totalDocs - processedCount;
//                         const estimatedRemaining = Math.round((remainingFiles * avgTimePerFile) / 1000);
//
//                         console.log(
//                             `Progress: ${processedCount}/${totalDocs} (${percentage}%) | ` +
//                                 `Loaded artworks: ${files.length} | ` +
//                                 `Time: ${Math.round(elapsedTime / 1000)}s | ` +
//                                 `Remaining: ~${estimatedRemaining}s`,
//                         );
//                     }
//                 } catch (error) {
//                     processedCount++;
//                 }
//             }
//
//             const totalTime = Math.round((Date.now() - startTime) / 1000);
//             console.log(
//                 `Loading completed! Processed files: ${totalDocs}, loaded files: ${files.length}, time: ${totalTime}s`,
//             );
//         } catch (error) {
//             console.error("Error loading files:", error);
//             throw error;
//         }
//
//         return files;
//     }
//
//     formatArtworkForEmbedding(data: FileData): string {
//         const parts: string[] = [];
//
//         const skipFields = new Set([
//             "id",
//             "curator_approved",
//             "restricted",
//             "image_height",
//             "image_width",
//             "image_copyright",
//             "source",
//         ]);
//
//         for (const [key, value] of Object.entries(data)) {
//             if (skipFields.has(key) || value == null) {
//                 continue;
//             }
//
//             if (typeof value === "string" && value.trim()) {
//                 const formattedField = this.formatFieldName(key);
//                 parts.push(`${formattedField}: ${value.trim()}`);
//             } else if (typeof value === "number") {
//                 const formattedField = this.formatFieldName(key);
//                 parts.push(`${formattedField}: ${value}`);
//             } else if (typeof value === "boolean") {
//                 const formattedField = this.formatFieldName(key);
//                 parts.push(`${formattedField}: ${value ? "Yes" : "No"}`);
//             } else if (Array.isArray(value) && value.length > 0) {
//                 const formattedField = this.formatFieldName(key);
//                 const arrayValue = value.filter(v => v != null && v !== "").join(", ");
//                 if (arrayValue) {
//                     parts.push(`${formattedField}: ${arrayValue}`);
//                 }
//             }
//         }
//
//         return parts.join("\n");
//     }
//
//     private formatFieldName(field: string): string {
//         return field
//             .replace(/_/g, " ")
//             .replace(/([A-Z])/g, " $1")
//             .toLowerCase()
//             .split(" ")
//             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//             .join(" ");
//     }
// }
