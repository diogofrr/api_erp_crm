import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SendTicketEmailDto } from './dto/send-ticket-email.dto';
import { EmailService } from './email.service';

@Controller('pdf')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PdfController {
  constructor(private emailService: EmailService) {}

  @Post('send-ticket-email')
  @Roles(UserRole.ADMIN, UserRole.TICKET_MANAGER)
  async sendTicketEmail(@Body() sendTicketEmailDto: SendTicketEmailDto) {
    return await this.emailService.sendTicketEmailWithPDF(sendTicketEmailDto);
  }
}
