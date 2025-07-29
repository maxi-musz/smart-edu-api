import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { GetAllClassesDocs } from 'src/docs/director/classes';

@ApiTags('Classes')
@Controller('director/classes')
@UseGuards(JwtGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  // Fetch all classes
  // GET /api/v1/director/classes/fetch-all-classes
  // Protected endpoint
  @Get("fetch-all-classes")
  @GetAllClassesDocs.bearerAuth
  @GetAllClassesDocs.operation
  @GetAllClassesDocs.response200
  @GetAllClassesDocs.response401
  async getAllClasses(@GetUser() user: User) {
    return this.classesService.getAllClasses(user);
  }
}
