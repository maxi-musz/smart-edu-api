import * as colors from "colors";
import { IEmailProvider, SendEmailOptions } from "./email-provider.interface";

export class ResendProvider implements IEmailProvider {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Resend API key missing in environment variables");
    }

    this.apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_USER || "noreply@smart-edu.com";
    this.fromName = process.env.RESEND_FROM_NAME || "Smart Edu Hub";
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const fromAddress = options.from?.address || this.fromEmail;
      const fromName = options.from?.name || this.fromName;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromAddress}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      console.log(colors.green(`Email sent to ${options.to} via Resend (ID: ${data.id})`));
    } catch (error) {
      console.log(colors.red("Error sending email via Resend: "), error);
      throw new Error(`Error sending email via Resend: ${error.message}`);
    }
  }
}

