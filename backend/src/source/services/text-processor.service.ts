import { Injectable } from '@nestjs/common';
import { OpenAIService } from '../../shared/services/openai.service';
import { VectorService } from '../../shared/services/vector.service';

@Injectable()
export class TextProcessorService {
  constructor(
    private openaiService: OpenAIService,
    private vectorService: VectorService,
  ) {}

  async processText(text: string): Promise<{ chunks: string[], vectorIds: string[] }> {
    // Split text into chunks (approximately 1000 characters each)
    const chunks = this.splitIntoChunks(text);
    
    // Create embeddings for each chunk
    const vectorIds = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await this.openaiService.createEmbedding(chunk);
        return this.vectorService.storeEmbedding(embedding, chunk);
      })
    );

    return { chunks, vectorIds };
  }

  private splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        // If a single sentence is longer than maxChunkSize, split it into words
        if (sentence.length > maxChunkSize) {
          const words = sentence.split(/\s+/);
          let tempChunk = '';
          for (const word of words) {
            if (tempChunk.length + word.length > maxChunkSize) {
              chunks.push(tempChunk.trim());
              tempChunk = word;
            } else {
              tempChunk += (tempChunk ? ' ' : '') + word;
            }
          }
          if (tempChunk) {
            currentChunk = tempChunk;
          }
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}