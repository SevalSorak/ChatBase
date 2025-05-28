import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentController } from './agent.controller';
import { SourcesController } from './controllers/sources.controller';
import { ChatController } from './controllers/chat.controller';
import { AgentService } from './agent.service';
import { SourcesService } from './services/sources.service';
import { ChatService } from './services/chat.service';
import { Agent } from './entities/agent.entity';
import { Source } from './entities/source.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, Source, Conversation, Message]),
    SharedModule,
  ],
  controllers: [AgentController, SourcesController, ChatController],
  providers: [AgentService, SourcesService, ChatService],
  exports: [AgentService, SourcesService, ChatService],
})
export class AgentsModule {}