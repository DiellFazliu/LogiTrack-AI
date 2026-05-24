// backend/src/modules/ai/vector-store.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { pipeline, env } from '@xenova/transformers';
import { knowledgeChunks, KnowledgeChunk } from './knowledge-base';

// Lejo shkarkimin e modelit nga interneti (herën e parë)
env.allowRemoteModels = true;
env.localModelPath = './models'; // opsionale, ku të ruhet modeli

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private embeddingPipeline: any = null;
  private vectors: { id: string; embedding: number[]; chunk: KnowledgeChunk }[] = [];
  private isReady = false;

  async onModuleInit() {
    await this.initialize();
  }

  async initialize() {
    try {
      this.logger.log('Loading embedding model (Xenova/all-MiniLM-L6-v2)...');
      this.embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.logger.log('Embedding model loaded.');

      this.logger.log(`Generating embeddings for ${knowledgeChunks.length} chunks...`);
      for (const chunk of knowledgeChunks) {
        const embedding = await this.generateEmbedding(chunk.text);
        this.vectors.push({
          id: chunk.id,
          embedding,
          chunk,
        });
      }
      this.logger.log(`Vector store ready with ${this.vectors.length} vectors.`);
      this.isReady = true;
    } catch (error) {
      this.logger.error('Failed to initialize vector store:', error);
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingPipeline) throw new Error('Embedding model not loaded');
    const result = await this.embeddingPipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async findSimilar(query: string, topK: number = 3): Promise<{ chunk: KnowledgeChunk; score: number }[]> {
    if (!this.isReady) {
      this.logger.warn('Vector store not ready, returning empty results');
      return [];
    }
    const queryEmbedding = await this.generateEmbedding(query);
    const similarities = this.vectors.map(v => ({
      chunk: v.chunk,
      score: this.cosineSimilarity(queryEmbedding, v.embedding),
    }));
    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, topK);
  }
}