import { Module } from '@nestjs/common';
import { LibraryAuthController } from './library-auth.controller';
import { LibraryAuthService } from './library-auth.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LibraryJwtStrategy, LibraryJwtGuard } from './guard/library-jwt.guard';

@Module({
  imports: [
    PrismaModule,
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
  controllers: [LibraryAuthController],
  providers: [LibraryAuthService, LibraryJwtStrategy, LibraryJwtGuard],
  exports: [LibraryAuthService, LibraryJwtGuard],
})
export class LibraryAuthModule {}


