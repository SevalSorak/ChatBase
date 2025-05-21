import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, Query, UseGuards } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SourceService } from './source.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { CreateLinkSourceDto } from './dto/create-link-source.dto';
import { CreateTextSourceDto } from './dto/create-text-source.dto';
import { CreateQaSourceDto } from './dto/create-qa-source.dto';
import { User } from '../decorators/user.decorator';

@ApiTags('sources')
@Controller('sources')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SourceController {
  constructor(private readonly sourceService: SourceService) {}

  @Post('files')
  @ApiOperation({ summary: 'Upload file sources' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        agentId: {
          type: 'string',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('agentId') agentId: string,
    @User() user: any,
  ) {
    return this.sourceService.createFileSources(files, agentId, user.id);
  }

  @Post('text')
  @ApiOperation({ summary: 'Create text source' })
  createTextSource(
    @Body() createTextSourceDto: CreateTextSourceDto,
    @Query('agentId') agentId: string,
    @User() user: any,
  ) {
    return this.sourceService.createTextSource(createTextSourceDto, agentId, user.id);
  }

  @Post('links/crawl')
  @ApiOperation({ summary: 'Create link source by crawling' })
  createLinkSourceByCrawling(
    @Body() createLinkSourceDto: CreateLinkSourceDto,
    @Query('agentId') agentId: string,
    @User() user: any,
  ) {
    return this.sourceService.createLinkSourceByCrawling(createLinkSourceDto, agentId, user.id);
  }

  @Post('links/sitemap')
  @ApiOperation({ summary: 'Create link source from sitemap' })
  createLinkSourceFromSitemap(
    @Body() createLinkSourceDto: CreateLinkSourceDto,
    @Query('agentId') agentId: string,
    @User() user: any,
  ) {
    return this.sourceService.createLinkSourceFromSitemap(createLinkSourceDto, agentId, user.id);
  }

  @Post('links/individual')
  @ApiOperation({ summary: 'Create individual link source' })
  createIndividualLinkSource(
    @Body() createLinkSourceDto: CreateLinkSourceDto,
    @Query('agentId') agentId: string,
    @User() user: any,
  ) {
    return this.sourceService.createIndividualLinkSource(createLinkSourceDto, agentId, user.id);
  }

  @Post('qa')
  @ApiOperation({ summary: 'Create Q&A source' })
  createQaSource(
    @Body() createQaSourceDto: CreateQaSourceDto,
    @Query('agentId') agentId: string,
    @User() user: any,
  ) {
    return this.sourceService.createQaSource(createQaSourceDto, agentId, user.id);
  }

  @Post('notion')
  @ApiOperation({ summary: 'Create Notion source' })
  createNotionSource(
    @Body() createNotionSourceDto: any,
    @Query('agentId') agentId: string,
    @User() user: any,
  ) {
    return this.sourceService.createNotionSource(createNotionSourceDto, agentId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sources' })
  findAll(@User() user: any) {
    return this.sourceService.findAll(user.id);
  }

  @Get('agent/:agentId')
  @ApiOperation({ summary: 'Get sources by agent ID' })
  findByAgentId(@Param('agentId') agentId: string, @User() user: any) {
    return this.sourceService.findByAgentId(agentId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get source by ID' })
  findOne(@Param('id') id: string, @User() user: any) {
    return this.sourceService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update source' })
  update(
    @Param('id') id: string,
    @Body() updateSourceDto: UpdateSourceDto,
    @User() user: any,
  ) {
    return this.sourceService.update(id, updateSourceDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete source' })
  remove(@Param('id') id: string, @User() user: any) {
    return this.sourceService.remove(id, user.id);
  }
}