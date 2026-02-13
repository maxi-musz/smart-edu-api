export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: {
    name?: string;
    address: string;
  };
  attachments?: EmailAttachment[];
}

export interface IEmailProvider {
  sendEmail(options: SendEmailOptions): Promise<void>;
}

