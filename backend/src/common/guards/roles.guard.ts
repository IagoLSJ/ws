import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleNegocio } from '@prisma/client';
import { PrismaService } from '../../infra/database/prisma.service';

const HIERARCHY: Record<RoleNegocio, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  GERENTE: 60,
  OPERADOR_ESTOQUE: 40,
  VISUALIZADOR: 20,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleNegocio[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    if (user.role === RoleNegocio.SUPER_ADMIN) return true;

    const userLevel = user.role ? HIERARCHY[user.role as RoleNegocio] : undefined;

    if (userLevel !== undefined) {
      return requiredRoles.some((role) => userLevel >= HIERARCHY[role]);
    }

    const isSuper = await this.prisma.membroNegocio.findFirst({
      where: { usuarioId: user.id, role: RoleNegocio.SUPER_ADMIN, ativo: true },
    });
    if (isSuper) return true;

    return false;
  }
}
