import type { FastifyRequest } from "fastify";
import { createDataStreamResponse } from "ai";

import { getSkippedIp } from "../utils/rateLimits.js";

export const getRateLimitConfig = () => ({
    max: parseInt(process.env.IP_DAILY_LIMIT || "0"),
    timeWindow: "1 day",
    allowList: (request: FastifyRequest) => request.ip === getSkippedIp(),
    errorResponseBuilder: () => {
        const errorMessage = `Too many requests. Please try again later.`;

        const response = createDataStreamResponse({
            execute: async () => {
                throw new Error(errorMessage);
            },
            onError: () => errorMessage,
        });

        // FIXME: allow all origins temporarily
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");

        return response;
    },
});
