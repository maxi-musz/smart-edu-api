import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HelloModule } from './hello/hello.module';
import { AdminModule } from './admin/admin.module';
import { SchoolModule } from './school/school.module';
import { AcademicSessionModule } from './academic-session/academic-session.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { SchedulesModule } from './school/director/schedules/schedules.module';
import { LibraryModule } from './library/library.module';
import { DeveloperModule } from './developer/developer.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import * as joi from 'joi';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserModule } from './user/user.module';
import { AiChatLatestModule } from './ai-chat-latest/ai-chat-latest.module';
import { RequestLoggerMiddleware } from './shared/middleware/request-logger.middleware';
import { ExploreModule } from './explore/explore.module';
import { ExamPracticeModule } from './exam-practice/exam-practice.module';
import { VideoModule } from './video/video.module';
import { LibraryAccessControlModule } from './library-access-control/library-access-control.module';
import { SchoolAccessControlModule } from './school-access-control/school-access-control.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
      envFilePath: '.env', // Path to your environment variables file
      load: [appConfig, databaseConfig],
      // validationSchema: joi.object({
      //   NODE_ENV: joi.string().valid('development', 'staging', 'production').required(),
      //   DATABASE_URL: joi.string().required(),
      //   DATABASE_URL_STAGING: joi.string().required(),
      //   DATABASE_URL_PRODUCTION: joi.string().required(),
      // }),
    }),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    HelloModule, 
    AdminModule, 
    SchoolModule, 
    AcademicSessionModule,
    PushNotificationsModule,
    SchedulesModule,
    PrismaModule,
    UserModule,
    LibraryModule,
    DeveloperModule,
    AiChatLatestModule,
    ExploreModule,
    ExamPracticeModule,
    VideoModule,
    LibraryAccessControlModule,
    SchoolAccessControlModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request logger to all routes
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes('*');
  }
}
