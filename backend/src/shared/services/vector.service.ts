import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class VectorService {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    // Initialize pgvector extension if not exists
    this.initPgVector();
  }

  private async initPgVector() {
    try {
      // Create the extension if it doesn't exist
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS vector');
      
      // Create the vectors table if it doesn't exist
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS vectors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          embedding vector(1536),
          content TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      // Create an index for similarity search
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS vectors_embedding_idx ON vectors 
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
      `);
    } catch (error) {
      console.error('Error initializing pgvector:', error);
      throw error;
    }
  }

  async storeEmbedding(
    embedding: number[],
    content: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    try {
      const result = await this.dataSource.query(
        `INSERT INTO vectors (embedding, content, metadata) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [embedding, content, JSON.stringify(metadata)],
      );
      
      return result[0].id;
    } catch (error) {
      console.error('Error storing embedding:', error);
      throw error;
    }
  }

  async findSimilarVectors(
    embedding: number[],
    limit: number = 5,
    threshold: number = 0.7,
  ): Promise<Array<{ id: string; content: string; similarity: number }>> {
    try {
      const result = await this.dataSource.query(
        `SELECT id, content, 1 - (embedding <=> $1) as similarity
         FROM vectors
         WHERE 1 - (embedding <=> $1) > $3
         ORDER BY similarity DESC
         LIMIT $2`,
        [embedding, limit, threshold],
      );
      
      return result;
    } catch (error) {
      console.error('Error finding similar vectors:', error);
      throw error;
    }
  }
}