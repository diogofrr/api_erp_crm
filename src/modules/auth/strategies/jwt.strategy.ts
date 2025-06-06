import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma/prisma.service';
import * as crypto from 'crypto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  private generateTokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: true,
        permissions: true,
      },
    });

    if (!user) {
      throw new HttpException(
        'Usuário não encontrado',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
