import { Controller, Post, UseInterceptors, UploadedFiles, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { AgentService } from './agent.service';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './uploads';
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const ext = extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new HttpException(`Unsupported file type: ${ext}`, HttpStatus.BAD_REQUEST), false);
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  }))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    // 400KB toplam limit kontrolü
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 400 * 1024) {
      throw new BadRequestException('Total file size exceeds 400KB limit');
    }

    return {
      message: 'Files uploaded successfully!',
      files: files.map(f => ({
        originalName: f.originalname,
        filename: f.filename,
        path: f.path,
        size: f.size,
      })),
    };
  }
}
