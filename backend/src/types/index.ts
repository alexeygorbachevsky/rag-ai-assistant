export interface RawFileData {
    // eslint-disable-next-line
    [key: string]: any;
}

export interface FileData {
    id: string;
    source: string;
    title?: string;
    description?: string;
    text?: string;
    artist?: string;
    culture?: string;
    country?: string;
    continent?: string;
    medium?: string;
    style?: string;
    begin?: number;
    end?: number;
    dated?: string;
    accession_number?: string;
    department?: string;
    classification?: string;
    object_name?: string;
    nationality?: string;
    dimension?: string;
    // eslint-disable-next-line
    [key: string]: any;
}

export interface SearchResult {
    content: string;
    metadata: {
        objectId: string;
        title?: string;
        artist?: string;
        source: string;
    };
    score: number;
}

export interface CacheEntry {
    answer: string;
    sources: string[];
    timestamp: number;
}

// export interface ProcessedChunk {
//     id: string;
//     content: string;
//     metadata: {
//         objectId: string;
//         title?: string;
//         artist?: string;
//         source: string;
//     };
// }
//
// export interface AskRequest {
//     question: string;
// }
//
// export interface AskResponse {
//     answer: string;
//     sources: string[];
// }
//
// export interface AskStreamResponse {
//     stream: AsyncIterable<string>;
//     sources: string[];
// }
