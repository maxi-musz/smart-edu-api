import { emailVerificationOTPTemplate } from '../email-templates/email-verification-template';
import { sendMail } from './send-mail';

interface EmailVerificationOTPParams {
  email: string;
  firstName: string;
  otp: string;
}

export const sendEmailVerificationOTP = async ({
  email,
  firstName,
  otp,
}: EmailVerificationOTPParams) => {
  const subject = '🔐 Verify Your Email Address - Smart Edu Hub';
  
  const htmlContent = emailVerificationOTPTemplate({
    email,
    firstName,
    otp,
  });

  await sendMail({
    to: email,
    subject,
    html: htmlContent,
  });
};
