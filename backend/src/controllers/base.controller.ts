import type { FastifyReply } from "fastify";
import { z } from "zod";

export class BaseController {
    protected handleError(reply: FastifyReply, error: unknown): void {
        if (error instanceof z.ZodError) {
            reply.code(400).send({
                error: "Invalid request: " + error.errors.map((e: z.ZodIssue) => e.message).join(", "),
            });

            return;
        }

        const err = error as Error;
        if (err.message.includes("Vector store not initialized") || err.message.includes("collection")) {
            reply.code(503).send({
                error: "Service unavailable. Please ensure data is indexed first.",
            });

            return;
        }
        reply.code(500).send({
            error: "Internal server error",
        });
    }

    protected setCorsHeaders(reply: FastifyReply): void {
        // FIXME: allow all origins temporarily
        reply.header("Access-Control-Allow-Origin", "*");
        reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    protected validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
        return schema.parse(data);
    }
}
