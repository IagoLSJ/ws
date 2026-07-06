export enum RoleNegocio {
  SUPER_ADMIN = 'SUPER_ADMIN',
  GERENTE = 'GERENTE',
  OPERADOR = 'OPERADOR',
  VISUALIZADOR = 'VISUALIZADOR',
}

export enum ProdutoStatus {
  ATIVO = 'ATIVO',
  PAUSADO = 'PAUSADO',
  ESGOTADO = 'ESGOTADO',
}

export enum TipoMovimentacao {
  ENTRADA = 'ENTRADA',
  SAIDA_VENDA = 'SAIDA_VENDA',
  SAIDA_AJUSTE = 'SAIDA_AJUSTE',
  PERDA = 'PERDA',
  TRANSFERENCIA_ENTRADA = 'TRANSFERENCIA_ENTRADA',
  TRANSFERENCIA_SAIDA = 'TRANSFERENCIA_SAIDA',
  INVENTARIO = 'INVENTARIO',
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  avatarUrl?: string;
  criadoEm: string;
  membros?: MembroNegocio[];
}

export interface Negocio {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  logoUrl?: string;
  bannerUrl?: string;
  ativo: boolean;
  criadoEm: string;
  _count?: { membros: number; produtos: number; categorias: number; pedidos: number };
  configuracoes?: ConfiguracaoNegocio;
}

export interface ConfiguracaoNegocio {
  controleEstoqueAtivo: boolean;
  estoqueMinimoPadrao: number;
  taxaFrete: number;
  webhookUrl?: string;
  emailAlertas?: string;
  horarioFuncionamento?: Record<string, any>;
  endereco?: Record<string, any>;
  telefoneContato?: string;
}

export interface MembroNegocio {
  id: string;
  usuarioId: string;
  negocioId: string;
  role: RoleNegocio;
  ativo: boolean;
  usuario: { id: string; nome: string; email: string };
  negocio?: { id: string; nome: string; slug: string; logoUrl?: string };
}

export interface Categoria {
  id: string;
  negocioId: string;
  nome: string;
  descricao?: string;
  iconUrl?: string;
  ordem: number;
  ativo: boolean;
  _count?: { produtos: number };
}

export interface Produto {
  id: string;
  negocioId: string;
  categoriaId?: string;
  nome: string;
  descricao?: string;
  preco: number;
  tipoDesconto?: 'PERCENTUAL' | 'FIXO' | null;
  valorDesconto?: number;
  sku?: string;
  status: ProdutoStatus;
  destaque: boolean;
  ordem: number;
  controlaEstoque: boolean;
  categoria?: Categoria;
  imagens?: ImagemProduto[];
  gruposModificadores?: GrupoModificador[];
  estoqueItem?: EstoqueItem;
  _count?: { pedidoItens: number };
}

export function calcularPrecoFinal(produto: { preco: number; tipoDesconto?: string | null; valorDesconto?: number | null }): number {
  const preco = Number(produto.preco);
  const desconto = Number(produto.valorDesconto || 0);
  if (!produto.tipoDesconto || !produto.valorDesconto || desconto <= 0) return preco;
  if (produto.tipoDesconto === 'FIXO') return Math.max(0, preco - desconto);
  if (produto.tipoDesconto === 'PERCENTUAL') return Math.max(0, preco - (preco * desconto / 100));
  return preco;
}

export function formatarDesconto(produto: { preco: number; tipoDesconto?: string | null; valorDesconto?: number | null }): string | null {
  const desconto = Number(produto.valorDesconto || 0);
  if (!produto.tipoDesconto || !produto.valorDesconto || desconto <= 0) return null;
  if (produto.tipoDesconto === 'PERCENTUAL') return `${desconto}% OFF`;
  if (produto.tipoDesconto === 'FIXO') return `-R$ ${desconto.toFixed(2)}`;
  return null;
}

export interface ImagemProduto {
  id: string;
  produtoId: string;
  url: string;
  ordem: number;
  principal: boolean;
}

