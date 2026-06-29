import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { Response } from 'express';

@Injectable()
export class RelatoriosService {
  constructor(private prisma: PrismaService) {}

  async inventario(negocioId: string, res: Response) {
    const itens = await this.prisma.estoqueItem.findMany({
      where: { negocioId },
      include: {
        produto: {
          select: { id: true, nome: true, sku: true, status: true, preco: true },
        },
      },
      orderBy: { atualizadoEm: 'desc' },
    });

    const movimentacoes = await this.prisma.movimentacaoEstoque.findMany({
      where: { negocioId },
      orderBy: { criadoEm: 'desc' },
      take: 1000,
      include: {
        estoqueItem: {
          include: { produto: { select: { nome: true } } },
        },
        usuario: { select: { nome: true } },
      },
    });

    const csv = this.gerarCSVInventario(itens, movimentacoes);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="inventario-${negocioId}-${Date.now()}.csv"`,
    );
    res.send('\uFEFF' + csv);
  }

  private gerarCSVInventario(
    itens: any[],
    movimentacoes: any[],
  ): string {
    const headers1 = [
      'Produto ID',
      'SKU',
      'Nome',
      'Status',
      'Preço',
      'Quantidade Atual',
      'Estoque Mínimo',
      'Unidade',
      'Última Atualização',
    ];

    const rows1 = itens.map((item) => [
      item.produto.id,
      item.produto.sku || '',
      item.produto.nome,
      item.produto.status,
      item.produto.preco.toString(),
      item.quantidadeAtual.toString(),
      item.estoqueMinimo.toString(),
      item.unidade,
      item.atualizadoEm.toISOString(),
    ]);

    const headers2 = [
      'Data',
      'Tipo',
      'Produto',
      'Quantidade',
      'Quantidade Antes',
      'Quantidade Depois',
      'Responsável',
      'Motivo',
      'Referência',
    ];

    const rows2 = movimentacoes.map((mov) => [
      mov.criadoEm.toISOString(),
      mov.tipo,
      mov.estoqueItem?.produto?.nome || '',
      mov.quantidade.toString(),
      mov.quantidadeAntes.toString(),
      mov.quantidadeApos.toString(),
      mov.usuario?.nome || '',
      mov.motivo || '',
      mov.referencia || '',
    ]);

    const escape = (val: string) =>
      `"${val.replace(/"/g, '""')}"`;

    const lines = [
      headers1.map(escape).join(','),
      ...rows1.map((r) => r.map(escape).join(',')),
      '',
      'HISTÓRICO DE MOVIMENTAÇÕES (últimas 1000)',
      '',
      headers2.map(escape).join(','),
      ...rows2.map((r) => r.map(escape).join(',')),
    ];

    return lines.join('\n');
  }
}