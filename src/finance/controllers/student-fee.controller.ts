import { Controller, Get, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { StudentFeeService } from '../services/student-fee.service';
import { StudentFeeQueryDto } from '../dto/transaction.dto';
import * as colors from 'colors';

@ApiTags('Finance - Student Fees')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finance/:schoolId')
export class StudentFeeController {
  private readonly logger = new Logger(StudentFeeController.name);

  constructor(private readonly studentFeeService: StudentFeeService) {}

  @Get('students/:studentId/fees')
  async getStudentFees(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Query() query: StudentFeeQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/students/${studentId}/fees — get student fees`));
    try {
      const result = await this.studentFeeService.getStudentFees(schoolId, studentId, query);
      this.logger.log(colors.green(`✅ HTTP Response: Total of ${result.data.total} fees  returned successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to get fees for student`), error.stack);
      throw error;
    }
  }

  @Get('students/:studentId/fees/:feeId')
  async getStudentFeeDetail(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Param('feeId') feeId: string,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/students/${studentId}/fees/${feeId} — get student fee detail`));
    try {
      const result = await this.studentFeeService.getStudentFeeDetail(schoolId, studentId, feeId);
      this.logger.log(colors.green(`✅ HTTP Response: Fee ${feeId} detail for student ${studentId} returned successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to get fee ${feeId} detail for student ${studentId}`), error.stack);
      throw error;
    }
  }

  @Get('classes/:classId/fees')
  async getClassFees(
    @Param('schoolId') schoolId: string,
    @Param('classId') classId: string,
    @Query() query: StudentFeeQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/classes/${classId}/fees — get class fees`));
    try {
      const result = await this.studentFeeService.getClassFees(schoolId, classId, query);
      this.logger.log(colors.green(`✅ HTTP Response: Fees for class ${classId} returned successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to get fees for class ${classId}`), error.stack);
      throw error;
    }
  }
}
