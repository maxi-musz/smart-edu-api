import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { GradingScaleService } from './grading-scale.service';
import { UpdateSchoolGradeScaleDto } from './dto/grading-scale.dto';

@ApiTags('Director Grading Scale')
@Controller('director/grading-scale')
@UseGuards(JwtGuard)
export class GradingScaleController {
  constructor(private readonly gradingScaleService: GradingScaleService) {}

  @Get()
  getScale(@GetUser() user: { sub: string }) {
    return this.gradingScaleService.getScaleForDirector(user.sub);
  }

  @Put()
  updateScale(
    @GetUser() user: { sub: string },
    @Body() dto: UpdateSchoolGradeScaleDto,
  ) {
    return this.gradingScaleService.updateScale(user.sub, dto);
  }

  @Delete()
  deleteScale(@GetUser() user: { sub: string }) {
    return this.gradingScaleService.deleteScale(user.sub);
  }
}
