import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';

@Injectable()
export class FileProcessorService {
  async processFile(file: Express.Multer.File): Promise<string> {
    const { mimetype, path: filePath } = file;
    
    try {
      switch (mimetype) {
        case 'application/pdf':
          return await this.processPdf(filePath);
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.processWord(filePath);
        case 'text/plain':
          return await this.processText(filePath);
        default:
          throw new BadRequestException(`Unsupported file type: ${mimetype}`);
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      throw new BadRequestException(`Failed to process file: ${error.message}`);
    }
  }

  private async processPdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  private async processWord(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  private async processText(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf8');
  }
}