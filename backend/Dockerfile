# Setup for local @huggingface/transformers

FROM node:18-slim

# Install system dependencies for onnxruntime-node
RUN apt-get update && apt-get install -y \
    libgomp1 \
    libblas3 \
    liblapack3 \
    libatlas-base-dev \
    gfortran \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# Give full permissions to node_modules for cache writing
RUN chown -R appuser:appuser /app \
    && chmod -R 777 /app/node_modules

USER appuser

EXPOSE 7860
CMD ["yarn", "start"]

# Setup for HuggingFaceInferenceEmbeddings from @langchain/community/embeddings/hf

#FROM node:18-alpine
#
#WORKDIR /app
#
#COPY package*.json yarn.lock ./
#RUN yarn install --frozen-lockfile
#
#COPY . .
#RUN yarn build
#
#EXPOSE 7860
#CMD ["yarn", "start"]