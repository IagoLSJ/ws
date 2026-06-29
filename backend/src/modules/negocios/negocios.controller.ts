import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NegociosService } from './negocios.service';
import { CriarNegocioDto } from './dto/criar-negocio.dto';
import { AtualizarNegocioDto } from './dto/atualizar-negocio.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BusinessAccessGuard } from '../../common/guards/business-access.guard';
import { RoleNegocio } from '@prisma/client';

@ApiTags('Negócios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessAccessGuard, RolesGuard)
@Controller('negocios')
export class NegociosController {
  constructor(private service: NegociosService) {}

  @Post()
  @Roles(RoleNegocio.SUPER_ADMIN)
  @ApiOperation({ summary: 'Criar negócio' })
  create(@Body() dto: CriarNegocioDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(RoleNegocio.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar negócios' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(RoleNegocio.VISUALIZADOR)
  @ApiOperation({ summary: 'Obter negócio' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleNegocio.GERENTE)
  @ApiOperation({ summary: 'Atualizar negócio' })
  update(@Param('id') id: string, @Body() dto: AtualizarNegocioDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleNegocio.SUPER_ADMIN)
  @ApiOperation({ summary: 'Desativar negócio' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/logo')
  @Roles(RoleNegocio.GERENTE)
  @ApiOperation({ summary: 'Solicitar URL de upload do logo' })
  requestLogoUpload(@Param('id') id: string, @Body('fileName') fileName: string) {
    return this.service.requestLogoUploadUrl(id, fileName);
  }

  @Post(':id/logo/confirmar')
  @Roles(RoleNegocio.GERENTE)
  @ApiOperation({ summary: 'Confirmar upload do logo' })
  confirmLogoUpload(@Param('id') id: string, @Body('key') key: string) {
    return this.service.confirmLogoUpload(id, key);
  }

  @Delete(':id/logo')
  @Roles(RoleNegocio.GERENTE)
  @ApiOperation({ summary: 'Remover logo' })
  deleteLogo(@Param('id') id: string) {
    return this.service.deleteLogo(id);
  }
}
