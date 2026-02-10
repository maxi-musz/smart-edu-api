import { sendMail } from './send-mail';
import { 
  teacherOnboardEmailTemplate, 
  studentOnboardEmailTemplate, 
  directorOnboardEmailTemplate 
} from '../email-templates/congratulatory-onboard';
import { generateStrongPassword } from 'src/shared/helper-functions/password-generator';

interface UserOnboardData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolName: string;
  className?: string;
  /** When set, this password is used in the email instead of generating one (e.g. backend default password). */
  password?: string;
}

/**
 * Sends congratulatory email to onboarded teacher
 */
export async function sendTeacherOnboardEmail(userData: UserOnboardData): Promise<void> {
  try {
    const password = generateStrongPassword(
      userData.firstName,
      userData.lastName,
      userData.email,
      userData.phone
    );

    const emailHtml = teacherOnboardEmailTemplate({
      ...userData,
      password
    });

    await sendMail({
      to: userData.email,
      subject: `🎉 Welcome to Smart Edu Hub - ${userData.schoolName}`,
      html: emailHtml
    });

    console.log(`✅ Teacher onboard email sent to: ${userData.email}`);
    console.log(`🔐 Generated password: ${password}`);
  } catch (error) {
    console.error(`❌ Failed to send teacher onboard email to ${userData.email}:`, error);
    throw error;
  }
}

/**
 * Sends congratulatory email to onboarded student.
 * If userData.password is provided (e.g. backend default), that is used; otherwise a password is generated.
 */
export async function sendStudentOnboardEmail(userData: UserOnboardData): Promise<void> {
  try {
    const password =
      userData.password ??
      generateStrongPassword(
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.phone
      );

    const emailHtml = studentOnboardEmailTemplate({
      ...userData,
      password
    });

    await sendMail({
      to: userData.email,
      subject: `🎓 Welcome to Smart Edu Hub - ${userData.schoolName}`,
      html: emailHtml
    });

    console.log(`✅ Student onboard email sent to: ${userData.email}`);
    console.log(`🔐 Password in email: ${userData.password ? 'default (from backend)' : 'generated'}`);
  } catch (error) {
    console.error(`❌ Failed to send student onboard email to ${userData.email}:`, error);
    throw error;
  }
}

/**
 * Sends congratulatory email to onboarded director
 */
export async function sendDirectorOnboardEmail(userData: UserOnboardData): Promise<void> {
  try {
    const password = generateStrongPassword(
      userData.firstName,
      userData.lastName,
      userData.email,
      userData.phone
    );

    const emailHtml = directorOnboardEmailTemplate({
      ...userData,
      password
    });

    await sendMail({
      to: userData.email,
      subject: `🎉 Welcome to Smart Edu Hub - ${userData.schoolName}`,
      html: emailHtml
    });

    console.log(`✅ Director onboard email sent to: ${userData.email}`);
    console.log(`🔐 Generated password: ${password}`);
  } catch (error) {
    console.error(`❌ Failed to send director onboard email to ${userData.email}:`, error);
    throw error;
  }
}

/**
 * Sends congratulatory email based on user role
 */
export async function sendOnboardEmailByRole(
  userData: UserOnboardData,
  role: 'teacher' | 'student' | 'director'
): Promise<string> {
  const password = generateStrongPassword(
    userData.firstName,
    userData.lastName,
    userData.email,
    userData.phone
  );

  switch (role) {
    case 'teacher':
      await sendTeacherOnboardEmail(userData);
      break;
    case 'student':
      await sendStudentOnboardEmail(userData);
      break;
    case 'director':
      await sendDirectorOnboardEmail(userData);
      break;
    default:
      throw new Error(`Unknown role: ${role}`);
  }

  return password;
} 