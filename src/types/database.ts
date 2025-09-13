export interface Usuario {
  id: string;
  auth_id?: string;
  nome: string;
  email: string;
  telefone?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface GrupoEmpresa {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Empresa {
  id: string;
  grupo_empresa_id?: string;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  grupos_empresas?: GrupoEmpresa;
}

export interface Departamento {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  empresas?: Empresa;
}

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'receita' | 'despesa' | 'ambos';
  cor: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Participante {
  id: string;
  nome: string;
  tipo: 'cliente' | 'fornecedor' | 'ambos';
  documento?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface FormaCobranca {
  id: string;
  nome: string;
  descricao?: string;
  prazo_dias: number;
  taxa_juros: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ContaCobranca {
  id: string;
  empresa_id: string;
  participante_id: string;
  categoria_id?: string;
  departamento_id?: string;
  forma_cobranca_id?: string;
  descricao: string;
  valor: number;
  tipo: 'pagar' | 'receber';
  status: 'pendente' | 'pago' | 'cancelado';
  data_vencimento: string;
  data_pagamento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  empresas?: Empresa;
  participantes?: Participante;
  categorias?: Categoria;
  departamentos?: Departamento;
  formas_cobranca?: FormaCobranca;
}

export interface ContaPagar {
  id: string;
  empresa_id: string;
  fornecedor_id: string;
  categoria_id?: string;
  departamento_id?: string;
  forma_cobranca_id?: string;
  conta_cobranca_id?: string;
  tipo_documento_id?: string;
  sku_parcela?: string;
  intervalo_ini?: number;
  intervalo_rec?: number;
  n_docto_origem?: string;
  n_doctos_ref?: string[];
  projetos?: string[];
  eh_vencto_fixo?: boolean;
  descricao: string;
  valor: number;
  status: 'pendente' | 'pago' | 'cancelado';
  data_vencimento: string;
  data_pagamento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  dados_ele?: ElectronicData; // JSON data for electronic payment information
  id_autorizacao?: string;
  eh_parcelado?: boolean;
  total_parcelas?: number;
  numero_parcela?: number;
  lancamento_pai_id?: string; // UUID of the parent installment
  eh_recorrente?: boolean;
  periodicidade?: string; // 'diario', 'semanal', 'mensal', 'anual'
  frequencia_recorrencia?: number;
  data_inicio_recorrencia?: string; // Date string
  termino_apos_ocorrencias?: number;
  termino_apos_data?: string; // Date string
  empresas?: Empresa;
  participantes?: Participante;
  categorias?: Categoria;
  departamentos?: Departamento;
  formas_cobranca?: FormaCobranca;
  contas_financeiras?: ContaFinanceira;
  tipos_documentos?: TipoDocumento;
}

export interface ContaReceber {
  id: string;
  empresa_id: string;
  cliente_id: string;
  categoria_id?: string;
  departamento_id?: string;
  forma_cobranca_id?: string;
  conta_cobranca_id?: string;
  tipo_documento_id?: string;
  sku_parcela?: string;
  intervalo_ini?: number;
  intervalo_rec?: number;
  n_docto_origem?: string;
  n_doctos_ref?: string[];
  projetos?: string[];
  eh_vencto_fixo?: boolean;
  descricao: string;
  valor: number;
  status: 'pendente' | 'recebido' | 'cancelado';
  data_vencimento: string;
  data_recebimento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  dados_ele?: ElectronicData; // JSON data for electronic payment information
  id_autorizacao?: string;
  eh_parcelado?: boolean;
  total_parcelas?: number;
  numero_parcela?: number;
  lancamento_pai_id?: string; // UUID of the parent installment
  eh_recorrente?: boolean;
  periodicidade?: string; // 'diario', 'semanal', 'mensal', 'anual'
  frequencia_recorrencia?: number;
  data_inicio_recorrencia?: string; // Date string
  termino_apos_ocorrencias?: number;
  empresas?: Empresa;
  participantes?: Participante;
  categorias?: Categoria;
  departamentos?: Departamento;
  formas_cobranca?: FormaCobranca;
  contas_financeiras?: ContaFinanceira;
  tipos_documentos?: TipoDocumento;
}

export interface ContaFinanceira {
  id: string;
  codigo_conta?: string;
  nome_conta: string;
  tipo_conta: 'BANCO' | 'CAIXA' | 'POUPANCA' | 'INVESTIMENTO';
  banco_codigo?: string;
  agencia?: string;
  conta_numero?: string;
  saldo_inicial: number;
  saldo_atual: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface TipoDocumento {
  id: string;
  codigo_tipo: string;
  nome_tipo: string;
  sigla_tipo: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ElectronicData {
  tipoIntegracao?: string;
  credenciadora?: string;
  bandeira?: string;
  numeroAutorizacao?: string;
  numeroNsu?: string;
}