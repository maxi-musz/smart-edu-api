import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GradingScaleController } from './grading-scale.controller';
import { GradingScaleService } from './grading-scale.service';

@Module({
  imports: [PrismaModule],
  controllers: [GradingScaleController],
  providers: [GradingScaleService],
  exports: [GradingScaleService],
})
export class GradingScaleModule {}
