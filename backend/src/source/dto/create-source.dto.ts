import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceType } from '../entities/source.entity';

export class CreateSourceDto {
  @ApiProperty({
    description: 'Name of the source',
    example: 'Company Handbook',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Type of the source',
    enum: SourceType,
    example: SourceType.FILE,
  })
  @IsEnum(SourceType)
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({
    description: 'Path to the file (for file sources)',
    example: '/uploads/document.pdf',
  })
  @IsString()
  @IsOptional()
  filePath?: string;

  @ApiPropertyOptional({
    description: 'MIME type of the file (for file sources)',
    example: 'application/pdf',
  })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Size of the source in bytes',
    example: 1024,
  })
  @IsNumber()
  @IsOptional()
  size?: number;

  @ApiPropertyOptional({
    description: 'Content of the source',
    example: 'This is the content of the document...',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the source',
    example: { pageCount: 10, author: 'John Doe' },
  })
  @IsObject()
  @IsOptional()
  metadata?: any;

  @ApiProperty({
    description: 'ID of the agent this source belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  agentId: string;
}