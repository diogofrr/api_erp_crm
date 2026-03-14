import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../src/modules/auth/decorators/roles.decorator';

export const mockUser = {
  id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed-password',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  roles: [{ name: UserRole.ADMIN } as { name: UserRole }],
  permissions: [],
};

export const createMockUser = (overrides?: Partial<typeof mockUser>) => ({
  ...mockUser,
  ...overrides,
});

export const createMockUserWithRole = (role: UserRole) =>
  createMockUser({
    roles: [{ name: role } as { name: UserRole }],
  });

export class MockJwtAuthGuard implements CanActivate {
  private user = mockUser;

  setUser(user: typeof mockUser) {
    this.user = user;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = this.user;
    return true;
  }
}

export class MockRolesGuard implements CanActivate {
  constructor(private reflector: Reflector = new Reflector()) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const hasRole = requiredRoles.some(role =>
      user.roles?.some(userRole => userRole.name === role),
    );

    return hasRole;
  }
}
