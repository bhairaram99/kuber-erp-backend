import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { SystemRole } from '../enums/role.enum';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionGuard(reflector);
  });

  const mockContext = (user: any): ExecutionContext =>
    ({
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any);

  it('should allow access if route has no required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = mockContext({ roleName: SystemRole.STAFF, permissions: [] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access unconditionally for SUPER_ADMIN', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['roles.delete']);
    const context = mockContext({
      roleName: SystemRole.SUPER_ADMIN,
      permissions: [],
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has all required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['products.view', 'products.create']);
    const context = mockContext({
      roleName: SystemRole.STAFF,
      permissions: ['products.view', 'products.create', 'sales.view'],
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks any required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['products.delete']);
    const context = mockContext({
      roleName: SystemRole.STAFF,
      permissions: ['products.view'],
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
