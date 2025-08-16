import { Controller, Get, Post, Put, UseGuards, Request, Body, Param, Patch } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { GetAllClassesDocs, CreateClassDocs, EditClassDocs } from 'src/docs/director/classes';
import { CreateClassDto, EditClassDto } from './dto/class.dto';

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

  // Create a new class
  // POST /api/v1/director/classes/create-class
  // Protected endpoint
  @Post("create-class")
  @CreateClassDocs.bearerAuth
  @CreateClassDocs.operation
  @CreateClassDocs.response200
  @CreateClassDocs.response400
  @CreateClassDocs.response401
  async createClass(@GetUser() user: User, @Body() createClassDto: CreateClassDto) {
    return this.classesService.createClass(user, createClassDto);
  }

  // Edit a class
  // PUT /api/v1/director/classes/edit-class/:classId
  // Protected endpoint
  @Patch("edit-class/:classId")
  @EditClassDocs.bearerAuth
  @EditClassDocs.operation
  @EditClassDocs.response200
  @EditClassDocs.response400
  @EditClassDocs.response401
  async editClass(
    @GetUser() user: User, 
    @Param('classId') classId: string, 
    @Body() editClassDto: EditClassDto
  ) {
    return this.classesService.editClass(user, classId, editClassDto);
  }
}
