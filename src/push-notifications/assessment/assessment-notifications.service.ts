import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { PushNotificationsService } from '../push-notifications.service';
import { sendAssessmentPublishedEmail, sendAssessmentUnpublishedEmail } from 'src/common/mailer/send-assessment-notifications';

@Injectable()
export class AssessmentNotificationsService {
  private readonly logger = new Logger(AssessmentNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushNotificationsService: PushNotificationsService
  ) {}

  /**
   * Send push notifications and emails to students when an assessment is published
   * @param quiz - The published assessment
   * @param schoolId - School ID
   */
  async sendAssessmentPublishedNotifications(quiz: any, schoolId: string) {
    try {
      this.logger.log(colors.cyan(`Sending push notifications for published assessment: ${quiz.title}`));

      // Get the subject ID from the quiz
      const subjectId = quiz.subject_id || quiz.subject?.id;
      if (!subjectId) {
        this.logger.warn(colors.yellow(`⚠️ Assessment ${quiz.id} has no subject_id, skipping notifications`));
        return;
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: schoolId,
          is_current: true
        }
      });

      if (!currentSession) {
        this.logger.warn(colors.yellow(`⚠️ No current academic session found for school ${schoolId}`));
        return;
      }

      // Find all classes that have this subject
      const classesWithSubject = await this.prisma.class.findMany({
        where: {
          schoolId: schoolId,
          academic_session_id: currentSession.id,
          subjects: {
            some: {
              id: subjectId,
              academic_session_id: currentSession.id
            }
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      if (classesWithSubject.length === 0) {
        this.logger.warn(colors.yellow(`⚠️ No classes found with subject ${subjectId}`));
        return;
      }

      const classIds = classesWithSubject.map(cls => cls.id);
      this.logger.log(colors.blue(`📚 Found ${classesWithSubject.length} classes with this subject`));

      // Find all active students in these classes
      const students = await this.prisma.student.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          current_class_id: { in: classIds },
          status: 'active'
        },
        select: {
          user_id: true,
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      if (students.length === 0) {
        this.logger.warn(colors.yellow(`⚠️ No active students found in classes with subject ${subjectId}`));
        return;
      }

      const studentUserIds = students.map(s => s.user_id);
      this.logger.log(colors.blue(`👥 Found ${students.length} students to notify`));

      // Get school name
      const school = await this.prisma.school.findFirst({
        where: { id: schoolId },
        select: { school_name: true }
      });

      // Send push notifications
      const notificationResult = await this.pushNotificationsService.sendNotificationByType({
        notificationType: 'custom',
        recipients: studentUserIds,
        schoolId: schoolId,
        title: 'New Assessment Published',
        body: `A new assessment "${quiz.title}" has been published for ${quiz.subject?.name || 'your subject'}. Check it out now!`,
        data: {
          type: 'assessment_published',
          assessment_id: quiz.id,
          assessment_title: quiz.title,
          subject_id: subjectId,
          subject_name: quiz.subject?.name || '',
          action: 'view_assessment'
        }
      });

      if (notificationResult.success) {
        this.logger.log(colors.green(`✅ Push notifications sent to ${notificationResult.sent} students`));
      } else {
        this.logger.warn(colors.yellow(`⚠️ Failed to send push notifications: ${notificationResult.message}`));
      }

      // Send email notifications
      const emailPromises = students.map(async (student) => {
        try {
          await sendAssessmentPublishedEmail({
            studentEmail: student.user.email,
            studentName: `${student.user.first_name} ${student.user.last_name}`,
            assessmentTitle: quiz.title,
            subjectName: quiz.subject?.name || 'Unknown Subject',
            schoolName: school?.school_name || 'Your School',
            assessmentType: quiz.assessment_type || 'Assessment'
          });
        } catch (emailError) {
          this.logger.error(colors.red(`❌ Failed to send email to ${student.user.email}: ${emailError.message}`));
        }
      });

      await Promise.allSettled(emailPromises);
      this.logger.log(colors.green(`✅ Email notifications sent to ${students.length} students`));
    } catch (error) {
      this.logger.error(colors.red(`❌ Error sending assessment published notifications: ${error.message}`));
      throw error;
    }
  }

  /**
   * Send push notifications and emails to students when an assessment is unpublished
   * @param quiz - The unpublished assessment
   * @param schoolId - School ID
   */
  async sendAssessmentUnpublishedNotifications(quiz: any, schoolId: string) {
    try {
      this.logger.log(colors.cyan(`Sending notifications for unpublished assessment: ${quiz.title}`));

      // Get the subject ID from the quiz
      const subjectId = quiz.subject_id || quiz.subject?.id;
      if (!subjectId) {
        this.logger.warn(colors.yellow(`⚠️ Assessment ${quiz.id} has no subject_id, skipping notifications`));
        return;
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: schoolId,
          is_current: true
        }
      });

      if (!currentSession) {
        this.logger.warn(colors.yellow(`⚠️ No current academic session found for school ${schoolId}`));
        return;
      }

      // Find all classes that have this subject
      const classesWithSubject = await this.prisma.class.findMany({
        where: {
          schoolId: schoolId,
          academic_session_id: currentSession.id,
          subjects: {
            some: {
              id: subjectId,
              academic_session_id: currentSession.id
            }
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      if (classesWithSubject.length === 0) {
        this.logger.warn(colors.yellow(`⚠️ No classes found with subject ${subjectId}`));
        return;
      }

      const classIds = classesWithSubject.map(cls => cls.id);
      this.logger.log(colors.blue(`📚 Found ${classesWithSubject.length} classes with this subject`));

      // Find all active students in these classes
      const students = await this.prisma.student.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          current_class_id: { in: classIds },
          status: 'active'
        },
        select: {
          user_id: true,
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      if (students.length === 0) {
        this.logger.warn(colors.yellow(`⚠️ No active students found in classes with subject ${subjectId}`));
        return;
      }

      const studentUserIds = students.map(s => s.user_id);
      this.logger.log(colors.blue(`👥 Found ${students.length} students to notify`));

      // Get school name
      const school = await this.prisma.school.findFirst({
        where: { id: schoolId },
        select: { school_name: true }
      });

      // Send push notifications
      const notificationResult = await this.pushNotificationsService.sendNotificationByType({
        notificationType: 'custom',
        recipients: studentUserIds,
        schoolId: schoolId,
        title: 'Assessment Unpublished',
        body: `The assessment "${quiz.title}" for ${quiz.subject?.name || 'your subject'} has been unpublished.`,
        data: {
          type: 'assessment_unpublished',
          assessment_id: quiz.id,
          assessment_title: quiz.title,
          subject_id: subjectId,
          subject_name: quiz.subject?.name || '',
          action: 'view_assessments'
        }
      });

      if (notificationResult.success) {
        this.logger.log(colors.green(`✅ Push notifications sent to ${notificationResult.sent} students`));
      } else {
        this.logger.warn(colors.yellow(`⚠️ Failed to send push notifications: ${notificationResult.message}`));
      }

      // Send email notifications
      const emailPromises = students.map(async (student) => {
        try {
          await sendAssessmentUnpublishedEmail({
            studentEmail: student.user.email,
            studentName: `${student.user.first_name} ${student.user.last_name}`,
            assessmentTitle: quiz.title,
            subjectName: quiz.subject?.name || 'Unknown Subject',
            schoolName: school?.school_name || 'Your School'
          });
        } catch (emailError) {
          this.logger.error(colors.red(`❌ Failed to send email to ${student.user.email}: ${emailError.message}`));
        }
      });

      await Promise.allSettled(emailPromises);
      this.logger.log(colors.green(`✅ Email notifications sent to ${students.length} students`));
    } catch (error) {
      this.logger.error(colors.red(`❌ Error sending assessment unpublished notifications: ${error.message}`));
      throw error;
    }
  }
}

