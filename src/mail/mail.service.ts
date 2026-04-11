import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    // Configuramos el "motor" de correos con las credenciales del Autódromo
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com', //  smtp.gmail.com
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false, // true para el puerto 465, false para los demás
      auth: {
        user: process.env.MAIL_USER, //mail de donde sale las alertas (ovalofans.alertas@gmail.com)
        pass: process.env.MAIL_PASS, // Contraseña de aplicación (si usás Gmail)
      },
    });
  }

  async enviarCorreo(to: string, subject: string, text: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Óvalo Fans 🏎️" <${process.env.MAIL_USER}>`, 
        to: to, 
        subject: subject, 
        text: text, 
      });
      console.log(`📧 Mail enviado a ${to} - ID: ${info.messageId}`);
    } catch (error) {
      console.error('🚨 Error al intentar enviar el email:', error);
    }
  }
}