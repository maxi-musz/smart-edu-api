import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import { UpdateAcademicSessionDto, UpdateTermDto } from './dto/update-academic-session.dto';
import { ApiResponse } from '../../shared/helper-functions/response';
import { AcademicTerm } from '@prisma/client';
import * as colors from 'colors';

@Injectable()
export class SessionAndTermService {
  private readonly logger = new Logger(SessionAndTermService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new academic session for a school
   * Automatically creates the specified number of terms (defaults to 3)
   */
  async createAcademicSession(createDto: CreateAcademicSessionDto): Promise<ApiResponse<any>> {
    const numberOfTerms = createDto.number_of_terms || 3;
    this.logger.log(colors.cyan(`Creating academic session for school: ${createDto.school_id} with ${numberOfTerms} term(s)`));

    try {
      // Validate that school exists
      const school = await this.prisma.school.findUnique({
        where: { id: createDto.school_id }
      });

      if (!school) {
        this.logger.error(colors.red(`❌ School not found: ${createDto.school_id}`));
        return new ApiResponse(false, 'School not found', null);
      }

      // Check if any session with same academic year already exists
      const existingSessions = await this.prisma.academicSession.findMany({
        where: {
          school_id: createDto.school_id,
          academic_year: createDto.academic_year
        }
      });

      if (existingSessions.length > 0) {
        this.logger.warn(colors.yellow(`⚠️ Academic session already exists: ${createDto.academic_year}`));
        return new ApiResponse(false, 'Academic session with this year already exists. Please delete existing sessions first.', null);
      }

      // Calculate dates for the academic year
      // Default start_date: September 1st of start_year
      const sessionStart = createDto.start_date 
        ? new Date(createDto.start_date)
        : new Date(createDto.start_year, 8, 1); // Month 8 = September (0-indexed)
      
      // Default end_date: August 31st of end_year
      const sessionEnd = createDto.end_date 
        ? new Date(createDto.end_date) 
        : new Date(createDto.end_year, 7, 31); // Month 7 = August (0-indexed), day 31

      // Validate minimum 30 days between start and end dates if both are provided
      if (createDto.start_date && createDto.end_date) {
        const daysDifference = Math.ceil((sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDifference < 30) {
          this.logger.error(colors.red(`❌ Date validation failed: Minimum 30 days required between start and end dates`));
          return new ApiResponse(false, 'Start date and end date must have at least 30 days between them', null);
        }
      }

      // Calculate total duration in milliseconds
      const totalDuration = sessionEnd.getTime() - sessionStart.getTime();
      const termDuration = totalDuration / numberOfTerms; // Divide equally among terms

      // If this session is marked as current, deactivate other current sessions
      if (createDto.is_current) {
        await this.prisma.academicSession.updateMany({
          where: {
            school_id: createDto.school_id,
            is_current: true
          },
          data: {
            is_current: false
          }
        });
        this.logger.log(colors.cyan(`   - Deactivated other current sessions for school`));
      }

      // Define available terms
      const availableTerms: AcademicTerm[] = ['first', 'second', 'third'];
      const createdSessions: any[] = [];

      // Create terms based on number_of_terms
      for (let i = 0; i < numberOfTerms; i++) {
        const term = availableTerms[i];
        
        // Calculate start and end dates for this term
        const termStart = new Date(sessionStart.getTime() + (termDuration * i));
        const termEnd = i === numberOfTerms - 1 
          ? sessionEnd // Last term ends at session end
          : new Date(sessionStart.getTime() + (termDuration * (i + 1)) - 1); // Other terms end 1ms before next term starts

        // Adjust termEnd to be at end of day
        if (i < numberOfTerms - 1) {
          termEnd.setHours(23, 59, 59, 999);
        }

        const academicSession = await this.prisma.academicSession.create({
          data: {
            school_id: createDto.school_id,
            academic_year: createDto.academic_year,
            start_year: createDto.start_year,
            end_year: createDto.end_year,
            term: term,
            start_date: termStart,
            end_date: termEnd,
            status: createDto.status || 'active',
            is_current: createDto.is_current && term === 'first' // Only first term can be current initially
          }
        });

        createdSessions.push({
          id: academicSession.id,
          school_id: academicSession.school_id,
          academic_year: academicSession.academic_year,
          start_year: academicSession.start_year,
          end_year: academicSession.end_year,
          term: academicSession.term,
          start_date: academicSession.start_date,
          end_date: academicSession.end_date,
          status: academicSession.status,
          is_current: academicSession.is_current,
          createdAt: academicSession.createdAt,
          updatedAt: academicSession.updatedAt
        });

        this.logger.log(colors.green(`✅ Created ${term} term: ${academicSession.academic_year} - ${term}`));
      }

      this.logger.log(colors.green(`✅ All ${numberOfTerms} term(s) created successfully for academic year: ${createDto.academic_year}`));

      return new ApiResponse(
        true,
        `Academic session created successfully with ${numberOfTerms} term(s)`,
        {
          academic_year: createDto.academic_year,
          number_of_terms: numberOfTerms,
          terms: createdSessions
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error creating academic session: ${error.message}`));
      return new ApiResponse(false, `Failed to create academic session: ${error.message}`, null);
    }
  }

  /**
   * Update an academic session (all terms in the session)
   */
  async updateAcademicSession(
    sessionId: string,
    updateDto: UpdateAcademicSessionDto
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Updating academic session: ${sessionId}`));

    try {
      // Get the session to find school_id and academic_year
      const session = await this.prisma.academicSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        this.logger.error(colors.red(`❌ Academic session not found: ${sessionId}`));
        return new ApiResponse(false, 'Academic session not found', null);
      }

      // Validate date range if both dates are provided
      if (updateDto.start_date && updateDto.end_date) {
        const startDate = new Date(updateDto.start_date);
        const endDate = new Date(updateDto.end_date);
        const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDifference < 30) {
          this.logger.error(colors.red(`❌ Date validation failed: Minimum 30 days required between start and end dates`));
          return new ApiResponse(false, 'Start date and end date must have at least 30 days between them', null);
        }
      }

      // If is_current is being set to true, handle session activation
      if (updateDto.is_current === true) {
        // Deactivate all other current sessions for this school
        await this.prisma.academicSession.updateMany({
          where: {
            school_id: session.school_id,
            is_current: true,
            id: { not: sessionId }
          },
          data: {
            is_current: false
          }
        });

        // Get all terms for this academic session
        const allTerms = await this.prisma.academicSession.findMany({
          where: {
            school_id: session.school_id,
            academic_year: session.academic_year
          },
          orderBy: {
            term: 'asc'
          }
        });

        // Set first term as current and deactivate other terms in this session
        for (const term of allTerms) {
          await this.prisma.academicSession.update({
            where: { id: term.id },
            data: {
              is_current: term.term === 'first',
              ...(updateDto.start_date && term.term === 'first' ? { start_date: new Date(updateDto.start_date) } : {}),
              ...(updateDto.end_date && term.term === allTerms[allTerms.length - 1].term 
                ? { end_date: new Date(updateDto.end_date) } 
                : {})
            }
          });
        }

        this.logger.log(colors.green(`✅ Academic session activated and first term set as current`));
      } else {
        // Update all terms in the session with provided dates
        const allTerms = await this.prisma.academicSession.findMany({
          where: {
            school_id: session.school_id,
            academic_year: session.academic_year
          },
          orderBy: {
            term: 'asc'
          }
        });

        for (const term of allTerms) {
          const updateData: any = {};
          
          if (updateDto.start_date && term.term === 'first') {
            updateData.start_date = new Date(updateDto.start_date);
          }
          
          if (updateDto.end_date && term.term === allTerms[allTerms.length - 1].term) {
            updateData.end_date = new Date(updateDto.end_date);
          }

          if (Object.keys(updateData).length > 0) {
            await this.prisma.academicSession.update({
              where: { id: term.id },
              data: updateData
            });
          }
        }
      }

      // Get updated session data
      const updatedSessions = await this.prisma.academicSession.findMany({
        where: {
          school_id: session.school_id,
          academic_year: session.academic_year
        },
        orderBy: {
          term: 'asc'
        }
      });

      this.logger.log(colors.green(`✅ Academic session updated successfully`));

      return new ApiResponse(
        true,
        'Academic session updated successfully',
        {
          academic_year: session.academic_year,
          terms: updatedSessions.map(s => ({
            id: s.id,
            school_id: s.school_id,
            academic_year: s.academic_year,
            start_year: s.start_year,
            end_year: s.end_year,
            term: s.term,
            start_date: s.start_date,
            end_date: s.end_date,
            status: s.status,
            is_current: s.is_current,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt
          }))
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error updating academic session: ${error.message}`));
      return new ApiResponse(false, `Failed to update academic session: ${error.message}`, null);
    }
  }

  /**
   * Update a specific term
   */
  async updateTerm(
    termId: string,
    updateDto: UpdateTermDto
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Updating term: ${termId}`));

    try {
      // Get the term
      const term = await this.prisma.academicSession.findUnique({
        where: { id: termId }
      });

      if (!term) {
        this.logger.error(colors.red(`❌ Term not found: ${termId}`));
        return new ApiResponse(false, 'Term not found', null);
      }

      // Validate date range if both dates are provided
      const startDate = updateDto.start_date ? new Date(updateDto.start_date) : term.start_date;
      const endDate = updateDto.end_date ? new Date(updateDto.end_date) : term.end_date;
      
      if (updateDto.start_date || updateDto.end_date) {
        const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDifference < 30) {
          this.logger.error(colors.red(`❌ Date validation failed: Minimum 30 days required between start and end dates`));
          return new ApiResponse(false, 'Start date and end date must have at least 30 days between them', null);
        }
      }

      // If is_current is being set to true, handle term activation
      if (updateDto.is_current === true) {
        // Deactivate all other current terms in this session (same academic_year)
        await this.prisma.academicSession.updateMany({
          where: {
            school_id: term.school_id,
            academic_year: term.academic_year,
            is_current: true,
            id: { not: termId }
          },
          data: {
            is_current: false
          }
        });
      }

      // Update the term
      const updateData: any = {};
      if (updateDto.start_date) updateData.start_date = new Date(updateDto.start_date);
      if (updateDto.end_date) updateData.end_date = new Date(updateDto.end_date);
      if (updateDto.is_current !== undefined) updateData.is_current = updateDto.is_current;

      const updatedTerm = await this.prisma.academicSession.update({
        where: { id: termId },
        data: updateData
      });

      this.logger.log(colors.green(`✅ Term updated successfully: ${updatedTerm.academic_year} - ${updatedTerm.term}`));

      return new ApiResponse(
        true,
        'Term updated successfully',
        {
          id: updatedTerm.id,
          school_id: updatedTerm.school_id,
          academic_year: updatedTerm.academic_year,
          start_year: updatedTerm.start_year,
          end_year: updatedTerm.end_year,
          term: updatedTerm.term,
          start_date: updatedTerm.start_date,
          end_date: updatedTerm.end_date,
          status: updatedTerm.status,
          is_current: updatedTerm.is_current,
          createdAt: updatedTerm.createdAt,
          updatedAt: updatedTerm.updatedAt
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error updating term: ${error.message}`));
      return new ApiResponse(false, `Failed to update term: ${error.message}`, null);
    }
  }

  
}

