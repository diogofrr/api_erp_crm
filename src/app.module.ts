import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { EventsModule } from './modules/events/events.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    TicketsModule,
    EventsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
