import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { ExploreAssessmentController } from './explore.assessment.controller';
import { ExploreAssessmentService } from './explore.assessment.service';
import { ExploreAiBooksController } from './explore-aibooks.controller';
import { ExploreAiBooksService } from './explore-aibooks.service';
import { ExploreChatGateway } from './socket/explore-chat.gateway';
import { ExploreChatSocketJwtGuard } from './socket/socket-jwt.guard';
import { ChatService } from './chat/chat.service';
import { ChatTTSController } from './chat/chat-tts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LibraryAuthModule } from '../library/library-auth/library-auth.module';
import { SchoolAccessControlModule } from '../school-access-control/school-access-control.module';
import { AiChatModule } from '../school/ai-chat/ai-chat.module';
import { ExploreChatServicesModule } from './chat/explore-chat-services.module';
import { ExploreExamBodyModule } from './exam-body/exam-body.module';

@Module({
  imports: [
    ExploreExamBodyModule,
    PrismaModule,
    LibraryAuthModule,
    SchoolAccessControlModule,
    AiChatModule, // Import to use DocumentProcessingService for Pinecone chunk searching
    ExploreChatServicesModule, // Import to use TextToSpeechService
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
  controllers: [ExploreController, ExploreAssessmentController, ExploreAiBooksController, ChatTTSController],
  providers: [
    ExploreService,
    ExploreAssessmentService,
    ExploreAiBooksService,
    ExploreChatGateway,
    ExploreChatSocketJwtGuard,
    ChatService,
  ],
  exports: [ExploreService, ExploreAiBooksService, ExploreChatGateway],
})
export class ExploreModule {}

