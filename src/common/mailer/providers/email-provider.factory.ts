import { IEmailProvider } from "./email-provider.interface";
import { GmailProvider } from "./gmail.provider";
import { ResendProvider } from "./resend.provider";
import { SendGridProvider } from "./sendgrid.provider";
import * as colors from "colors";

export type EmailProviderType = "gmail" | "resend" | "sendgrid";

export class EmailProviderFactory {
  private static instance: IEmailProvider | null = null;

  static getProvider(): IEmailProvider {
    // Return cached instance if available
    if (this.instance) {
      return this.instance;
    }

    const providerType = (process.env.EMAIL_PROVIDER || "gmail").toLowerCase() as EmailProviderType;

    console.log(colors.cyan(`📧 Using email provider: ${providerType}`));

    switch (providerType) {
      case "resend":
        this.instance = new ResendProvider();
        break;
      case "sendgrid":
        this.instance = new SendGridProvider();
        break;
      case "gmail":
      default:
        this.instance = new GmailProvider();
        break;
    }

    return this.instance;
  }

  // Method to reset instance (useful for testing)
  static reset(): void {
    this.instance = null;
  }
}

