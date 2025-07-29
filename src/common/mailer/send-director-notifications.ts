import { sendMail } from './send-mail';
import { 
  teacherRoleChangeDirectorTemplate, 
  newTeacherRoleDirectorTemplate 
} from '../email-templates/director-notifications';
import { PrismaService } from 'src/prisma/prisma.service';

interface DirectorNotificationData {
  directorName: string;
  directorEmail: string;
  schoolName: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  updatedBy: string;
}

interface AssignmentChangeData extends DirectorNotificationData {
  changeType: 'subject' | 'class' | 'both';
  newSubjects?: string[];
  removedSubjects?: string[];
  newClasses?: string[];
  removedClasses?: string[];
  previousSubjects?: string[];
  previousClasses?: string[];
}

interface NewTeacherData {
  directorName: string;
  directorEmail: string;
  schoolName: string;
  createdBy: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  assignedSubjects: string[];
  assignedClasses: string[];
  creationDate: string;
}

/**
 * Sends assignment change notification to all school directors
 */
export async function sendDirectorAssignmentChangeNotification(
  prisma: PrismaService,
  schoolId: string,
  assignmentData: AssignmentChangeData
): Promise<void> {
  try {
    // Get all school directors for this school
    const directors = await getSchoolDirectors(prisma, schoolId);
    
    if (directors.length === 0) {
      console.log(`No directors found for school: ${schoolId}`);
      return;
    }

    // Send notification to each director
    const emailPromises = directors.map(async (director) => {
      try {
        const emailHtml = teacherRoleChangeDirectorTemplate({
          ...assignmentData,
          directorName: director.first_name + ' ' + director.last_name,
          directorEmail: director.email,
          changeDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        });

        await sendMail({
          to: director.email,
          subject: `📋 Teacher Role Update - ${assignmentData.schoolName}`,
          html: emailHtml
        });

        console.log(`✅ Director assignment change notification sent to: ${director.email}`);
      } catch (error) {
        console.error(`❌ Failed to send director notification to ${director.email}:`, error);
        // Don't throw error to avoid failing the main operation
      }
    });

    await Promise.all(emailPromises);
    console.log(`✅ Director notifications sent to ${directors.length} director(s)`);
    
  } catch (error) {
    console.error(`❌ Failed to send director assignment change notifications:`, error);
    // Don't throw error to avoid failing the main operation
  }
}

/**
 * Sends new teacher assignment notification to all school directors
 */
export async function sendDirectorNewTeacherNotification(
  prisma: PrismaService,
  schoolId: string,
  teacherData: NewTeacherData
): Promise<void> {
  try {
    // Get all school directors for this school
    const directors = await getSchoolDirectors(prisma, schoolId);
    
    if (directors.length === 0) {
      console.log(`No directors found for school: ${schoolId}`);
      return;
    }

    // Send notification to each director
    const emailPromises = directors.map(async (director) => {
      try {
        const emailHtml = newTeacherRoleDirectorTemplate({
          ...teacherData,
          directorName: director.first_name + ' ' + director.last_name,
          directorEmail: director.email,
          creationDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        });

        await sendMail({
          to: director.email,
          subject: `🎉 New Teacher Role - ${teacherData.schoolName}`,
          html: emailHtml
        });

        console.log(`✅ Director new teacher notification sent to: ${director.email}`);
      } catch (error) {
        console.error(`❌ Failed to send director notification to ${director.email}:`, error);
        // Don't throw error to avoid failing the main operation
      }
    });

    await Promise.all(emailPromises);
    console.log(`✅ Director new teacher notifications sent to ${directors.length} director(s)`);
    
  } catch (error) {
    console.error(`❌ Failed to send director new teacher notifications:`, error);
    // Don't throw error to avoid failing the main operation
  }
}

/**
 * Helper function to get all school directors for a school
 */
async function getSchoolDirectors(prisma: PrismaService, schoolId: string): Promise<Array<{first_name: string, last_name: string, email: string}>> {
  try {
    const directors = await prisma.user.findMany({
      where: {
        school_id: schoolId,
        role: 'school_director',
        status: 'active'
      },
      select: {
        first_name: true,
        last_name: true,
        email: true
      }
    });
    
    return directors;
  } catch (error) {
    console.error(`Error fetching school directors for school ${schoolId}:`, error);
    return [];
  }
}

/**
 * Comprehensive director notification function
 * Determines the type of change and sends appropriate notifications
 */
export async function sendDirectorNotifications(
  prisma: PrismaService,
  schoolId: string,
  schoolName: string,
  teacherId: string,
  teacherName: string,
  teacherEmail: string,
  teacherPhone: string,
  updatedBy: string,
  newSubjects?: string[],
  removedSubjects?: string[],
  newClasses?: string[],
  removedClasses?: string[],
  previousSubjects?: string[],
  previousClasses?: string[],
  isNewTeacher: boolean = false
): Promise<void> {
  try {
    if (isNewTeacher) {
      // New teacher notification
      await sendDirectorNewTeacherNotification(prisma, schoolId, {
        directorName: '', // Will be filled by the function
        directorEmail: '', // Will be filled by the function
        schoolName,
        createdBy: updatedBy,
        teacherName,
        teacherEmail,
        teacherPhone,
        assignedSubjects: newSubjects || [],
        assignedClasses: newClasses || [],
        creationDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    } else {
      // Assignment change notification
      const hasSubjectChanges = (newSubjects && newSubjects.length > 0) || (removedSubjects && removedSubjects.length > 0);
      const hasClassChanges = (newClasses && newClasses.length > 0) || (removedClasses && removedClasses.length > 0);
      
      let changeType: 'subject' | 'class' | 'both' = 'subject';
      if (hasSubjectChanges && hasClassChanges) {
        changeType = 'both';
      } else if (hasClassChanges) {
        changeType = 'class';
      }

      await sendDirectorAssignmentChangeNotification(prisma, schoolId, {
        directorName: '', // Will be filled by the function
        directorEmail: '', // Will be filled by the function
        schoolName,
        teacherName,
        teacherEmail,
        teacherPhone,
        updatedBy,
        changeType,
        newSubjects,
        removedSubjects,
        newClasses,
        removedClasses,
        previousSubjects,
        previousClasses
      });
    }
  } catch (error) {
    console.error(`❌ Failed to send director notifications:`, error);
    // Don't throw error to avoid failing the main operation
  }
} 