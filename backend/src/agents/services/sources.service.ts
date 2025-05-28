import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Source } from '../entities/source.entity';
import { Agent } from '../entities/agent.entity';
import { OpenAIService } from '../../shared/services/openai.service';
import { readFileSync } from 'fs';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import { VectorService } from '../../shared/services/vector.service';

@Injectable()
export class SourcesService {
  constructor(
    @InjectRepository(Source)
    private sourcesRepository: Repository<Source>,
    @InjectRepository(Agent)
    private agentsRepository: Repository<Agent>,
    private openaiService: OpenAIService,
    private vectorService: VectorService,
  ) {}

  async processFileUpload(
    agentId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<Source> {
    // Check if agent exists and belongs to user
    const agent = await this.agentsRepository.findOne({
      where: { id: agentId, userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found or does not belong to user');
    }

    // Extract text from file based on file type
    let content = '';
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || '';

    try {
      if (fileExtension === 'pdf') {
        const dataBuffer = readFileSync(file.path);
        const pdfData = await pdf(dataBuffer);
        content = pdfData.text;
      } else if (fileExtension === 'docx') {
        const dataBuffer = readFileSync(file.path);
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        content = result.value;
      } else if (fileExtension === 'txt') {
        content = readFileSync(file.path, 'utf8');
      } else {
        throw new BadRequestException('Unsupported file type');
      }

      // Create embedding for the content
      const embedding = await this.openaiService.createEmbedding(content);
      
      // Store the embedding in vector database
      const vectorId = await this.vectorService.storeEmbedding(embedding, content);

      // Create source record
      const source = this.sourcesRepository.create({
        agentId,
        name: file.originalname,
        type: 'file',
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        content,
        vectorId,
      });

      return await this.sourcesRepository.save(source);
    } catch (error) {
      throw new BadRequestException(`Error processing file: ${error.message}`);
    }
  }

  async getSourcesByAgentId(agentId: string, userId: string): Promise<Source[]> {
    const agent = await this.agentsRepository.findOne({
      where: { id: agentId, userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found or does not belong to user');
    }

    return this.sourcesRepository.find({
      where: { agentId },
      select: ['id', 'name', 'type', 'fileSize', 'mimeType', 'createdAt'],
    });
  }
}