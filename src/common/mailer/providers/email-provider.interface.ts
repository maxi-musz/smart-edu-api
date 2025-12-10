export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: {
    name?: string;
    address: string;
  };
}

export interface IEmailProvider {
  sendEmail(options: SendEmailOptions): Promise<void>;
}

