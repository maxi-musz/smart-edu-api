import { sendMail } from './send-mail';
import { 
  newStudentEnrollmentTemplate, 
  studentWelcomeTemplate,
  classTeacherNotificationTemplate
} from '../email-templates/enrollment-notifications';

/**
 * Sends new student enrollment notification to school directors
 */
export async function sendNewStudentEnrollmentNotification(data: {
  studentName: string;
  studentEmail: string;
  schoolName: string;
  studentId: string;
  className: string;
  studentDetails: {
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    address?: string;
    academicLevel?: string;
    previousSchool?: string;
  };
}): Promise<void> {
  try {
    const emailHtml = newStudentEnrollmentTemplate({
      ...data,
      enrollmentDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });

    await sendMail({
      to: process.env.BTECH_ADMIN_EMAIL || "besttechnologies25@gmail.com",
      subject: `🎓 New Student Enrollment - ${data.schoolName}`,
      html: emailHtml
    });

    console.log(`✅ New student enrollment notification sent to admin`);
  } catch (error) {
    console.error(`❌ Failed to send new student enrollment notification:`, error);
    throw error;
  }
}

/**
 * Sends notification to class teacher about new student enrollment
 */
export async function sendClassTeacherNotification(data: {
  teacherEmail: string;
  teacherName: string;
  className: string;
  schoolName: string;
  studentName: string;
  studentId: string;
  studentEmail: string;
  studentDetails: {
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    academicLevel?: string;
    previousSchool?: string;
  };
}): Promise<void> {
  try {
    const emailHtml = classTeacherNotificationTemplate({
      ...data,
      enrollmentDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });

    await sendMail({
      to: data.teacherEmail,
      subject: `👨‍🏫 New Student in ${data.className} - ${data.schoolName}`,
      html: emailHtml
    });

    console.log(`✅ Class teacher notification sent to: ${data.teacherEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send class teacher notification to ${data.teacherEmail}:`, error);
    throw error;
  }
}

/**
 * Sends welcome email to newly enrolled student
 */
export async function sendStudentWelcomeEmail(data: {
  studentName: string;
  studentEmail: string;
  schoolName: string;
  studentId: string;
  className: string;
  classTeacher?: string;
  loginCredentials: {
    email: string;
    password: string;
  };
}): Promise<void> {
  try {
    const emailHtml = studentWelcomeTemplate({
      ...data,
      enrollmentDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });

    await sendMail({
      to: data.studentEmail,
      subject: `🎓 Welcome to ${data.schoolName} - Smart Edu Hub`,
      html: emailHtml
    });

    console.log(`✅ Welcome email sent to student: ${data.studentEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome email to student ${data.studentEmail}:`, error);
    throw error;
  }
}
