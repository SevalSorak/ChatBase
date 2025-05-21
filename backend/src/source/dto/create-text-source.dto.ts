import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTextSourceDto {
  @ApiProperty({
    description: 'Title of the text source',
    example: 'Company Policies',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'Content of the text source',
    example: 'These are the company policies...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}