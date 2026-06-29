import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { MinioService } from '../../infra/storage/minio.service';
import { CriarNegocioDto } from './dto/criar-negocio.dto';
import { AtualizarNegocioDto } from './dto/atualizar-negocio.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NegociosService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {}

  async create(dto: CriarNegocioDto) {
    const slug = dto.slug || dto.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existing = await this.prisma.negocio.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Slug já em uso');

    return this.prisma.negocio.create({
      data: {
        nome: dto.nome,
        slug,
        descricao: dto.descricao,
        configuracoes: {
          create: {
            controleEstoqueAtivo: true,
            estoqueMinimoPadrao: 5,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.negocio.findMany({
      orderBy: { criadoEm: 'desc' },
      include: { _count: { select: { membros: true, produtos: true } } },
    });
  }

  async findOne(id: string) {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id },
      include: {
        configuracoes: true,
        _count: { select: { membros: true, produtos: true, categorias: true } },
      },
    });
    if (!negocio) throw new NotFoundException('Negócio não encontrado');
    return negocio;
  }

  async findOneBySlug(slug: string) {
    const negocio = await this.prisma.negocio.findUnique({
      where: { slug, ativo: true },
      include: { configuracoes: true },
    });
    if (!negocio) throw new NotFoundException('Negócio não encontrado');
    return negocio;
  }

  async update(id: string, dto: AtualizarNegocioDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.slug) {
      const existing = await this.prisma.negocio.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) throw new ConflictException('Slug já em uso');
    }

    return this.prisma.negocio.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.negocio.update({ where: { id }, data: { ativo: false } });
  }

  async listarAtivos() {
    return this.prisma.negocio.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, slug: true, logoUrl: true },
      orderBy: { nome: 'asc' },
    });
  }

  async requestLogoUploadUrl(id: string, fileName: string) {
    await this.findOne(id);

    const ext = fileName.split('.').pop();
    const key = `logos/${id}/${uuidv4()}.${ext}`;
    const url = await this.minio.getPresignedUploadUrl(key);

    return { url, key };
  }

  async confirmLogoUpload(id: string, key: string) {
    await this.findOne(id);

    return this.prisma.negocio.update({
      where: { id },
      data: { logoUrl: this.minio.buildObjectUrl(key) },
    });
  }

  async deleteLogo(id: string) {
    const negocio = await this.findOne(id);
    if (!negocio.logoUrl) return;

    const key = this.minio.extractKey(negocio.logoUrl);
    if (key) this.minio.deleteObject(key).catch(() => {});
    await this.prisma.negocio.update({ where: { id }, data: { logoUrl: undefined } });
  }
}
