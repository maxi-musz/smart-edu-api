import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AcademicSessionModule } from '../../../academic-session/academic-session.module';

@Module({
    imports: [PrismaModule, AcademicSessionModule],
    controllers: [StudentsController],
    providers: [StudentsService],
    exports: [StudentsService]
})
export class StudentsModule {}
