import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Recuperación de contraseña - NextCore ERP',
      template: 'forgot-password',
      context: {
        resetUrl,
        email,
      },
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Bienvenido a NextCore ERP',
      template: 'welcome',
      context: {
        firstName,
        email,
      },
    });
  }
}