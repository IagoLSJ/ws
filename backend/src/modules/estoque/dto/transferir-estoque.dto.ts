import { IsString, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferirEstoqueDto {
  @ApiProperty()
  @IsString()
  itemOrigemId!: string;

  @ApiProperty()
  @IsString()
  negocioDestinoId!: string;

  @ApiProperty()
  @IsString()
  produtoDestinoId!: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  quantidade!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivo?: string;
}
