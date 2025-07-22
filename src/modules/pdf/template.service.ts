import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateService {
  private readonly ticketTemplate = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Ingresso - {{eventName}}</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 0;
        background: white;
        min-height: 100vh;
      }
      .ticket {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        background: white;
        border: 2px solid #000;
        position: relative;
        padding: 20px;
        box-sizing: border-box;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #ddd;
      }
      .event-logo {
        max-width: 200px;
        max-height: 120px;
        margin: 0 auto 20px;
        display: block;
      }
      .event-title {
        font-size: 28px;
        font-weight: bold;
        color: #000;
        margin-bottom: 10px;
        text-transform: uppercase;
      }
      .event-instructions {
        font-size: 14px;
        color: #333;
        margin-bottom: 20px;
        font-style: italic;
      }
      .ticket-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 30px;
      }
      .event-details {
        border: 2px solid #000;
        padding: 20px;
        background: #f9f9f9;
      }
      .attendee-info {
        border: 2px solid #000;
        padding: 20px;
        background: #f9f9f9;
      }
      .section-title {
        font-size: 18px;
        font-weight: bold;
        color: #000;
        margin-bottom: 15px;
        text-align: center;
        text-transform: uppercase;
      }
      .info-row {
        margin-bottom: 12px;
        font-size: 14px;
        line-height: 1.4;
      }
      .info-label {
        font-weight: bold;
        color: #000;
        display: inline-block;
        min-width: 80px;
      }
      .info-value {
        color: #333;
      }
      .qr-code-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 20px;
      }
      .qr-code {
        width: 200px;
        height: 200px;
        border: 1px solid #000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
      }
      .qr-code img {
        width: 180px;
        height: 180px;
        display: block;
      }
      .attendee-details {
        flex: 1;
        margin-left: 20px;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 12px;
        color: #666;
      }
      .ticket-id {
        font-weight: bold;
        color: #000;
        margin-top: 10px;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .ticket {
          border: 2px solid #000;
          margin: 0;
          padding: 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="header">
        <img src="{{eventLogoUrl}}" alt="Logo do Evento" class="event-logo">
        <div class="event-title">{{eventName}}</div>
        <div class="event-instructions">
          Apresente este voucher no dia do evento, acompanhado de documento com foto.
        </div>
      </div>

      <div class="ticket-content">
        <div class="event-details">
          <div class="section-title">Detalhes do Evento</div>
          <div class="info-row">
            <span class="info-label">Data:</span>
            <span class="info-value">{{eventDate}} - {{eventTime}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Local:</span>
            <span class="info-value">{{location}}</span>
          </div>
        </div>

        <div class="attendee-info">
          <div class="section-title">Informações do Participante</div>
          <div class="qr-code-section">
            <div class="qr-code">
              <img src="{{qrCodeDataUrl}}" alt="QR Code">
            </div>
            <div class="attendee-details">
              <div class="info-row">
                <span class="info-label">Nome:</span>
                <span class="info-value">{{fullName}}</span>
              </div>
              <div class="info-row">
                <span class="info-label">CPF:</span>
                <span class="info-value">{{cpf}}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Telefone:</span>
                <span class="info-value">{{phone}}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">{{email}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Este ingresso é pessoal e intransferível.</p>
        <p>Apresente este documento na entrada do evento.</p>
        <div class="ticket-id">ID: {{ticketId}}</div>
      </div>
    </div>
  </body>
</html>
  `;

  renderTicketTemplate(data: {
    eventName: string;
    eventDate: string;
    eventTime: string;
    qrCodeDataUrl: string;
    fullName: string;
    cpf: string;
    email: string;
    phone: string;
    location: string;
    price: string;
    statusText: string;
    ticketId: string;
    eventLogoUrl?: string;
  }): string {
    let template = this.ticketTemplate;

    const logoUrl =
      data.eventLogoUrl ||
      'https://pub-c1d09dbd294d4731b4e4d1f797d366c3.r2.dev/logos/logo-default.jpeg';

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const placeholder = `{{${key}}}`;
        template = template.replace(new RegExp(placeholder, 'g'), value);
      }
    });

    template = template.replace('{{eventLogoUrl}}', logoUrl);

    return template;
  }
}
