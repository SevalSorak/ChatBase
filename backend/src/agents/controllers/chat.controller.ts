import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ChatService } from '../services/chat.service';

@Controller('agents/:agentId/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @Param('agentId') agentId: string,
    @Body() body: { message: string; conversationId?: string },
    @Request() req,
  ) {
    const userId = req.user.id;
    
    return this.chatService.processMessage(
      agentId,
      userId,
      body.message,
      body.conversationId,
    );
  }
}