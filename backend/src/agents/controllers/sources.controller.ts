import { Controller, Post, Param, UseInterceptors, UploadedFile, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SourcesService } from '../services/sources.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('agents/:agentId/sources')
@UseGuards(JwtAuthGuard)
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Post('files')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'text/plain',
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Unsupported file type. Only PDF, DOCX, and TXT files are allowed.'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadFile(
    @Param('agentId') agentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    
    // Process the file and extract text content
    const source = await this.sourcesService.processFileUpload(
      agentId,
      userId,
      file,
    );
    
    return source;
  }
}