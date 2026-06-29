import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { RelatoriosService } from './relatorios.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BusinessAccessGuard } from '../../common/guards/business-access.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleNegocio } from '@prisma/client';

@ApiTags('Relatórios')
@Controller('negocios/:businessId/relatorios')
@UseGuards(JwtAuthGuard, BusinessAccessGuard, RolesGuard)
@ApiBearerAuth()
export class RelatoriosController {
  constructor(private relatorios: RelatoriosService) {}

  @Get('inventario')
  @Roles(RoleNegocio.ADMIN, RoleNegocio.GERENTE, RoleNegocio.VISUALIZADOR)
  @ApiOperation({ summary: 'Exportar relatório de inventário (CSV)' })
  @ApiResponse({ status: 200, description: 'Arquivo CSV' })
  inventario(@Res() res: Response) {
    const businessId = (res.req as any).params.businessId;
    return this.relatorios.inventario(businessId, res);
  }
}