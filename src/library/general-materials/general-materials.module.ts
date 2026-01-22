import { Module } from '@nestjs/common';
import { GeneralMaterialsController } from './general-materials.controller';
import { GeneralMaterialsService } from './general-materials.service';
import { ExploreAiBooksService } from './explore-aibooks.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryAuthModule } from '../library-auth/library-auth.module';
import { S3Module } from '../../shared/services/s3.module';
import { UploadModule } from '../../shared/upload/upload.module';
import { AiChatModule } from '../../school/ai-chat/ai-chat.module';

@Module({
  imports: [PrismaModule, LibraryAuthModule, S3Module, UploadModule, AiChatModule],
  controllers: [GeneralMaterialsController],
  providers: [GeneralMaterialsService, ExploreAiBooksService],
  exports: [GeneralMaterialsService, ExploreAiBooksService],
})
export class GeneralMaterialsModule {}

