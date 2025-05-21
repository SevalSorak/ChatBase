import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty({
    description: 'The name of the agent',
    example: 'Customer Support Bot',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    description: 'Optional description of the agent',
    example: 'This agent handles customer support inquiries',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional model to use for the agent',
    example: 'gpt-4',
    default: 'gpt-3.5-turbo',
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    description: 'Optional temperature setting for the agent',
    example: 0.7,
    default: 0.5,
  })
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Optional system prompt for the agent',
    example: 'You are a helpful customer support assistant.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  systemPrompt?: string;
}