import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { SourceService } from './source.service';
import { SourceController } from './source.controller';
import { Source } from './entities/source.entity';
import { FileProcessorService } from './services/file-processor.service';
import { WebCrawlerService } from './services/web-crawler.service';
import { TextProcessorService } from './services/text-processor.service';
import { QaProcessorService } from './services/qa-processor.service';
import { NotionService } from './services/notion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Source]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = uuidv4();
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Unsupported file type'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [SourceController],
  providers: [
    SourceService,
    FileProcessorService,
    WebCrawlerService,
    TextProcessorService,
    QaProcessorService,
    NotionService,
  ],
  exports: [SourceService],
})
export class SourceModule {}