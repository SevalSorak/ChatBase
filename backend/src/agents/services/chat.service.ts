import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { OpenAIService } from '../../shared/services/openai.service';
import { VectorService } from '../../shared/services/vector.service';
import { v4 as uuidv4 } from 'uuid';
import { Source } from '../../source/entities/source.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Agent)
    private agentsRepository: Repository<Agent>,
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Source)
    private sourceRepository: Repository<Source>,
    private openaiService: OpenAIService,
    private vectorService: VectorService,
  ) {}

  async processMessage(
    agentId: string,
    userId: string,
    content: string,
    conversationId?: string,
  ): Promise<{ message: Message; conversationId: string }> {
    // Check if agent exists and belongs to user
    const agent = await this.agentsRepository.findOne({
      where: { id: agentId, userId },
      relations: ['sources'],
    });

    if (!agent) {
      throw new NotFoundException('Agent not found or does not belong to user');
    }

    // Get or create conversation
    let conversation: Conversation | null;
    if (conversationId) {
      conversation = await this.conversationsRepository.findOne({
        where: { id: conversationId },
      });
      
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
    } else {
      conversation = this.conversationsRepository.create({
        id: uuidv4(),
        agentId,
        userId,
      });
      await this.conversationsRepository.save(conversation);
    }

    // Create user message
    const userMessage = this.messagesRepository.create({
      conversationId: conversation.id,
      role: 'user',
      content,
    });
    await this.messagesRepository.save(userMessage);

    // Get recent conversation history
    const recentMessages = await this.messagesRepository.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Create embedding for user query
    const queryEmbedding = await this.openaiService.createEmbedding(content);

    // Log the embedding to check its format and content
    console.log('Query Embedding Format Check:', typeof queryEmbedding, Array.isArray(queryEmbedding), queryEmbedding);

    // Find relevant content from vector database
    const similarVectors = await this.vectorService.findSimilarVectors(queryEmbedding);

    // Prepare context from relevant content
    let context = '';
    if (similarVectors.length > 0) {
      context = 'Based on the following information:\n\n';
      similarVectors.forEach((vector, index) => {
        context += `[Source ${index + 1}]:\n${vector.content}\n\n`;
      });
    }

    // Prepare system prompt
    const systemPrompt = agent.systemPrompt ||
      `You are a helpful assistant named ${agent.name}. ${agent.description || ''}`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system' as const, content: `${systemPrompt}\n\n${context}` },
      ...recentMessages
        .reverse()
        .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
    ];

    // Generate response from OpenAI
    const aiResponse = await this.openaiService.generateChatResponse(
      messages,
      agent.model || 'gpt-4',
      agent.temperature || 0.7,
    );

    // Create assistant message
    const assistantMessage = this.messagesRepository.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: aiResponse,
      metadata: {
        sources: similarVectors.map(v => v.id),
      },
    });
    await this.messagesRepository.save(assistantMessage);

    return {
      message: assistantMessage,
      conversationId: conversation.id,
    };
  }

  async getConversationHistory(
    conversationId: string,
    userId: string,
  ): Promise<Message[]> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found or does not belong to user');
    }

    return this.messagesRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async getAnswer(question: string, agentId: string): Promise<string> {
    // Create embedding for the question
    const questionEmbedding = await this.openaiService.createEmbedding(question);

    // Get all sources for the agent
    const sources = await this.sourceRepository.find({
      where: { agentId, processed: true },
    });

    // Find relevant chunks from all sources
    const relevantChunks = await Promise.all(
      sources.map(async (source) => {
        const vectorIds = source.metadata.vectorIds || [];
        const chunks = source.metadata.chunks || [];
        
        // Get similarity scores for each chunk
        const similarities = await Promise.all(
          vectorIds.map(async (vectorId) => {
            const similarity = await this.vectorService.calculateSimilarity(
              questionEmbedding,
              vectorId
            );
            return { vectorId, similarity };
          })
        );

        // Sort by similarity and get top chunks
        const topChunks = similarities
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 3)
          .map((item, index) => chunks[index]);

        return topChunks;
      })
    );

    // Flatten and join all relevant chunks
    const context = relevantChunks.flat().join('\n\n');

    // Generate answer using OpenAI
    const prompt = `
Context information is below.
---------------------
${context}
---------------------
Given the context information, please answer the following question:
${question}
If the answer cannot be found in the context, say "I don't have enough information to answer that question."
`;

    return this.openaiService.generateText(prompt);
  }
}