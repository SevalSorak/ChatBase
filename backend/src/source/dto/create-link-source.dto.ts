import { IsNotEmpty, IsString, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLinkSourceDto {
  @ApiProperty({
    description: 'URL to crawl or fetch',
    example: 'https://example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiPropertyOptional({
    description: 'Paths to include in crawling (comma-separated)',
    example: 'blog/*,docs/*',
  })
  @IsString()
  @IsOptional()
  includePaths?: string;

  @ApiPropertyOptional({
    description: 'Paths to exclude from crawling (comma-separated)',
    example: 'admin/*,private/*',
  })
  @IsString()
  @IsOptional()
  excludePaths?: string;
}