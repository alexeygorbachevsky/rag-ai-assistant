import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

export default fp(async function (fastify: FastifyInstance) {
    await fastify.register(swagger, {
        openapi: {
            openapi: "3.0.0",
            info: {
                title: "RAG AI API",
                description: "API for RAG AI service",
                version: "1.0.0",
            },
            servers: [
                {
                    url: "http://localhost:3001",
                    description: "Development server",
                },
            ],
        },
    });

    await fastify.register(swaggerUi, {
        routePrefix: "/docs",
        uiConfig: {
            docExpansion: "full",
            deepLinking: false,
        },
        staticCSP: true,
        transformStaticCSP: header => header,
    });
});
