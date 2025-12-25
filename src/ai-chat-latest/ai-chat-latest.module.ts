import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiChatLatestGateway } from './ai-chat-latest.gateway';
import { AiChatSocketService } from './services/ai-chat-socket.service';
import { SocketJwtGuard } from './guards/socket-jwt.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AiChatModule } from '../school/ai-chat/ai-chat.module';

/**
 * AI Chat Latest Module
 * Provides real-time AI chat functionality via Socket.IO
 */
@Module({
  imports: [
    PrismaModule,
    AiChatModule, // Import existing AI chat module to reuse services
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const secret = config.get('JWT_SECRET');
        const expiresIn = config.get('JWT_EXPIRES_IN') || '7d';
        
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    AiChatLatestGateway,
    AiChatSocketService,
    SocketJwtGuard,
  ],
  exports: [
    AiChatLatestGateway,
    AiChatSocketService,
  ],
})
export class AiChatLatestModule {}

