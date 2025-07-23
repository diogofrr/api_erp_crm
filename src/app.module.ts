import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { TicketsModule } from './modules/tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.MINUTE_THROTTLE_TTL),
        limit: Number(process.env.MINUTE_THROTTLE_LIMIT),
      },
      {
        ttl: Number(process.env.HOUR_THROTTLE_TTL),
        limit: Number(process.env.HOUR_THROTTLE_LIMIT),
      },
    ]),
    PrismaModule,
    AuthModule,
    TicketsModule,
    EventsModule,
    PdfModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
