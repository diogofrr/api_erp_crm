import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ResponseDto } from '../../dto/response.dto';
import { SendTicketEmailDto } from './dto/send-ticket-email.dto';
import { PdfService } from './pdf.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private pdfService: PdfService,
    private prisma: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendTicketEmailWithPDF(
    sendTicketEmailDto: SendTicketEmailDto,
  ): Promise<ResponseDto> {
    const ticketData = await this.getTicketData(sendTicketEmailDto.ticketId);

    const recipient = ticketData.ticketEmail;

    const pdfBuffer = await this.pdfService.generateTicketPDFBuffer(
      sendTicketEmailDto.ticketId,
    );
    const fileName = `ingresso-${sendTicketEmailDto.ticketId}.pdf`;

    await this.sendTicketEmail(
      recipient,
      ticketData.fullName,
      ticketData.eventName,
      pdfBuffer,
      fileName,
    );

    return new ResponseDto('Email com ingresso enviado com sucesso', {
      email: recipient,
      ticketId: sendTicketEmailDto.ticketId,
      ticketName: ticketData.fullName,
      eventName: ticketData.eventName,
    });
  }

  async sendTicketEmail(
    to: string,
    ticketName: string,
    eventName: string,
    pdfBuffer: Buffer,
    fileName: string,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject: `🎫 Seu ingresso para ${eventName}`,
      html: this.generateEmailHTML(ticketName, eventName),
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await this.transporter.sendMail(mailOptions);
  }

  private generateEmailHTML(ticketName: string, eventName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Seu Ingresso</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎫 Seu Ingresso Está Pronto!</h1>
            <p>Olá ${ticketName}, seu ingresso para ${eventName} foi gerado com sucesso!</p>
          </div>

          <div class="content">
            <h2>📋 Informações do Ingresso</h2>
            <p>Seu ingresso em PDF está anexado a este email.</p>

            <h3>📱 Como usar seu ingresso:</h3>
            <ul>
              <li>Abra o PDF anexado</li>
              <li>Salve no seu celular ou imprima</li>
              <li>Apresente na entrada do evento</li>
              <li>O QR Code será escaneado para validação</li>
            </ul>

            <h3>⚠️ Importante:</h3>
            <ul>
              <li>Este ingresso é pessoal e intransferível</li>
              <li>Mantenha o PDF seguro</li>
              <li>Apresente o documento original (não cópia)</li>
            </ul>
          </div>

          <div class="footer">
            <p>Se tiver dúvidas, entre em contato conosco.</p>
            <p>Obrigado por escolher nossos eventos!</p>
          </div>
        </body>
      </html>
    `;
  }

  private async getTicketData(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        EventTicket: {
          include: {
            event: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!ticket || !ticket.EventTicket[0]) {
      throw new Error('Ingresso não encontrado');
    }

    return {
      fullName: ticket.fullName,
      eventName: ticket.EventTicket[0].event.name,
      ticketEmail: ticket.email,
    };
  }
}
