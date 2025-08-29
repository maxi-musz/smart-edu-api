import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AcademicSessionModule } from 'src/academic-session/academic-session.module';
import { PushNotificationsModule } from 'src/push-notifications/push-notifications.module';

@Module({
  imports: [PrismaModule, AcademicSessionModule, PushNotificationsModule],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService]
})
export class TeachersModule {}
