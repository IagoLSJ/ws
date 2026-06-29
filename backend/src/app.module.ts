import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infra/database/prisma.module';
import { RedisModule } from './infra/cache/redis.module';
import { MinioModule } from './infra/storage/minio.module';
import { BullModule } from './infra/queue/bullmq.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { NegociosModule } from './modules/negocios/negocios.module';
import { MembrosModule } from './modules/membros/membros.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { EstoqueModule } from './modules/estoque/estoque.module';
import { RelatoriosModule } from './modules/relatorios/relatorios.module';
import { CarrinhoModule } from './modules/carrinho/carrinho.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { PdvModule } from './modules/pdv/pdv.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    RedisModule,
    MinioModule,
    BullModule,
    AuthModule,
    UsuariosModule,
    NegociosModule,
    MembrosModule,
    CategoriasModule,
    ProdutosModule,
    EstoqueModule,
    RelatoriosModule,
    CarrinhoModule,
    PedidosModule,
    PdvModule,
    WhatsappModule,
  ],
})
export class AppModule {}
