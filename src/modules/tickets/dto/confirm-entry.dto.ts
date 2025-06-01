import { IsNotEmpty, IsUUID } from 'class-validator';

export class ConfirmEntryDto {
  @IsNotEmpty({ message: 'eventId não pode ser vazio' })
  @IsUUID(undefined, { message: 'eventId deve ser um UUID válido' })
  eventId: string;

  @IsNotEmpty({ message: 'ticketId não pode ser vazio' })
  @IsUUID(undefined, { message: 'ticketId deve ser um UUID válido' })
  ticketId: string;
}
