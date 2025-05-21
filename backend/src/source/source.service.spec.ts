import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SourceService } from './source.service';
import { Source } from './entities/source.entity';
import { FileProcessorService } from './services/file-processor.service';
import { WebCrawlerService } from './services/web-crawler.service';
import { TextProcessorService } from './services/text-processor.service';
import { QaProcessorService } from './services/qa-processor.service';
import { NotionService } from './services/notion.service';

describe('SourceService', () => {
  let service: SourceService;
  let repository: Repository<Source>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SourceService,
        {
          provide: getRepositoryToken(Source),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: FileProcessorService,
          useValue: {
            processFile: jest.fn(),
          },
        },
        {
          provide: WebCrawlerService,
          useValue: {
            crawlWebsite: jest.fn(),
            processSitemap: jest.fn(),
            fetchSinglePage: jest.fn(),
          },
        },
        {
          provide: TextProcessorService,
          useValue: {
            processText: jest.fn(),
          },
        },
        {
          provide: QaProcessorService,
          useValue: {
            processQaPairs: jest.fn(),
          },
        },
        {
          provide: NotionService,
          useValue: {
            fetchNotionContent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SourceService>(SourceService);
    repository = module.get<Repository<Source>>(getRepositoryToken(Source));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests for each service method
});