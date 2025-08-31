// Email sending utilities using Resend or SMTP
import { generateInvitationEmail, generatePasswordResetEmail, generateWelcomeEmail } from './templates';

interface EmailConfig {
  provider: 'resend' | 'smtp';
  apiKey?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  fromEmail: string;
  fromName: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

class EmailSender {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      if (this.config.provider === 'resend') {
        return await this.sendWithResend(options);
      } else {
        return await this.sendWithSMTP(options);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  private async sendWithResend(options: SendEmailOptions): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('Resend API key not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    return true;
  }

  private async sendWithSMTP(options: SendEmailOptions): Promise<boolean> {
    // Note: In a real implementation, you would use nodemailer or similar
    // For now, we'll just log the email content in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent:', {
        to: options.to,
        subject: options.subject,
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        preview: options.text.substring(0, 100) + '...'
      });
      return true;
    }

    throw new Error('SMTP sending not implemented in this example');
  }

  async sendInvitationEmail(data: {
    to: string;
    candidateName: string;
    companyName: string;
    interviewTitle: string;
    inviteUrl: string;
    expiresAt: string;
  }): Promise<boolean> {
    const template = generateInvitationEmail({
      candidateName: data.candidateName,
      companyName: data.companyName,
      interviewTitle: data.interviewTitle,
      inviteUrl: data.inviteUrl,
      expiresAt: data.expiresAt,
    });

    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetEmail(data: {
    to: string;
    resetUrl: string;
    expiresAt: string;
  }): Promise<boolean> {
    const template = generatePasswordResetEmail({
      userEmail: data.to,
      resetUrl: data.resetUrl,
      expiresAt: data.expiresAt,
    });

    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendWelcomeEmail(data: {
    to: string;
    userName: string;
    userRole: 'employer' | 'candidate' | 'hr';
    companyName?: string;
    loginUrl: string;
  }): Promise<boolean> {
    const template = generateWelcomeEmail({
      userName: data.userName,
      userRole: data.userRole,
      companyName: data.companyName,
      loginUrl: data.loginUrl,
    });

    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}

// Create email sender instance based on environment variables
export function createEmailSender(): EmailSender {
  const config: EmailConfig = {
    provider: (process.env.EMAIL_PROVIDER as 'resend' | 'smtp') || 'resend',
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'noreply@interviewplatform.com',
    fromName: process.env.FROM_NAME || 'Interview Platform',
    smtpConfig: process.env.SMTP_HOST ? {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    } : undefined,
  };

  return new EmailSender(config);
}

export { EmailSender };
