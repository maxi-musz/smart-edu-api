import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TemEndpointController } from './tem-endpoint.controller';
import { TemEndpointService } from './tem-endpoint.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExcelProcessorService } from 'src/shared/services/excel-processor.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import * as colors from 'colors';
import { AcademicSessionModule } from '../../academic-session/academic-session.module';
import { PushNotificationsModule } from 'src/push-notifications/push-notifications.module';
import { StorageModule } from 'src/shared/services/providers/storage.module';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AcademicSessionModule,
    PushNotificationsModule,
    StorageModule,
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
      inject: [ConfigService]
    })
  ],
  controllers: [AuthController, TemEndpointController],
  providers: [AuthService, JwtStrategy, ExcelProcessorService, TemEndpointService],
  exports: [AuthService]
})
export class AuthModule {}
