import { IsNotEmpty, IsString, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class QaPair {
  @ApiProperty({
    description: 'Question text',
    example: 'What is your return policy?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'Answer text',
    example: 'Our return policy allows returns within 30 days of purchase...',
  })
  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class CreateQaSourceDto {
  @ApiProperty({
    description: 'Title of the Q&A source',
    example: 'FAQ',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'List of question-answer pairs',
    type: [QaPair],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QaPair)
  questions: QaPair[];
}