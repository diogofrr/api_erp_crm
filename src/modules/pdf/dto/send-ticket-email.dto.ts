import { IsUUID } from 'class-validator';

export class SendTicketEmailDto {
  @IsUUID()
  ticketId: string;
}
