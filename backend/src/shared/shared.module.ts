import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './services/openai.service';
import { VectorService } from './services/vector.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenAIService, VectorService],
  exports: [OpenAIService, VectorService],
})
export class SharedModule {}