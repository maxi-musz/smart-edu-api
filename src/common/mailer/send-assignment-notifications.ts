import { sendMail } from './send-mail';
import { 
  teacherSubjectRoleTemplate, 
  teacherClassManagementTemplate, 
  teacherRoleUpdateTemplate,
  timetableScheduleTemplate
} from '../email-templates/assignment-notifications';

interface TeacherAssignmentData {
  teacherName: string;
  teacherEmail: string;
  schoolName: string;
  assignedBy: string;
}

interface SubjectAssignmentData extends TeacherAssignmentData {
  subjects: string[];
}

interface ClassAssignmentData extends TeacherAssignmentData {
  classes: string[];
}

interface AssignmentUpdateData extends TeacherAssignmentData {
  newSubjects?: string[];
  removedSubjects?: string[];
  newClasses?: string[];
  removedClasses?: string[];
}

/**
 * Sends teaching role notification email to teacher
 */
export async function sendSubjectRoleEmail(data: SubjectAssignmentData): Promise<void> {
  try {
    const emailHtml = teacherSubjectRoleTemplate({
      ...data,
      roleDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });

    await sendMail({
      to: data.teacherEmail,
      subject: `📚 New Teaching Role - ${data.schoolName}`,
      html: emailHtml
    });

    console.log(`✅ Teaching role email sent to: ${data.teacherEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send teaching role email to ${data.teacherEmail}:`, error);
    throw error;
  }
}

/**
 * Sends class management notification email to teacher
 */
export async function sendClassManagementEmail(data: ClassAssignmentData): Promise<void> {
  try {
    const emailHtml = teacherClassManagementTemplate({
      ...data,
      roleDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });

    await sendMail({
      to: data.teacherEmail,
      subject: `🏫 New Class Management Role - ${data.schoolName}`,
      html: emailHtml
    });

    console.log(`✅ Class management email sent to: ${data.teacherEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send class management email to ${data.teacherEmail}:`, error);
    throw error;
  }
}

/**
 * Sends teaching role update notification email to teacher
 */
export async function sendRoleUpdateEmail(data: AssignmentUpdateData): Promise<void> {
  try {
    const emailHtml = teacherRoleUpdateTemplate({
      ...data,
      updateDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });

    await sendMail({
      to: data.teacherEmail,
      subject: `🔄 Teaching Role Update - ${data.schoolName}`,
      html: emailHtml
    });

    console.log(`✅ Teaching role update email sent to: ${data.teacherEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send teaching role update email to ${data.teacherEmail}:`, error);
    throw error;
  }
}

/**
 * Sends appropriate assignment notifications based on changes
 */
export async function sendAssignmentNotifications(
  teacherId: string,
  teacherEmail: string,
  teacherName: string,
  schoolName: string,
  assignedBy: string,
  newSubjects?: string[],
  removedSubjects?: string[],
  newClasses?: string[],
  removedClasses?: string[]
): Promise<void> {
  try {
    // If this is a new teacher with initial roles
    if (newSubjects && newSubjects.length > 0 && !removedSubjects) {
      await sendSubjectRoleEmail({
        teacherName,
        teacherEmail,
        schoolName,
        subjects: newSubjects,
        assignedBy
      });
    }

    if (newClasses && newClasses.length > 0 && !removedClasses) {
      await sendClassManagementEmail({
        teacherName,
        teacherEmail,
        schoolName,
        classes: newClasses,
        assignedBy
      });
    }

    // If this is an update to existing roles
    if ((newSubjects && newSubjects.length > 0) || (removedSubjects && removedSubjects.length > 0) ||
        (newClasses && newClasses.length > 0) || (removedClasses && removedClasses.length > 0)) {
      await sendRoleUpdateEmail({
        teacherName,
        teacherEmail,
        schoolName,
        newSubjects,
        removedSubjects,
        newClasses,
        removedClasses,
        assignedBy
      });
    }

  } catch (error) {
    console.error(`❌ Failed to send assignment notifications to ${teacherEmail}:`, error);
    // Don't throw error to avoid failing the main operation
  }
} 

/**
 * Sends timetable schedule notification email to teacher
 */
export async function sendTimetableScheduleEmail(data: {
  teacherName: string;
  teacherEmail: string;
  schoolName: string;
  subjectName: string;
  className: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  notes?: string;
  assignedBy: string;
}): Promise<void> {
  try {
    const emailHtml = timetableScheduleTemplate({
      ...data,
      scheduleDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });

    await sendMail({
      to: data.teacherEmail,
      subject: `📅 New Class Schedule - ${data.schoolName}`,
      html: emailHtml
    });

    console.log(`✅ Timetable schedule email sent to: ${data.teacherEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send timetable schedule email to ${data.teacherEmail}:`, error);
    throw error;
  }
} 