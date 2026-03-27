import { IsEnum, IsNotEmpty } from 'class-validator';
import { EventStatus } from '@generated/prisma';

export class UpdateEventStatusDto {
  @IsNotEmpty({ message: 'status não pode ser vazio' })
  @IsEnum(EventStatus, {
    message:
      'status deve ser um dos seguintes valores: PENDING, ACTIVE, CANCELED, COMPLETED',
  })
  status: EventStatus;
}
