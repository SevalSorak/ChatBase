import { Injectable } from '@nestjs/common';

@Injectable()
export class AgentService {
  async processFiles(files: Express.Multer.File[]) {
    // Dosya işleme mantığı
    return {
      message: 'Files processed successfully',
      files: files.map(file => ({
        name: file.originalname,
        size: file.size
      }))
    };
  }
}
