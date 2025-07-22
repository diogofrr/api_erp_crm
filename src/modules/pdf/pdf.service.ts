import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../database/prisma/prisma.service';
import { R2Service } from './r2.service';
import { TemplateService } from './template.service';

@Injectable()
export class PdfService {
  constructor(
    private r2Service: R2Service,
    private prisma: PrismaService,
    private templateService: TemplateService,
  ) {}

  async generateTicketPDFBuffer(ticketId: string): Promise<Buffer> {
    const ticketData = await this.getTicketDataForPDF(ticketId);
    const qrCodeDataUrl: string = await QRCode.toDataURL(ticketData.qrCode);

    const html = this.templateService.renderTicketTemplate({
      eventName: ticketData.eventName,
      eventDate: ticketData.eventDate,
      eventTime: ticketData.eventTime,
      qrCodeDataUrl,
      fullName: ticketData.fullName,
      cpf: ticketData.cpf,
      email: ticketData.email,
      phone: ticketData.phone,
      location: ticketData.location,
      price: ticketData.price,
      statusText: ticketData.statusText,
      ticketId,
      eventLogoUrl: ticketData.eventLogoUrl || undefined,
    });

    return await this.generatePDF(html);
  }

  private async getTicketDataForPDF(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        EventTicket: {
          include: {
            event: {
              select: {
                name: true,
                date: true,
                startTime: true,
                location: true,
                price: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!ticket || !ticket.EventTicket[0]) {
      throw new Error('Ingresso não encontrado');
    }

    const eventTicket = ticket.EventTicket[0];
    const event = eventTicket.event;

    return {
      fullName: ticket.fullName,
      cpf: ticket.cpf,
      email: ticket.email,
      phone: ticket.phone,
      qrCode: eventTicket.qrCode,
      eventName: event.name,
      eventDate: new Date(event.date).toLocaleDateString('pt-BR'),
      eventTime: new Date(event.startTime).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      location: event.location,
      price: event.price.toFixed(2),
      statusText: this.getStatusText(eventTicket.status),
      eventLogoUrl: event.logoUrl,
    };
  }

  private readonly statusTextMap = {
    PENDING: 'PENDENTE',
    CONFIRMED: 'CONFIRMADO',
    CANCELED: 'CANCELADO',
  } as const;

  private getStatusText(status: string): string {
    return (
      this.statusTextMap[status as keyof typeof this.statusTextMap] || status
    );
  }

  private async generatePDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
