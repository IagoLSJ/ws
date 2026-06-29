import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { RedisService } from '../../infra/cache/redis.service';
import { MinioService } from '../../infra/storage/minio.service';
import { CriarProdutoDto } from './dto/criar-produto.dto';
import { AtualizarProdutoDto } from './dto/atualizar-produto.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProdutosService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private minio: MinioService,
  ) {}

  private cacheKey(negocioId: string) {
    return `catalog:v2:${negocioId}:products`;
  }

  private async invalidateCache(negocioId: string) {
    await this.redis.del(this.cacheKey(negocioId));
  }

  async create(negocioId: string, dto: CriarProdutoDto) {
    const produto = await this.prisma.produto.create({
      data: {
        negocioId,
        categoriaId: dto.categoriaId,
        nome: dto.nome,
        descricao: dto.descricao,
        preco: dto.preco,
        tipoDesconto: dto.tipoDesconto,
        valorDesconto: dto.valorDesconto,
        sku: dto.sku,
        status: dto.status || 'ATIVO',
        destaque: dto.destaque || false,
        ordem: dto.ordem || 0,
        controlaEstoque: dto.controlaEstoque ?? true,
        gruposModificadores: dto.gruposModificadores
          ? {
              create: dto.gruposModificadores.map((g) => ({
                nome: g.nome,
                obrigatorio: g.obrigatorio || false,
                minSelecao: g.minSelecao || 0,
                maxSelecao: g.maxSelecao || 1,
                ordem: g.ordem || 0,
                opcoes: {
                  create: g.opcoes.map((o) => ({
                    nome: o.nome,
                    precoExtra: o.precoExtra || 0,
                    ordem: o.ordem || 0,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        categoria: true,
        imagens: { orderBy: { ordem: 'asc' } },
        gruposModificadores: { include: { opcoes: true } },
      },
    });

    await this.invalidateCache(negocioId);

    if (produto.controlaEstoque) {
      await this.prisma.estoqueItem.create({
        data: {
          negocioId,
          produtoId: produto.id,
          quantidadeAtual: 0,
          estoqueMinimo: 5,
        },
      });
    }

    return produto;
  }

  async findAll(negocioId: string) {
    return this.prisma.produto.findMany({
      where: { negocioId },
      orderBy: [{ ordem: 'asc' }, { criadoEm: 'desc' }],
      include: {
        categoria: true,
        imagens: { orderBy: { ordem: 'asc' } },
        gruposModificadores: { include: { opcoes: true }, orderBy: { ordem: 'asc' } },
        estoqueItem: { select: { quantidadeAtual: true, estoqueMinimo: true } },
      },
    });
  }

  async findOne(negocioId: string, id: string) {
    const produto = await this.prisma.produto.findFirst({
      where: { id, negocioId },
      include: {
        categoria: true,
        imagens: { orderBy: { ordem: 'asc' } },
        gruposModificadores: { include: { opcoes: true }, orderBy: { ordem: 'asc' } },
        estoqueItem: true,
      },
    });
    if (!produto) throw new NotFoundException('Produto não encontrado');
    return produto;
  }

  async update(negocioId: string, id: string, dto: AtualizarProdutoDto) {
    await this.findOne(negocioId, id);

    const data: any = { ...dto };
    delete data.gruposModificadores;

    if (dto.gruposModificadores) {
      await this.prisma.grupoModificador.deleteMany({ where: { produtoId: id } });

      await this.prisma.grupoModificador.createMany({
        data: dto.gruposModificadores.map((g) => ({
          produtoId: id,
          nome: g.nome!,
          obrigatorio: g.obrigatorio ?? false,
          minSelecao: g.minSelecao ?? 0,
          maxSelecao: g.maxSelecao ?? 1,
          ordem: g.ordem ?? 0,
        })),
      });

      for (const g of dto.gruposModificadores) {
        if (g.opcoes) {
          const grupo = await this.prisma.grupoModificador.findFirst({
            where: { produtoId: id, nome: g.nome },
          });
          if (grupo) {
            await this.prisma.opcaoModificador.createMany({
              data: g.opcoes.map((o) => ({
                grupoId: grupo.id,
                nome: o.nome!,
                precoExtra: o.precoExtra ?? 0,
                ordem: o.ordem ?? 0,
              })),
            });
          }
        }
      }
    }

    const produto = await this.prisma.produto.update({
      where: { id },
      data,
      include: {
        categoria: true,
        imagens: { orderBy: { ordem: 'asc' } },
        gruposModificadores: { include: { opcoes: true } },
      },
    });

    await this.invalidateCache(negocioId);
    return produto;
  }

  async remove(negocioId: string, id: string) {
    await this.findOne(negocioId, id);

    const imagens = await this.prisma.imagemProduto.findMany({ where: { produtoId: id } });
    for (const img of imagens) {
      const key = this.minio.extractKey(img.url);
      if (key) this.minio.deleteObject(key).catch(() => {});
    }

    await this.prisma.produto.delete({ where: { id } });
    await this.invalidateCache(negocioId);
  }

  async requestUploadUrl(negocioId: string, produtoId: string, fileName: string) {
    await this.findOne(negocioId, produtoId);

    const ext = fileName.split('.').pop();
    const key = `produtos/${negocioId}/${produtoId}/${uuidv4()}.${ext}`;
    const url = await this.minio.getPresignedUploadUrl(key);

    return { url, key };
  }

  async confirmUpload(negocioId: string, produtoId: string, key: string) {
    const produto = await this.findOne(negocioId, produtoId);

    const count = await this.prisma.imagemProduto.count({ where: { produtoId } });
    if (count >= 10) throw new Error('Limite de 10 imagens por produto');

    return this.prisma.imagemProduto.create({
      data: {
        produtoId,
        url: this.minio.buildObjectUrl(key),
        ordem: count,
        principal: count === 0,
      },
    });
  }

  async deleteImage(negocioId: string, produtoId: string, imagemId: string) {
    await this.findOne(negocioId, produtoId);

    const img = await this.prisma.imagemProduto.findFirst({
      where: { id: imagemId, produtoId },
    });
    if (!img) throw new NotFoundException('Imagem não encontrada');

    const key = this.minio.extractKey(img.url);
    if (key) this.minio.deleteObject(key).catch(() => {});

    await this.prisma.imagemProduto.delete({ where: { id: imagemId } });
  }

  async vitrine(slug: string) {
    const negocio = await this.prisma.negocio.findUnique({
      where: { slug, ativo: true },
      select: { id: true, nome: true, slug: true, descricao: true, logoUrl: true, bannerUrl: true, configuracoes: { select: { taxaFrete: true } } },
    });
    if (!negocio) throw new NotFoundException('Negócio não encontrado');

    const cacheKey = `catalog:v2:${negocio.id}:products`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const produtos = await this.prisma.produto.findMany({
      where: {
        negocioId: negocio.id,
        status: 'ATIVO',
      },
      orderBy: [{ destaque: 'desc' }, { ordem: 'asc' }, { criadoEm: 'desc' }],
      include: {
        categoria: { select: { id: true, nome: true } },
        imagens: { where: { principal: true }, take: 1 },
        gruposModificadores: {
          include: { opcoes: { where: { ativo: true } } },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    const categoriasMap = new Map<string, { id: string; nome: string }>();
    for (const p of produtos) {
      if (p.categoria && !categoriasMap.has(p.categoria.id)) {
        categoriasMap.set(p.categoria.id, p.categoria);
      }
    }

    const result = { negocio, categorias: Array.from(categoriasMap.values()), produtos };
    await this.redis.setex(cacheKey, 300, JSON.stringify(result));
    return result;
  }
}