export interface GrupoModificador {
  id: string;
  produtoId: string;
  nome: string;
  obrigatorio: boolean;
  minSelecao: number;
  maxSelecao: number;
  ordem: number;
  opcoes: OpcaoModificador[];
}

export interface OpcaoModificador {
  id: string;
  grupoId: string;
  nome: string;
  precoExtra: number;
  ativo: boolean;
  ordem: number;
}

export interface EstoqueItem {
  id: string;
  negocioId: string;
  produtoId?: string;
  nome: string;
  sku?: string;
  ehAvulso: boolean;
  quantidadeAtual: number;
  estoqueMinimo: number;
  unidade: string;
  produto?: Produto;
}

export interface MovimentacaoEstoque {
  id: string;
  negocioId: string;
  estoqueItemId: string;
  usuarioId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  quantidadeAntes: number;
  quantidadeApos: number;
  motivo?: string;
  referencia?: string;
  criadoEm: string;
  usuario?: { id: string; nome: string };
}

export interface LoginResponse {
  user: { id: string; nome: string; email: string };
  accessToken: string;
  refreshToken: string;
}

export interface NegocioResumo {
  id: string;
  nome: string;
  slug: string;
  logoUrl?: string;
}

export interface VitrineResponse {
  negocio: Negocio;
  categorias: Categoria[];
  produtos: Produto[];
}

export interface DashboardResumo {
  faturamentoHoje: number;
  faturamentoSemana: number;
  faturamentoMes: number;
  pedidosHoje: number;
  pedidosSemana: number;
  pedidosMes: number;
  pedidosPendentes: number;
  pedidosPorStatus: { status: string; count: number }[];
  maisVendidos: { produtoNome: string; produtoId: string; totalVendido: number; receita: number }[];
  totalProdutos: number;
  totalCategorias: number;
  totalMembros: number;
  alertasCount: number;
  ultimosPedidos: { id: string; status: StatusPedido; total: number; criadoEm: string; taxaFrete: number | null }[];
}

export enum StatusPedido {
  PENDENTE = 'PENDENTE',
  CONFIRMADO = 'CONFIRMADO',
  PREPARANDO = 'PREPARANDO',
  PRONTO = 'PRONTO',
  SAIU_PARA_ENTREGA = 'SAIU_PARA_ENTREGA',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
}

export enum MetodoPagamento {
  DINHEIRO = 'DINHEIRO',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  PIX = 'PIX',
  OUTRO = 'OUTRO',
}

export enum StatusPagamento {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  RECUSADO = 'RECUSADO',
  CANCELADO = 'CANCELADO',
  ESTORNADO = 'ESTORNADO',
}

export interface CarrinhoItemOpcao {
  id: string;
  carrinhoItemId: string;
  opcaoId: string;
  opcao: OpcaoModificador;
}

export interface CarrinhoItem {
  id: string;
  carrinhoId: string;
  produtoId: string;
  quantidade: number;
  observacao?: string;
  produto: {
    id: string;
    nome: string;
    preco: number;
    tipoDesconto?: string | null;
    valorDesconto?: number;
    imagens?: ImagemProduto[];
  };
  opcoesSelecionadas: CarrinhoItemOpcao[];
}

export interface CarrinhoResponse {
  itens: CarrinhoItem[];
  total: number;
}

export interface PedidoItem {
  id: string;
  pedidoId: string;
  produtoId: string;
  produtoNome: string;
  precoUnitario: number;
  quantidade: number;
  modificadores?: any;
}

export interface Pagamento {
  id: string;
  pedidoId: string;
  valor: number;
  metodo: MetodoPagamento;
  status: StatusPagamento;
  transacaoId?: string;
}

export interface EnderecoEntrega {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface Pedido {
  id: string;
  negocioId: string;
  sessionId: string;
  status: StatusPedido;
  total: number;
  tipoEntrega?: 'RETIRADA' | 'ENTREGA';
  taxaFrete?: number;
  observacao?: string;
  endereco?: EnderecoEntrega;
  contato?: string;
  agendadoPara?: string;
  criadoEm: string;
  itens: PedidoItem[];
  pagamentos: Pagamento[];
}
