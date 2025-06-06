import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ResponseDto } from 'src/dto/response.dto';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { IncomingHttpHeaders } from 'http2';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Permission, Role, User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private generateTokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<User & { roles: Role[]; permissions: Permission[] }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
        permissions: true,
      },
    });

    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    const isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      throw new HttpException('Credenciais inválidas', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<ResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles.map(role => role.name),
      permissions: user.permissions.map(permission => permission.name),
    };

    const token = this.jwtService.sign(payload);
    const tokenHash = this.generateTokenHash(token);

    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
    });

    return new ResponseDto('Login realizado com sucesso', {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        permissions: user.permissions,
      },
    });
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<ResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new HttpException('Usuário já existe', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      include: {
        roles: true,
        permissions: true,
      },
      omit: {
        createdAt: true,
        updatedAt: true,
        password: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new HttpException('Erro ao criar usuário', HttpStatus.BAD_REQUEST);
    }

    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles.map(role => role.name),
      permissions: user.permissions.map(permission => permission.name),
    };

    const token = this.jwtService.sign(payload);
    const tokenHash = this.generateTokenHash(token);

    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return new ResponseDto('Usuário criado com sucesso', {
      user,
      access_token: token,
    });
  }

  async logout(authHeader: IncomingHttpHeaders): Promise<ResponseDto> {
    if (!authHeader.authorization) {
      throw new HttpException('Token não fornecido', HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.authorization.replace('Bearer ', '');

    const tokenHash = this.generateTokenHash(token);
    await this.prisma.authToken.deleteMany({
      where: { tokenHash },
    });

    return new ResponseDto('Logout realizado com sucesso', null);
  }

  async refreshToken(authHeader: IncomingHttpHeaders): Promise<ResponseDto> {
    if (!authHeader.authorization) {
      throw new HttpException('Token não fornecido', HttpStatus.UNAUTHORIZED);
    }

    const oldToken = authHeader.authorization.replace('Bearer ', '');

    const tokenHash = this.generateTokenHash(oldToken);
    const tokenData = await this.prisma.authToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenData) {
      throw new HttpException('Token inválido', HttpStatus.UNAUTHORIZED);
    }

    const user = tokenData.user;
    const newToken = this.jwtService.sign({
      email: user.email,
      sub: user.id,
    });

    const newTokenHash = this.generateTokenHash(newToken);

    await this.prisma.authToken.update({
      where: { tokenHash },
      data: {
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
    });

    return new ResponseDto('Token renovado com sucesso', {
      access_token: newToken,
    });
  }

  verifyIsDevelopmentMode(): boolean {
    const isProductionMode = process.env.NODE_ENV === 'production';

    if (isProductionMode) {
      throw new HttpException(
        'Operação não permitida em ambiente de produção',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }

  decodeToken(headers: IncomingHttpHeaders): JwtPayload {
    if (!headers.authorization) {
      throw new HttpException('Token não fornecido', HttpStatus.UNAUTHORIZED);
    }

    const token = headers.authorization.replace('Bearer ', '');
    const decodedToken = this.jwtService.verify<JwtPayload>(token, {
      secret: process.env.JWT_SECRET,
    });

    if (!decodedToken) {
      throw new HttpException('Token inválido', HttpStatus.UNAUTHORIZED);
    }

    return decodedToken;
  }
}
