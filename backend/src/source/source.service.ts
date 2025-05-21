import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Source } from './entities/source.entity';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { CreateLinkSourceDto } from './dto/create-link-source.dto';
import { CreateTextSourceDto } from './dto/create-text-source.dto';
import { CreateQaSourceDto } from './dto/create-qa-source.dto';
import { FileProcessorService } from './services/file-processor.service';
import { WebCrawlerService } from './services/web-crawler.service';
import { TextProcessorService } from './services/text-processor.service';
import { QaProcessorService } from './services/qa-processor.service';
import { NotionService } from './services/notion.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SourceService {
  constructor(
    @InjectRepository(Source)
    private sourceRepository: Repository<Source>,
    private fileProcessorService: FileProcessorService,
    private webCrawlerService: WebCrawlerService,
    private textProcessorService: TextProcessorService,
    private qaProcessorService: QaProcessorService,
    private notionService: NotionService,
  ) {}

  async createFileSources(files: Express.Multer.File[], agentId: string, userId: string): Promise<Source[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const sources: Source[] = [];

    for (const file of files) {
      try {
        const content = await this.fileProcessorService.processFile(file);
        
        const source = this.sourceRepository.create({
          name: file.originalname,
          type: 'file',
          agentId,
          userId,
          filePath: file.path,
          mimeType: file.mimetype,
          size: file.size,
          content,
          metadata: {
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          },
        });

        const savedSource = await this.sourceRepository.save(source);
        sources.push(savedSource);
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        // Continue with other files even if one fails
      }
    }

    return sources;
  }

  async createTextSource(createTextSourceDto: CreateTextSourceDto, agentId: string, userId: string): Promise<Source> {
    const { title, content } = createTextSourceDto;
    
    const processedContent = await this.textProcessorService.processText(content);
    
    const source = this.sourceRepository.create({
      name: title,
      type: 'text',
      agentId,
      userId,
      content: processedContent,
      size: Buffer.byteLength(content, 'utf8'),
      metadata: {
        title,
        charCount: content.length,
      },
    });

    return this.sourceRepository.save(source);
  }

  async createLinkSourceByCrawling(createLinkSourceDto: CreateLinkSourceDto, agentId: string, userId: string): Promise<Source> {
    const { url, includePaths, excludePaths } = createLinkSourceDto;
    
    const crawlResult = await this.webCrawlerService.crawlWebsite(url, includePaths, excludePaths);
    
    const source = this.sourceRepository.create({
      name: `Crawled: ${url}`,
      type: 'link',
      agentId,
      userId,
      content: crawlResult.content,
      size: Buffer.byteLength(crawlResult.content, 'utf8'),
      metadata: {
        url,
        pageCount: crawlResult.pageCount,
        includePaths,
        excludePaths,
      },
    });

    return this.sourceRepository.save(source);
  }

  async createLinkSourceFromSitemap(createLinkSourceDto: CreateLinkSourceDto, agentId: string, userId: string): Promise<Source> {
    const { url, includePaths, excludePaths } = createLinkSourceDto;
    
    const sitemapResult = await this.webCrawlerService.processSitemap(url, includePaths, excludePaths);
    
    const source = this.sourceRepository.create({
      name: `Sitemap: ${url}`,
      type: 'link',
      agentId,
      userId,
      content: sitemapResult.content,
      size: Buffer.byteLength(sitemapResult.content, 'utf8'),
      metadata: {
        url,
        pageCount: sitemapResult.pageCount,
        includePaths,
        excludePaths,
      },
    });

    return this.sourceRepository.save(source);
  }

  async createIndividualLinkSource(createLinkSourceDto: CreateLinkSourceDto, agentId: string, userId: string): Promise<Source> {
    const { url } = createLinkSourceDto;
    
    const pageContent = await this.webCrawlerService.fetchSinglePage(url);
    
    const source = this.sourceRepository.create({
      name: `Page: ${url}`,
      type: 'link',
      agentId,
      userId,
      content: pageContent,
      size: Buffer.byteLength(pageContent, 'utf8'),
      metadata: {
        url,
        pageCount: 1,
      },
    });

    return this.sourceRepository.save(source);
  }

  async createQaSource(createQaSourceDto: CreateQaSourceDto, agentId: string, userId: string): Promise<Source> {
    const { title, questions } = createQaSourceDto;
    
    const processedContent = await this.qaProcessorService.processQaPairs(questions);
    
    const source = this.sourceRepository.create({
      name: title,
      type: 'qa',
      agentId,
      userId,
      content: processedContent,
      size: Buffer.byteLength(processedContent, 'utf8'),
      metadata: {
        title,
        questionCount: questions.length,
      },
    });

    return this.sourceRepository.save(source);
  }

  async createNotionSource(createNotionSourceDto: any, agentId: string, userId: string): Promise<Source> {
    const { notionPageId, accessToken } = createNotionSourceDto;
    
    const notionContent = await this.notionService.fetchNotionContent(notionPageId, accessToken);
    
    const source = this.sourceRepository.create({
      name: `Notion: ${notionContent.title}`,
      type: 'notion',
      agentId,
      userId,
      content: notionContent.content,
      size: Buffer.byteLength(notionContent.content, 'utf8'),
      metadata: {
        notionPageId,
        title: notionContent.title,
      },
    });

    return this.sourceRepository.save(source);
  }

  async findAll(userId: string): Promise<Source[]> {
    return this.sourceRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByAgentId(agentId: string, userId: string): Promise<Source[]> {
    return this.sourceRepository.find({
      where: { agentId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Source> {
    const source = await this.sourceRepository.findOne({
      where: { id, userId },
    });

    if (!source) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }

    return source;
  }

  async update(id: string, updateSourceDto: UpdateSourceDto, userId: string): Promise<Source> {
    const source = await this.findOne(id, userId);
    
    const updatedSource = { ...source, ...updateSourceDto };
    
    return this.sourceRepository.save(updatedSource);
  }

  async remove(id: string, userId: string): Promise<void> {
    const source = await this.findOne(id, userId);
    
    // If it's a file source, delete the file
    if (source.type === 'file' && source.filePath) {
      try {
        fs.unlinkSync(source.filePath);
      } catch (error) {
        console.error(`Error deleting file ${source.filePath}:`, error);
      }
    }
    
    await this.sourceRepository.remove(source);
  }
}