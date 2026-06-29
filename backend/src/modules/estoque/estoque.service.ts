import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../infra/database/prisma.service';
import { CriarEstoqueItemDto } from './dto/criar-estoque-item.dto';
import { AtualizarEstoqueItemDto } from './dto/atualizar-estoque-item.dto';
import { MovimentarEstoqueDto } from './dto/movimentar-estoque.dto';
import { TransferirEstoqueDto } from './dto/transferir-estoque.dto';

@Injectable()
export class EstoqueService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('alertas-estoque') private alertasQueue: Queue,
  ) {}

  private include = {
    produto: {
      select: { id: true, nome: true, sku: true, status: true, preco: true, controlaEstoque: true },
    },
  } as const;

  private mapItem(item: any) {
    return {
      ...item,
      nome: item.produto?.nome ?? item.nome ?? 'Sem nome',
      sku: item.produto?.sku ?? item.sku ?? null,
      ehAvulso: !item.produtoId,
    };
  }

  async findAll(negocioId: string) {
    const items = await this.prisma.estoqueItem.findMany({
      where: { negocioId },
      include: this.include,
      orderBy: { criadoEm: 'desc' },
    });
    return items.map(this.mapItem);
  }

  async criar(negocioId: string, dto: CriarEstoqueItemDto) {
    if (!dto.produtoId && !dto.nome) {
      throw new BadRequestException('Informe um produtoId ou um nome para o item avulso');
    }

    const item = await this.prisma.estoqueItem.create({
      data: {
        negocioId,
        produtoId: dto.produtoId ?? null,
        nome: dto.nome ?? null,
        sku: dto.sku ?? null,
        quantidadeAtual: dto.quantidadeAtual ?? 0,
        estoqueMinimo: dto.estoqueMinimo ?? 5,
        unidade: dto.unidade ?? 'un',
      },
      include: this.include,
    });

    return this.mapItem(item);
  }

  async findOne(negocioId: string, itemId: string) {
    const item = await this.prisma.estoqueItem.findFirst({
      where: { id: itemId, negocioId },
      include: this.include,
    });
    if (!item) throw new NotFoundException('Item de estoque não encontrado');
    return this.mapItem(item);
  }

  async atualizar(negocioId: string, itemId: string, dto: AtualizarEstoqueItemDto) {
    await this.findOne(negocioId, itemId);
    const item = await this.prisma.estoqueItem.update({
      where: { id: itemId },
      data: dto,
      include: this.include,
    });
    return this.mapItem(item);
  }

  async remover(negocioId: string, itemId: string) {
    await this.findOne(negocioId, itemId);
    await this.prisma.estoqueItem.delete({ where: { id: itemId } });
    return { message: 'Item removido' };
  }

  async movimentar(negocioId: string, itemId: string, dto: MovimentarEstoqueDto, usuarioId?: string) {
    const item = await this.findOne(negocioId, itemId);

    const tiposEntrada = ['ENTRADA', 'TRANSFERENCIA_ENTRADA', 'INVENTARIO'];
    const isEntrada = tiposEntrada.includes(dto.tipo);

    if (!isEntrada && dto.quantidade > item.quantidadeAtual) {
      throw new BadRequestException('Estoque insuficiente');
    }

    const quantidadeAntes = item.quantidadeAtual;
    const quantidadeApos = isEntrada
      ? quantidadeAntes + dto.quantidade
      : quantidadeAntes - dto.quantidade;

    const [movimentacao] = await this.prisma.$transaction([
      this.prisma.movimentacaoEstoque.create({
        data: {
          negocioId,
          estoqueItemId: itemId,
          usuarioId: usuarioId ?? null,
          tipo: dto.tipo,
          quantidade: dto.quantidade,
          quantidadeAntes,
          quantidadeApos,
          motivo: dto.motivo,
          referencia: dto.referencia,
        },
      }),
      this.prisma.estoqueItem.update({
        where: { id: itemId },
        data: { quantidadeAtual: quantidadeApos },
      }),
    ]);

    if (!isEntrada && quantidadeApos <= item.estoqueMinimo) {
      await this.alertasQueue.add('estoque-ruptura', {
        negocioId,
        produtoId: item.produtoId,
        produtoNome: item.nome,
        quantidadeAtual: quantidadeApos,
        estoqueMinimo: item.estoqueMinimo,
      });
    }

    return movimentacao;
  }

  async historico(negocioId: string, itemId: string) {
    await this.findOne(negocioId, itemId);
    return this.prisma.movimentacaoEstoque.findMany({
      where: { estoqueItemId: itemId, negocioId },
      orderBy: { criadoEm: 'desc' },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  async transferir(negocioId: string, dto: TransferirEstoqueDto, usuarioId?: string) {
    const itemOrigem = await this.findOne(negocioId, dto.itemOrigemId);

    if (dto.quantidade > itemOrigem.quantidadeAtual) {
      throw new BadRequestException('Estoque insuficiente para transferência');
    }

    const destinoNegocio = await this.prisma.negocio.findUnique({
      where: { id: dto.negocioDestinoId, ativo: true },
    });
    if (!destinoNegocio) throw new NotFoundException('Negócio de destino não encontrado');

    const itemDestino = await this.prisma.estoqueItem.findUnique({
      where: { produtoId: dto.produtoDestinoId },
    });
    if (!itemDestino) throw new NotFoundException('Produto de destino não encontrado no estoque');

    const quantidadeAntesOrigem = itemOrigem.quantidadeAtual;
    const quantidadeAntesDestino = itemDestino.quantidadeAtual;

    await this.prisma.$transaction([
      this.prisma.estoqueItem.update({
        where: { id: itemOrigem.id },
        data: { quantidadeAtual: quantidadeAntesOrigem - dto.quantidade },
      }),
      this.prisma.estoqueItem.update({
        where: { id: itemDestino.id },
        data: { quantidadeAtual: quantidadeAntesDestino + dto.quantidade },
      }),
      this.prisma.movimentacaoEstoque.create({
        data: {
          negocioId,
          estoqueItemId: itemOrigem.id,
          usuarioId: usuarioId ?? null,
          tipo: 'TRANSFERENCIA_SAIDA',
          quantidade: dto.quantidade,
          quantidadeAntes: quantidadeAntesOrigem,
          quantidadeApos: quantidadeAntesOrigem - dto.quantidade,
          motivo: dto.motivo || 'Transferência entre negócios',
        },
      }),
      this.prisma.movimentacaoEstoque.create({
        data: {
          negocioId: dto.negocioDestinoId,
          estoqueItemId: itemDestino.id,
          usuarioId: usuarioId ?? null,
          tipo: 'TRANSFERENCIA_ENTRADA',
          quantidade: dto.quantidade,
          quantidadeAntes: quantidadeAntesDestino,
          quantidadeApos: quantidadeAntesDestino + dto.quantidade,
          motivo: dto.motivo || 'Transferência entre negócios',
        },
      }),
    ]);

    return { message: 'Transferência realizada com sucesso' };
  }

  async alertas(negocioId: string) {
    const items = await this.prisma.estoqueItem.findMany({
      where: { negocioId, quantidadeAtual: { lte: 0 } },
      include: this.include,
    });
    return items.map(this.mapItem);
  }
}
