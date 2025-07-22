import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { EmailService } from './email.service';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { R2Service } from './r2.service';
import { TemplateService } from './template.service';

@Module({
  imports: [PrismaModule],
  controllers: [PdfController],
  providers: [PdfService, R2Service, EmailService, TemplateService],
  exports: [PdfService, R2Service, EmailService, TemplateService],
})
export class PdfModule {}
