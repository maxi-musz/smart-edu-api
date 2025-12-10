import * as colors from "colors";
import { IEmailProvider, SendEmailOptions } from "./email-provider.interface";

export class SendGridProvider implements IEmailProvider {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SendGrid API key missing in environment variables");
    }

    this.apiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || "noreply@smart-edu.com";
    this.fromName = process.env.SENDGRID_FROM_NAME || "Smart Edu Hub";
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const fromAddress = options.from?.address || this.fromEmail;
      const fromName = options.from?.name || this.fromName;

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
            },
          ],
          from: {
            email: fromAddress,
            name: fromName,
          },
          subject: options.subject,
          content: [
            {
              type: "text/html",
              value: options.html,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid API error: ${error}`);
      }

      console.log(colors.green(`Email sent to ${options.to} via SendGrid`));
    } catch (error) {
      console.log(colors.red("Error sending email via SendGrid: "), error);
      throw new Error(`Error sending email via SendGrid: ${error.message}`);
    }
  }
}

