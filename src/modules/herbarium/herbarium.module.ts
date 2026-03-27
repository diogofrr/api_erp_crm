import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HerbariumController } from './herbarium.controller';
import { HerbariumRepository } from './herbarium.repository';
import { HerbariumService } from './herbarium.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HerbariumController],
  providers: [HerbariumService, HerbariumRepository],
})
export class HerbariumModule {}
