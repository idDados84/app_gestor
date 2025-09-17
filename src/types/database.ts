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
  descricao: string;
  // Campos financeiros expandidos
  valor_operacao: number;      // Valor base da operação (sem acréscimos/descontos)
  valor_juros: number;         // Juros aplicados
  valor_multas: number;        // Multas por atraso/inadimplência
  valor_atualizacao: number;   // Correção monetária/indexação
  valor_descontos: number;     // Descontos concedidos
  valor_abto?: number;         // Abatimentos (compensações/devoluções) - optional as may not exist in DB
  valor_pagto: number;         // Pagamentos já realizados
  valor_financeiro: number;    // Saldo líquido calculado automaticamente
  valor_parcela: number;       // Valor individual da parcela
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
  n_docto_origem?: string;
  n_doctos_ref?: string[] | null;
  projetos?: string[] | null;
  sku_parcela?: string;
  intervalo_ini?: number;
  intervalo_rec?: number;
  eh_vencto_fixo?: boolean;
  empresas?: Empresa;
  participantes?: Participante;
  categorias?: Categoria;
  departamentos?: Departamento;
  formas_cobranca?: FormaCobranca;
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
  descricao: string;
  // Campos financeiros expandidos
  valor_operacao: number;      // Valor base da operação (sem acréscimos/descontos)
  valor_juros: number;         // Juros aplicados
  valor_multas: number;        // Multas por atraso/inadimplência
  valor_atualizacao: number;   // Correção monetária/indexação
  valor_descontos: number;     // Descontos concedidos
  valor_abto?: number;         // Abatimentos (compensações/devoluções) - optional as may not exist in DB
  valor_pagto: number;         // Pagamentos já realizados
  valor_financeiro: number;    // Saldo líquido calculado automaticamente
  valor_parcela: number;       // Valor individual da parcela
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
  n_docto_origem?: string;
  n_doctos_ref?: string[] | null;
  projetos?: string[] | null;
  sku_parcela?: string;
  intervalo_ini?: number;
  intervalo_rec?: number;
  eh_vencto_fixo?: boolean;
  empresas?: Empresa;
  participantes?: Participante;
  categorias?: Categoria;
  departamentos?: Departamento;
  formas_cobranca?: FormaCobranca;
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

// Novas interfaces para as 4 tabelas centralizadas
export interface Faturamento {
  id_faturamento: string;
  cod_faturamento?: string;
  n_documento_origem?: string;
  dt_faturamento: string;
  valor_original: number;
  cod_participante?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Parcelamento {
  id_parcelamento: string;
  id_faturamento_fk: string;
  valor_base: number;
  qtd_parcelas: number;
  valor_entrada?: number;
  juros: number;
  multas: number;
  atualizacao: number;
  descontos: number;
  abatimentos: number;
  valor_total_parcelas: number;
  dt_vencimento_entrada?: string;
  intervalo_ini: number;
  intervalo_rec: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Relacionamentos
  tbl_faturamentos?: Faturamento;
}

export interface Parcela {
  id_parcela: string;
  sku_parcela?: string;
  id_parcelamento_fk: string;
  n_parcela: number;
  valor_parcela: number;
  dt_vencimento: string;
  status_parcela: 'Aberto' | 'Parcial' | 'Liquidado' | 'Cancelado';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Relacionamentos
  tbl_parcelamentos?: Parcelamento;
}

export interface TransacaoFinanceira {
  id_transacao: string;
  id_faturamento_fk: string;
  id_parcela_fk: string;
  tipo_transacao: 'Entrada' | 'Pagamento de Parcela' | 'Estorno' | 'Ajuste';
  dt_pagamento: string;
  valor_pago: number;
  digito_ordem_pagamento: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Relacionamentos
  tbl_faturamentos?: Faturamento;
  tbl_parcelas?: Parcela;
}

// Interface unificada para visualização no frontend (combina dados das 4 tabelas)
export interface RegistroFinanceiroCompleto {
  // Identificadores
  id_faturamento: string;
  id_parcelamento: string;
  id_parcela: string;
  
  // Dados do faturamento
  cod_faturamento?: string;
  n_documento_origem?: string;
  dt_faturamento: string;
  valor_original: number;
  cod_participante?: string;
  
  // Dados do parcelamento
  valor_base: number;
  qtd_parcelas: number;
  valor_entrada?: number;
  juros: number;
  multas: number;
  atualizacao: number;
  descontos: number;
  abatimentos: number;
  valor_total_parcelas: number;
  dt_vencimento_entrada?: string;
  intervalo_ini: number;
  intervalo_rec: number;
  
  // Dados da parcela
  sku_parcela?: string;
  n_parcela: number;
  valor_parcela: number;
  dt_vencimento: string;
  status_parcela: 'Aberto' | 'Parcial' | 'Liquidado' | 'Cancelado';
  
  // Campos de controle
  tipo_registro: 'pagar' | 'receber'; // Para separar no frontend
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Relacionamentos externos (mantidos para compatibilidade)
  empresa_id?: string;
  participante_id?: string; // cliente_id ou fornecedor_id
  categoria_id?: string;
  departamento_id?: string;
  forma_cobranca_id?: string;
  conta_cobranca_id?: string;
  tipo_documento_id?: string;
  descricao?: string;
  observacoes?: string;
  
  // Dados eletrônicos e outros
  dados_ele?: ElectronicData;
  id_autorizacao?: string;
  n_doctos_ref?: string[];
  projetos?: string[];
  eh_vencto_fixo?: boolean;
  
  // Relacionamentos carregados
  empresas?: Empresa;
  participantes?: Participante;
  categorias?: Categoria;
  departamentos?: Departamento;
  formas_cobranca?: FormaCobranca;
  tipos_documentos?: TipoDocumento;
  
  // Dados de transações (para exibição de pagamentos)
  transacoes?: TransacaoFinanceira[];
  valor_pago_total?: number;
  valor_saldo?: number;
}

export interface FieldChange {
  field: string;
  label: string;
  icon: React.ComponentType<any>;
  oldValue: any;
  newValue: any;
  selected: boolean;
  description: string;
  newDayOfMonth?: number;
}