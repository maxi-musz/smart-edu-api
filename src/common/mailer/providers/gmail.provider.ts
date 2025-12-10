import * as nodemailer from "nodemailer";
import * as colors from "colors";
import { IEmailProvider, SendEmailOptions } from "./email-provider.interface";

export class GmailProvider implements IEmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error("Gmail SMTP credentials missing in environment variables");
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.GOOGLE_SMTP_HOST,
      port: process.env.GOOGLE_SMTP_PORT ? parseInt(process.env.GOOGLE_SMTP_PORT) : 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const fromAddress = options.from?.address || process.env.EMAIL_USER as string;
      const fromName = options.from?.name || "Smart Edu Hub";

      const mailOptions = {
        from: {
          name: fromName,
          address: fromAddress,
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(colors.green(`Email sent to ${options.to} via Gmail`));
    } catch (error) {
      console.log(colors.red("Error sending email via Gmail: "), error);
      throw new Error(`Error sending email via Gmail: ${error.message}`);
    }
  }
}

