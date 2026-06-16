import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { BatchesModule } from './modules/batches/batches.module';
import { HerbariumModule } from './modules/herbarium/herbarium.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { TicketsModule } from './modules/tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.MINUTE_THROTTLE_TTL) || 60_000,
        limit: Number(process.env.MINUTE_THROTTLE_LIMIT) || 100,
      },
      {
        ttl: Number(process.env.HOUR_THROTTLE_TTL) || 3_600_000,
        limit: Number(process.env.HOUR_THROTTLE_LIMIT) || 1000,
      },
    ]),
    PrismaModule,
    AuthModule,
    TicketsModule,
    EventsModule,
    BatchesModule,
    PdfModule,
    HerbariumModule,
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
