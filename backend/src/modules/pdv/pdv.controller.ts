import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PdvService } from './pdv.service';
import { FinalizarPdvDto } from './dto/finalizar-pdv.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BusinessAccessGuard } from '../../common/guards/business-access.guard';

@ApiTags('PDV')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('negocios/:businessId/pdv')
export class PdvController {
  constructor(private pdvService: PdvService) {}

  @Post('checkout')
  @UseGuards(BusinessAccessGuard)
  async checkout(
    @Param('businessId') businessId: string,
    @Body() dto: FinalizarPdvDto,
    @Request() req: any,
  ) {
    return this.pdvService.checkout(businessId, dto, req.user?.id);
  }
}
