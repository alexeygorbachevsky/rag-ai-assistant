import * as process from "node:process";

export const RAG_API =
    process.env.NODE_ENV === "production" ? "https://alexcather-rag-ai-assistant.hf.space" : "http://localhost:3001";
