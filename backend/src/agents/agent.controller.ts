import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  create(@Body() createAgentDto: CreateAgentDto, @Req() req) {
    return this.agentService.create(createAgentDto, req.user.id);
  }

  @Get()
  findAll(@Req() req, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.agentService.findAll(req.user.id, { page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.agentService.findOne(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.agentService.remove(id, req.user.id);
  }

  @Post(':id/sources/files')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|doc|docx|txt)$/)) {
          return cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadFiles(@Param('id') id: string, @UploadedFiles() files, @Req() req) {
    return this.agentService.addFileSources(id, files, req.user.id);
  }

  @Post(':id/sources/text')
  addTextSource(@Param('id') id: string, @Body() textData: { title: string; content: string }, @Req() req) {
    return this.agentService.addTextSource(id, textData, req.user.id);
  }

  @Post(':id/sources/links')
  addLinkSource(@Param('id') id: string, @Body() linkData: { url: string; includePaths?: string; excludePaths?: string }, @Req() req) {
    return this.agentService.addLinkSource(id, linkData, req.user.id);
  }

  @Post(':id/sources/qa')
  addQASource(@Param('id') id: string, @Body() qaData: { title: string; questions: { question: string; answer: string }[] }, @Req() req) {
    return this.agentService.addQASource(id, qaData, req.user.id);
  }
}