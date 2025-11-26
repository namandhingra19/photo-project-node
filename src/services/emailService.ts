import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import { UserRole } from '@prisma/client';

// Email template types
export interface EmailTemplateData {
  name: string;
  email: string;
  [key: string]: any;
}

export interface VerificationEmailData extends EmailTemplateData {
  verificationToken: string;
  role: UserRole;
}

export interface WelcomeEmailData extends EmailTemplateData {
  role: UserRole;
  appUrl?: string;
}

export interface PasswordResetEmailData extends EmailTemplateData {
  resetToken: string;
}

export interface ProjectInviteEmailData extends EmailTemplateData {
  inviteToken: string;
  projectName: string;
  senderName: string;
}

// Email types enum
export enum EmailType {
  VERIFICATION = 'verification',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password-reset',
  PROJECT_INVITE_AND_REGISTER = 'project-invite-and-register',
  PROJECT_INVITE = 'project-invite'
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templatesPath: string;

  constructor() {
    // Use process.cwd() to get the project root, then navigate to templates
    this.templatesPath = path.join(process.cwd(), 'src/templates/emails');
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    // Use environment variables for email configuration
    const emailConfig = {
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
      }
    };


    // If no SMTP credentials are provided, create a test transporter
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('⚠️  SMTP credentials not configured. Using test transporter.');
      return nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    }

    return nodemailer.createTransport(emailConfig);
  }

  /**
   * Render EJS template with data
   */
  private async renderTemplate(templateName: string, data: EmailTemplateData): Promise<string> {
    const templatePath = path.join(this.templatesPath, `${templateName}.ejs`);

    // Check if template file exists
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templateName}.ejs`);
    }

    try {
      const template = fs.readFileSync(templatePath, 'utf8');
      return ejs.render(template, data);
    } catch (error: any) {
      throw new Error(`Failed to render email template: ${error.message}`);
    }
  }

  /**
   * Send email with EJS template
   */
  private async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    from?: string
  ): Promise<void> {
    const mailOptions = {
      from: from || process.env.EMAIL_HOST || process.env.SMTP_FROM || 'Photo Project <noreply@photoproject.com>',
      to,
      subject,
      html: htmlContent
    };


    try {
      const info = await this.transporter.sendMail(mailOptions);

      // Log email info (in development)
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error: any) {
      console.error('❌ Email sending failed:', error.message);
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(data: VerificationEmailData): Promise<void> {
    const subject = '📸 Verify Your Email - Photo Project';

    const htmlContent = await this.renderTemplate(EmailType.VERIFICATION, {
      ...data,
      appUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    });

    await this.sendEmail(data.email, subject, htmlContent);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    const subject = '🎉 Welcome to Photo Project!';

    const htmlContent = await this.renderTemplate(EmailType.WELCOME, {
      ...data,
      appUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    });

    await this.sendEmail(data.email, subject, htmlContent);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    const subject = '🔐 Password Reset Request - Photo Project';

    const htmlContent = await this.renderTemplate(EmailType.PASSWORD_RESET, {
      ...data,
      appUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    });

    await this.sendEmail(data.email, subject, htmlContent);
  }

  /**
   * Send custom email with template
   */
  async sendCustomEmail(
    to: string,
    subject: string,
    templateName: string,
    data: EmailTemplateData
  ): Promise<void> {
    const htmlContent = await this.renderTemplate(templateName, data);
    await this.sendEmail(to, subject, htmlContent);
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error: any) {
      console.error('❌ Email service connection failed:', error.message);
      return false;
    }
  }

  /**
   * Get available email templates
   */
  getAvailableTemplates(): string[] {
    try {
      const files = fs.readdirSync(this.templatesPath);
      return files
        .filter(file => file.endsWith('.ejs'))
        .map(file => file.replace('.ejs', ''));
    } catch (error: any) {
      console.error('❌ Failed to read templates directory:', error.message);
      return [];
    }
  }

  /**
   * Preview email template (for development)
   */
  async previewTemplate(templateName: string, data: EmailTemplateData): Promise<string> {
    return await this.renderTemplate(templateName, data);
  }

  /**
   * Send project invite email
   */
  async sendProjectInviteEmailAndRegister(data: ProjectInviteEmailData): Promise<void> {
    const subject = `You've been invited to join ${data.projectName} on Photo Project`;

    const htmlContent = await this.renderTemplate(EmailType.PROJECT_INVITE_AND_REGISTER, {
      ...data,
    });

    await this.sendEmail(data.email, subject, htmlContent);
  }
  async sendExistingUserProjectInvite(data: ProjectInviteEmailData): Promise<void> {
    const subject = `You've been invited to join ${data.projectName} on Photo Project`;

    const htmlContent = await this.renderTemplate(EmailType.PROJECT_INVITE, {
      ...data,
    });

    await this.sendEmail(data.email, subject, htmlContent);
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export helper functions for backward compatibility
export const sendVerificationEmail = async (email: string, verificationToken: string, role: UserRole) => {
  await emailService.sendVerificationEmail({
    email,
    name: 'User', // Default name, should be provided by caller
    verificationToken,
    role
  });
};

export const sendWelcomeEmail = async (email: string, name: string, role: UserRole) => {
  await emailService.sendWelcomeEmail({
    email,
    name,
    role
  });
};

export const sendPasswordResetEmail = async (email: string, name: string, resetToken: string) => {
  await emailService.sendPasswordResetEmail({
    email,
    name,
    resetToken
  });
};

