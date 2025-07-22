import { IsUUID } from 'class-validator';

export class GenerateTicketPdfDto {
  @IsUUID()
  ticketId: string;
}
