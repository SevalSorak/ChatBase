import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { Source } from '../source/entities/source.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    @InjectRepository(Source)
    private sourceRepository: Repository<Source>,
  ) {}

  async create(createAgentDto: CreateAgentDto, userId: string): Promise<Agent> {
    const agent = this.agentRepository.create({
      ...createAgentDto,
      userId,
    });
    return this.agentRepository.save(agent);
  }

  async findAll(userId: string, options: { page: number; limit: number }) {
    const [agents, total] = await this.agentRepository.findAndCount({
      where: { userId },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      relations: ['sources'],
    });

    return {
      agents,
      meta: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id, userId },
      relations: ['sources'],
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return agent;
  }

  async remove(id: string, userId: string): Promise<void> {
    const agent = await this.findOne(id, userId);
    
    if (agent.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this agent');
    }
    
    await this.agentRepository.remove(agent);
  }

  async addFileSources(agentId: string, files: Express.Multer.File[], userId: string) {
    const agent = await this.findOne(agentId, userId);
    
    const sources = await Promise.all(
      files.map(async (file) => {
        let content = '';
        
        // Extract text from files based on type
        if (file.mimetype === 'application/pdf') {
          const dataBuffer = fs.readFileSync(file.path);
          const data = await pdf(dataBuffer);
          content = data.text;
        } else if (file.mimetype.includes('word')) {
          const result = await mammoth.extractRawText({ path: file.path });
          content = result.value;
        } else {
          content = fs.readFileSync(file.path, 'utf8');
        }
        
        const source = this.sourceRepository.create({
          name: file.originalname,
          type: 'file',
          filePath: file.path,
          size: file.size,
          content,
          agent,
        });
        
        return this.sourceRepository.save(source);
      }),
    );
    
    return sources;
  }

  async addTextSource(agentId: string, textData: { title: string; content: string }, userId: string) {
    const agent = await this.findOne(agentId, userId);
    
    const source = this.sourceRepository.create({
      name: textData.title,
      type: 'text',
      content: textData.content,
      size: Buffer.byteLength(textData.content, 'utf8'),
      agent,
    });
    
    return this.sourceRepository.save(source);
  }

  async addLinkSource(agentId: string, linkData: { url: string; includePaths?: string; excludePaths?: string }, userId: string) {
    const agent = await this.findOne(agentId, userId);
    
    const source = this.sourceRepository.create({
      name: linkData.url,
      type: 'link',
      url: linkData.url,
      metadata: {
        includePaths: linkData.includePaths,
        excludePaths: linkData.excludePaths,
      },
      agent,
    });
    
    return this.sourceRepository.save(source);
  }

  async addQASource(agentId: string, qaData: { title: string; questions: { question: string; answer: string }[] }, userId: string) {
    const agent = await this.findOne(agentId, userId);
    
    const content = JSON.stringify(qaData.questions);
    
    const source = this.sourceRepository.create({
      name: qaData.title,
      type: 'qa',
      content,
      size: Buffer.byteLength(content, 'utf8'),
      metadata: {
        questionCount: qaData.questions.length,
      },
      agent,
    });
    
    return this.sourceRepository.save(source);
  }
}