import type { FastifyRequest } from "fastify";
import { createDataStreamResponse } from "ai";

export const rateLimitConfig = {
    max: 10,
    timeWindow: "1 day",
    allowList: (request: FastifyRequest) => {
        const SKIPPED_IP = process.env.NODE_ENV === "development" ? "::1" : process.env.SKIPPED_IP;

        const allowedIPs = [SKIPPED_IP];

        return allowedIPs.includes(request.ip);
    },
    errorResponseBuilder: () => {
        const errorMessage = `Too many requests from your IP. Please try again later.`;

        const response = createDataStreamResponse({
            execute: async () => {
                throw new Error(errorMessage);
            },
            onError: () => errorMessage,
        });

        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");

        return response;
    },
};
