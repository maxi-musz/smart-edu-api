import * as colors from "colors"
import { onboardingMailTemplate } from "../email-templates/onboard-mail";
import { ResponseHelper } from "src/shared/helper-functions/response.helpers";
import { onboardingSchoolAdminNotificationTemplate } from "../email-templates/onboard-mail-admin";
import { passwordResetTemplate } from "../email-templates/password-reset-template";
import { loginOtpTemplate } from "../email-templates/login-otp-template";
import { EmailProviderFactory } from "./providers/email-provider.factory";

// Helper function to get the correct from email address based on provider
const getFromEmailAddress = (): string => {
  const provider = (process.env.EMAIL_PROVIDER || "gmail").toLowerCase();
  
  // Prioritize provider-specific env vars
  if (provider === "resend") {
    return process.env.RESEND_FROM_EMAIL || process.env.EMAIL_USER || "noreply@smart-edu.com";
  }
  if (provider === "sendgrid") {
    return process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || "noreply@smart-edu.com";
  }
  // Default to Gmail/EMAIL_USER
  return process.env.EMAIL_USER || "noreply@smart-edu.com";
};

// add the interface for the mail to send 
export interface OnboardingMailPayload {
    school_name: string;
    school_email: string;
    school_phone: string;
    school_address: string;
    school_type: string;
    school_ownership: string;
    documents: {
        cac?: string | null;
        utility_bill?: string | null;
        tax_clearance?: string | null;
    };
}

interface OnboardingAdminPayload {
    school_name: string;
    school_email: string;
    school_phone: string;
    school_address: string;
    school_type: string;
    school_ownership: string;
    documents: {
      cac: string | null;
      utility_bill: string | null;
      tax_clearance: string | null;
    };
    defaultPassword: string | null;
}

interface SendResetOtpProps {
    email: string;
    otp: string;
}

interface SendMailProps {
    to: string;
    subject: string;
    html: string;
}


////////////////////////////////////////////////////////////            Generic send mail function
export const sendMail = async (payload: SendMailProps): Promise<void> => {
    console.log(colors.yellow("Sending mail..."))

    try {
        const emailProvider = EmailProviderFactory.getProvider();
        
        await emailProvider.sendEmail({
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            from: {
                name: "Smart Edu Hub",
                address: getFromEmailAddress(),
            },
        });
        
    } catch (error) {
        console.log(colors.red("Error sending email: "), error);
        throw new Error(`Error sending email: ${error.message}`);
    }
}

////////////////////////////////////////////////////////////            Send mail to school owner
export const sendOnboardingMailToSchoolOwner = async (
    payload: OnboardingMailPayload
): Promise<void> => {
    console.log(colors.yellow("Sending mail to school owner..."))

    try {
        const emailProvider = EmailProviderFactory.getProvider();
        const htmlContent = onboardingMailTemplate({ ...payload});

        await emailProvider.sendEmail({
            from: {
                name: "Smart Edu Hub",
                address: getFromEmailAddress(),
            },
            to: payload.school_email,
            subject: `Welcome to Smart Edu Hub`,
            html: htmlContent,
        });

        console.log(colors.green(`Onboarding email sent to ${payload.school_email}`));
        
    } catch (error) {
        console.log(colors.red("Error sending onboarding email: "), error);
        throw ResponseHelper.error(
            "Error sending onboarding email",
            error.message
        )
    }
}

////////////////////////////////////////////////////////////             Send mail to Best tech Admin
export const sendOnboardingMailToBTechAdmin = async (
    payload: OnboardingAdminPayload
): Promise<void> => {

    try {
        console.log(colors.yellow("Sending mail to Best Tech..."))

        const emailProvider = EmailProviderFactory.getProvider();
        const htmlContent = onboardingSchoolAdminNotificationTemplate({ ...payload});
        const adminEmail = process.env.BTECH_ADMIN_EMAIL || "besttechnologies25@gmail.com"

        await emailProvider.sendEmail({
            from: {
                name: "Smart Edu Hub",
                address: getFromEmailAddress(),
            },
            to: adminEmail,
            subject: `New Registration on Smart Edu Hub`,
            html: htmlContent,
        });

        console.log(colors.green(`New school Onboarding email sent to ${adminEmail}`));
        
    } catch (error) {
        console.log(colors.red("Error sending onboarding email to admin: "), error);
        throw ResponseHelper.error(
            "Error sending onboarding email",
            error.message
        )
    }
  };
  
  ////////////////////////////////////////////////////////////             Send password reset email
  export const sendPasswordResetOtp = async ({ email, otp }: SendResetOtpProps): Promise<void> => {
    const emailProvider = EmailProviderFactory.getProvider();
    const htmlContent = passwordResetTemplate(otp);
  
    await emailProvider.sendEmail({
      from: {
        name: 'Smart Edu Hub',
        address: getFromEmailAddress(),
      },
      to: email,
      subject: `🔐 Your Password Reset Code`,
      html: htmlContent,
    });
  };

export const sendLoginOtpByMail = async ({ email, otp}: SendResetOtpProps): Promise<void> => {
  console.log(colors.green(`Sending login otp to admin email: ${email}`))

  try {
    const emailProvider = EmailProviderFactory.getProvider();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const htmlContent = loginOtpTemplate(email, otp, otpExpiresAt);

    await emailProvider.sendEmail({
        from: {
            name: "Smart Edu Hub",
            address: getFromEmailAddress(),
        },
        to: email,
        subject: `Login OTP Confirmation Code: ${otp}`,
        html: htmlContent
    });

  } catch (error) {
    console.error('Error sending otp email:', error);
    throw new Error('Failed to send OTP email');
  }
}