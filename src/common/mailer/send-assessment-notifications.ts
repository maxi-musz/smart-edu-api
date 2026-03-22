import { sendMail } from './send-mail';
import {
  assessmentPublishedTemplate,
  assessmentUnpublishedTemplate,
  assessmentResultReleasedTemplate,
} from '../email-templates/assessment-notifications';

/**
 * Sends assessment published notification email to a student
 */
export async function sendAssessmentPublishedEmail(data: {
  studentEmail: string;
  studentName: string;
  assessmentTitle: string;
  subjectName: string;
  schoolName: string;
  assessmentType?: string;
}): Promise<void> {
  try {
    const emailHtml = assessmentPublishedTemplate({
      ...data,
      publishedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    await sendMail({
      to: data.studentEmail,
      subject: `📝 New Assessment Published - ${data.assessmentTitle}`,
      html: emailHtml,
    });

    console.log(`✅ Assessment published email sent to: ${data.studentEmail}`);
  } catch (error) {
    console.error(
      `❌ Failed to send assessment published email to ${data.studentEmail}:`,
      error,
    );
    throw error;
  }
}

/**
 * Sends assessment unpublished notification email to a student
 */
export async function sendAssessmentUnpublishedEmail(data: {
  studentEmail: string;
  studentName: string;
  assessmentTitle: string;
  subjectName: string;
  schoolName: string;
}): Promise<void> {
  try {
    const emailHtml = assessmentUnpublishedTemplate({
      ...data,
      unpublishedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    await sendMail({
      to: data.studentEmail,
      subject: `⚠️ Assessment Unpublished - ${data.assessmentTitle}`,
      html: emailHtml,
    });

    console.log(
      `✅ Assessment unpublished email sent to: ${data.studentEmail}`,
    );
  } catch (error) {
    console.error(
      `❌ Failed to send assessment unpublished email to ${data.studentEmail}:`,
      error,
    );
    throw error;
  }
}

/**
 * Sends assessment result released notification email to a student
 */
export async function sendAssessmentResultReleasedEmail(data: {
  studentEmail: string;
  studentName: string;
  assessmentTitle: string;
  subjectName: string;
  schoolName: string;
}): Promise<void> {
  try {
    const emailHtml = assessmentResultReleasedTemplate({
      ...data,
      releasedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    await sendMail({
      to: data.studentEmail,
      subject: `🎉 Assessment Results Released - ${data.assessmentTitle}`,
      html: emailHtml,
    });

    console.log(
      `✅ Assessment result released email sent to: ${data.studentEmail}`,
    );
  } catch (error) {
    console.error(
      `❌ Failed to send assessment result released email to ${data.studentEmail}:`,
      error,
    );
    throw error;
  }
}
