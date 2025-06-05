import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that answers questions based on the provided context.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('OpenAI\'dan metin üretimi için içerik alınamadı.');
      }

      return content;
    } catch (error) {
      console.error('Error generating text:', error);
      throw error;
    }
  }

  async generateChatResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    model: string = 'gpt-4',
    temperature: number = 0.7,
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages,
        temperature,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return content;
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw error;
    }
  }
}