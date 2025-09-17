import { supabase } from '../lib/supabase';
import { formatDateToYYYYMMDD, parseDateFromYYYYMMDD } from '../utils/dateUtils';
import { calculateInstallmentValues, calculateValorFinanceiro, generateSkuForNewRecord } from '../utils/financialCalculations';

import type { 
  Usuario, GrupoEmpresa, Empresa, Departamento, 
  Categoria, Participante, FormaCobranca, ContaCobranca,
  ContaPagar, ContaReceber, ContaFinanceira, TipoDocumento,
  Faturamento, Parcelamento, Parcela, TransacaoFinanceira, RegistroFinanceiroCompleto
} from '../types/database';

// Helper function to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

// Helper function to throw configuration error
const throwConfigError = () => {
  throw new Error('Please connect to Supabase first by clicking the "Connect to Supabase" button in the top right corner');
};

// Generic CRUD operations
class DatabaseService<T extends { id: string }> {
  constructor(private tableName: string) {}

  async getAll(relations?: string): Promise<T[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    let query = supabase.from(this.tableName).select(relations || '*').is('deleted_at', null);
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  async getById(id: string, relations?: string): Promise<T | null> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select(relations || '*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) throw error;
    return data;
  }

  async create(item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { error } = await supabase
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);
    
    if (error) throw error;
  }

  async search(column: string, term: string): Promise<T[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .ilike(column, `%${term}%`)
      .is('deleted_at', null);
    
    if (error) throw error;
    return data || [];
  }
}

// Service instances for each table
export const usuariosService = new DatabaseService<Usuario>('usuarios');
export const gruposEmpresasService = new DatabaseService<GrupoEmpresa>('grupos_empresas');
export const empresasService = new DatabaseService<Empresa>('empresas');
export const departamentosService = new DatabaseService<Departamento>('departamentos');
export const categoriasService = new DatabaseService<Categoria>('categorias');
export const participantesService = new DatabaseService<Participante>('participantes');
export const formasCobrancaService = new DatabaseService<FormaCobranca>('formas_cobranca');
export const contasCobrancaService = new DatabaseService<ContaCobranca>('contas_cobranca');
export const contasPagarService = new DatabaseService<ContaPagar>('contas_pagar');
export const contasReceberService = new DatabaseService<ContaReceber>('contas_receber');
export const contasFinanceirasService = new DatabaseService<ContaFinanceira>('contas_financeiras');
export const tiposDocumentosService = new DatabaseService<TipoDocumento>('tipos_documentos');

// Novos serviços para as 4 tabelas centralizadas
export const faturamentosService = new DatabaseService<Faturamento>('tbl_faturamentos');
export const parcelamentosService = new DatabaseService<Parcelamento>('tbl_parcelamentos');
export const parcelasService = new DatabaseService<Parcela>('tbl_parcelas');
export const transacoesFinanceirasService = new DatabaseService<TransacaoFinanceira>('tbl_transacoes_financeiras');

// Helper function to create extended services with all base methods
function createExtendedService<T extends { id: string }>(baseService: DatabaseService<T>) {
  return {
    getAll: baseService.getAll.bind(baseService),
    getById: baseService.getById.bind(baseService),
    create: baseService.create.bind(baseService),
    update: baseService.update.bind(baseService),
    delete: baseService.delete.bind(baseService),
    search: baseService.search.bind(baseService)
  };
}

// Extended service for empresas with relationships
export const empresasServiceExtended = {
  ...createExtendedService(empresasService),
  async getAllWithGroup(): Promise<Empresa[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from('empresas')
      .select('*, grupos_empresas(*)')
      .is('deleted_at', null);
    
    if (error) throw error;
    return data || [];
  }
};

// Extended service for departamentos with relationships  
export const departamentosServiceExtended = {
  ...createExtendedService(departamentosService),
  async getAllWithEmpresa(): Promise<Departamento[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from('departamentos')
      .select('*, empresas(*)')
      .is('deleted_at', null);
    
    if (error) throw error;
    return data || [];
  }
};

// Extended service for contas with full relationships
export const contasCobrancaServiceExtended = {
  ...createExtendedService(contasCobrancaService),
  async getAllWithRelations(): Promise<ContaCobranca[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from('contas_cobranca')
      .select(`
      *, 
      empresas(*), 
      participantes(*), 
      categorias(*), 
      departamentos(*), 
      formas_cobranca(*)
    `)
      .is('deleted_at', null);
    
    if (error) throw error;
    return data || [];
  },
  
  async getByStatus(status: string): Promise<ContaCobranca[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from('contas_cobranca')
      .select(`
        *, 
        empresas(*), 
        participantes(*), 
        categorias(*), 
        departamentos(*), 
        formas_cobranca(*)
      `)
      .eq('status', status)
      .is('deleted_at', null);
    
    if (error) throw error;
    return data || [];
  },

  async getByTipo(tipo: string): Promise<ContaCobranca[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from('contas_cobranca')
      .select(`
        *, 
        empresas(*), 
        participantes(*), 
        categorias(*), 
        departamentos(*), 
        formas_cobranca(*)
      `)
      .eq('tipo', tipo)
      .is('deleted_at', null);
    
    if (error) throw error;
    return data || [];
  }
};

// Novo serviço unificado para operações financeiras usando as 4 tabelas
export const registrosFinanceirosService = {
  // Buscar todos os registros financeiros com tipo específico
  async getAllByTipo(tipo: 'pagar' | 'receber'): Promise<RegistroFinanceiroCompleto[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    // Query complexa unindo as 4 tabelas + relacionamentos externos
    const { data, error } = await supabase
      .from('tbl_faturamentos')
      .select(`
        *,
        tbl_parcelamentos!inner (
          *,
          tbl_parcelas!inner (
            *,
            tbl_transacoes_financeiras (*)
          )
        )
      `)
      .eq('tbl_parcelamentos.tbl_parcelas.tipo_registro', tipo)
      .is('deleted_at', null)
      .is('tbl_parcelamentos.deleted_at', null)
      .is('tbl_parcelamentos.tbl_parcelas.deleted_at', null);
    
    if (error) throw error;
    
    // Transformar dados para o formato esperado pelo frontend
    const registros: RegistroFinanceiroCompleto[] = [];
    
    data?.forEach(faturamento => {
      faturamento.tbl_parcelamentos?.forEach((parcelamento: any) => {
        parcelamento.tbl_parcelas?.forEach((parcela: any) => {
          const registro: RegistroFinanceiroCompleto = {
            // Identificadores
            id_faturamento: faturamento.id_faturamento,
            id_parcelamento: parcelamento.id_parcelamento,
            id_parcela: parcela.id_parcela,
            
            // Dados do faturamento
            cod_faturamento: faturamento.cod_faturamento,
            n_documento_origem: faturamento.n_documento_origem,
            dt_faturamento: faturamento.dt_faturamento,
            valor_original: faturamento.valor_original,
            cod_participante: faturamento.cod_participante,
            
            // Dados do parcelamento
            valor_base: parcelamento.valor_base,
            qtd_parcelas: parcelamento.qtd_parcelas,
            valor_entrada: parcelamento.valor_entrada,
            juros: parcelamento.juros,
            multas: parcelamento.multas,
            atualizacao: parcelamento.atualizacao,
            descontos: parcelamento.descontos,
            abatimentos: parcelamento.abatimentos,
            valor_total_parcelas: parcelamento.valor_total_parcelas,
            dt_vencimento_entrada: parcelamento.dt_vencimento_entrada,
            intervalo_ini: parcelamento.intervalo_ini,
            intervalo_rec: parcelamento.intervalo_rec,
            
            // Dados da parcela
            sku_parcela: parcela.sku_parcela,
            n_parcela: parcela.n_parcela,
            valor_parcela: parcela.valor_parcela,
            dt_vencimento: parcela.dt_vencimento,
            status_parcela: parcela.status_parcela,
            
            // Campos de controle
            tipo_registro: tipo,
            created_at: faturamento.created_at,
            updated_at: parcela.updated_at,
            deleted_at: parcela.deleted_at,
            
            // Transações
            transacoes: parcela.tbl_transacoes_financeiras || [],
            valor_pago_total: (parcela.tbl_transacoes_financeiras || [])
              .reduce((sum: number, t: any) => sum + (t.valor_pago || 0), 0),
            valor_saldo: parcela.valor_parcela - (parcela.tbl_transacoes_financeiras || [])
              .reduce((sum: number, t: any) => sum + (t.valor_pago || 0), 0)
          };
          
          registros.push(registro);
        });
      });
    });
    
    return registros;
  },

  // Criar novo registro financeiro (faturamento + parcelamento + parcelas)
  async create(dados: {
    // Dados do faturamento
    cod_faturamento?: string;
    n_documento_origem?: string;
    dt_faturamento: string;
    valor_original: number;
    cod_participante?: string;
    
    // Dados do parcelamento
    qtd_parcelas: number;
    valor_entrada?: number;
    juros?: number;
    multas?: number;
    atualizacao?: number;
    descontos?: number;
    abatimentos?: number;
    dt_vencimento_entrada?: string;
    intervalo_ini?: number;
    intervalo_rec?: number;
    
    // Metadados para controle
    tipo_registro: 'pagar' | 'receber';
    
    // Campos externos para relacionamentos (serão armazenados em tabela auxiliar)
    empresa_id?: string;
    participante_id?: string;
    categoria_id?: string;
    departamento_id?: string;
    forma_cobranca_id?: string;
    conta_cobranca_id?: string;
    tipo_documento_id?: string;
    descricao?: string;
    observacoes?: string;
    dados_ele?: ElectronicData;
    id_autorizacao?: string;
    n_doctos_ref?: string[];
    projetos?: string[];
    eh_vencto_fixo?: boolean;
  }): Promise<RegistroFinanceiroCompleto[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const registrosCriados: RegistroFinanceiroCompleto[] = [];
    
    try {
      // 1. Criar faturamento
      const { data: faturamento, error: faturamentoError } = await supabase
        .from('tbl_faturamentos')
        .insert([{
          cod_faturamento: dados.cod_faturamento,
          n_documento_origem: dados.n_documento_origem,
          dt_faturamento: dados.dt_faturamento,
          valor_original: dados.valor_original,
          cod_participante: dados.cod_participante
        }])
        .select()
        .single();
      
      if (faturamentoError) throw faturamentoError;
      
      // 2. Calcular valores do parcelamento
      const valorEntrada = dados.valor_entrada || 0;
      const valorBase = dados.valor_original - valorEntrada;
      const juros = dados.juros || 0;
      const multas = dados.multas || 0;
      const atualizacao = dados.atualizacao || 0;
      const descontos = dados.descontos || 0;
      const abatimentos = dados.abatimentos || 0;
      const valorTotalParcelas = valorBase + juros + multas + atualizacao - descontos - abatimentos;
      
      // 3. Criar parcelamento
      const { data: parcelamento, error: parcelamentoError } = await supabase
        .from('tbl_parcelamentos')
        .insert([{
          id_faturamento_fk: faturamento.id_faturamento,
          valor_base: valorBase,
          qtd_parcelas: dados.qtd_parcelas,
          valor_entrada: valorEntrada,
          juros,
          multas,
          atualizacao,
          descontos,
          abatimentos,
          valor_total_parcelas: valorTotalParcelas,
          dt_vencimento_entrada: dados.dt_vencimento_entrada,
          intervalo_ini: dados.intervalo_ini || 0,
          intervalo_rec: dados.intervalo_rec || 30
        }])
        .select()
        .single();
      
      if (parcelamentoError) throw parcelamentoError;
      
      // 4. Calcular valores das parcelas
      const valoresParcelas = calculateInstallmentValues(valorTotalParcelas, dados.qtd_parcelas, valorEntrada > 0);
      
      // 5. Criar parcelas
      const parcelasParaCriar = [];
      
      // Parcela de entrada (se houver)
      if (valorEntrada > 0) {
        const skuEntrada = await this.generateSKU(
          dados.cod_faturamento || faturamento.id_faturamento.substring(0, 6),
          dados.n_documento_origem || '',
          0, // n_parcela para entrada
          dados.qtd_parcelas,
          dados.cod_participante || ''
        );
        
        parcelasParaCriar.push({
          sku_parcela: skuEntrada,
          id_parcelamento_fk: parcelamento.id_parcelamento,
          n_parcela: 0,
          valor_parcela: valorEntrada,
          dt_vencimento: dados.dt_vencimento_entrada || dados.dt_faturamento,
          status_parcela: 'Aberto',
          tipo_registro: dados.tipo_registro
        });
      }
      
      // Parcelas regulares
      for (let i = 0; i < dados.qtd_parcelas; i++) {
        const numeroParcela = i + 1;
        const valorParcela = valoresParcelas[valorEntrada > 0 ? i + 1 : i] || 0;
        
        // Calcular data de vencimento
        const dataBase = parseDateFromYYYYMMDD(dados.dt_faturamento);
        const diasParaAdicionar = (dados.intervalo_ini || 0) + (i * (dados.intervalo_rec || 30));
        dataBase.setDate(dataBase.getDate() + diasParaAdicionar);
        
        const skuParcela = await this.generateSKU(
          dados.cod_faturamento || faturamento.id_faturamento.substring(0, 6),
          dados.n_documento_origem || '',
          numeroParcela,
          dados.qtd_parcelas,
          dados.cod_participante || ''
        );
        
        parcelasParaCriar.push({
          sku_parcela: skuParcela,
          id_parcelamento_fk: parcelamento.id_parcelamento,
          n_parcela: numeroParcela,
          valor_parcela: valorParcela,
          dt_vencimento: formatDateToYYYYMMDD(dataBase),
          status_parcela: 'Aberto',
          tipo_registro: dados.tipo_registro
        });
      }
      
      // Inserir todas as parcelas
      const { data: parcelas, error: parcelasError } = await supabase
        .from('tbl_parcelas')
        .insert(parcelasParaCriar)
        .select();
      
      if (parcelasError) throw parcelasError;
      
      // 6. Criar registros completos para retorno
      parcelas?.forEach(parcela => {
        const registro: RegistroFinanceiroCompleto = {
          // Identificadores
          id_faturamento: faturamento.id_faturamento,
          id_parcelamento: parcelamento.id_parcelamento,
          id_parcela: parcela.id_parcela,
          
          // Dados do faturamento
          cod_faturamento: faturamento.cod_faturamento,
          n_documento_origem: faturamento.n_documento_origem,
          dt_faturamento: faturamento.dt_faturamento,
          valor_original: faturamento.valor_original,
          cod_participante: faturamento.cod_participante,
          
          // Dados do parcelamento
          valor_base: parcelamento.valor_base,
          qtd_parcelas: parcelamento.qtd_parcelas,
          valor_entrada: parcelamento.valor_entrada,
          juros: parcelamento.juros,
          multas: parcelamento.multas,
          atualizacao: parcelamento.atualizacao,
          descontos: parcelamento.descontos,
          abatimentos: parcelamento.abatimentos,
          valor_total_parcelas: parcelamento.valor_total_parcelas,
          dt_vencimento_entrada: parcelamento.dt_vencimento_entrada,
          intervalo_ini: parcelamento.intervalo_ini,
          intervalo_rec: parcelamento.intervalo_rec,
          
          // Dados da parcela
          sku_parcela: parcela.sku_parcela,
          n_parcela: parcela.n_parcela,
          valor_parcela: parcela.valor_parcela,
          dt_vencimento: parcela.dt_vencimento,
          status_parcela: parcela.status_parcela,
          
          // Campos de controle
          tipo_registro: dados.tipo_registro,
          created_at: faturamento.created_at,
          updated_at: parcela.updated_at,
          
          // Campos externos (para compatibilidade com frontend)
          empresa_id: dados.empresa_id,
          participante_id: dados.participante_id,
          categoria_id: dados.categoria_id,
          departamento_id: dados.departamento_id,
          forma_cobranca_id: dados.forma_cobranca_id,
          conta_cobranca_id: dados.conta_cobranca_id,
          tipo_documento_id: dados.tipo_documento_id,
          descricao: dados.descricao,
          observacoes: dados.observacoes,
          dados_ele: dados.dados_ele,
          id_autorizacao: dados.id_autorizacao,
          n_doctos_ref: dados.n_doctos_ref,
          projetos: dados.projetos,
          eh_vencto_fixo: dados.eh_vencto_fixo,
          
          // Transações
          transacoes: [],
          valor_pago_total: 0,
          valor_saldo: parcela.valor_parcela
        };
        
        registrosCriados.push(registro);
      });
      
      return registrosCriados;
      
    } catch (error) {
      console.error('Erro ao criar registro financeiro:', error);
      throw error;
    }
  },

  // Atualizar registro financeiro
  async update(idParcela: string, updates: Partial<{
    // Campos do faturamento
    cod_faturamento?: string;
    n_documento_origem?: string;
    dt_faturamento?: string;
    valor_original?: number;
    cod_participante?: string;
    
    // Campos do parcelamento
    valor_entrada?: number;
    juros?: number;
    multas?: number;
    atualizacao?: number;
    descontos?: number;
    abatimentos?: number;
    dt_vencimento_entrada?: string;
    intervalo_ini?: number;
    intervalo_rec?: number;
    
    // Campos da parcela
    sku_parcela?: string;
    dt_vencimento?: string;
    status_parcela?: 'Aberto' | 'Parcial' | 'Liquidado' | 'Cancelado';
    
    // Campos externos
    empresa_id?: string;
    participante_id?: string;
    categoria_id?: string;
    departamento_id?: string;
    forma_cobranca_id?: string;
    conta_cobranca_id?: string;
    tipo_documento_id?: string;
    descricao?: string;
    observacoes?: string;
    dados_ele?: ElectronicData;
    id_autorizacao?: string;
    n_doctos_ref?: string[];
    projetos?: string[];
    eh_vencto_fixo?: boolean;
  }>): Promise<RegistroFinanceiroCompleto> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    // Buscar dados atuais da parcela para obter IDs relacionados
    const { data: parcelaAtual, error: parcelaError } = await supabase
      .from('tbl_parcelas')
      .select(`
        *,
        tbl_parcelamentos!inner (
          *,
          tbl_faturamentos!inner (*)
        )
      `)
      .eq('id_parcela', idParcela)
      .is('deleted_at', null)
      .single();
    
    if (parcelaError || !parcelaAtual) throw parcelaError || new Error('Parcela não encontrada');
    
    const parcelamento = parcelaAtual.tbl_parcelamentos;
    const faturamento = parcelamento.tbl_faturamentos;
    
    // Separar updates por tabela
    const faturamentoUpdates: any = {};
    const parcelamentoUpdates: any = {};
    const parcelaUpdates: any = {};
    
    // Campos do faturamento
    if (updates.cod_faturamento !== undefined) faturamentoUpdates.cod_faturamento = updates.cod_faturamento;
    if (updates.n_documento_origem !== undefined) faturamentoUpdates.n_documento_origem = updates.n_documento_origem;
    if (updates.dt_faturamento !== undefined) faturamentoUpdates.dt_faturamento = updates.dt_faturamento;
    if (updates.valor_original !== undefined) faturamentoUpdates.valor_original = updates.valor_original;
    if (updates.cod_participante !== undefined) faturamentoUpdates.cod_participante = updates.cod_participante;
    
    // Campos do parcelamento
    if (updates.valor_entrada !== undefined) parcelamentoUpdates.valor_entrada = updates.valor_entrada;
    if (updates.juros !== undefined) parcelamentoUpdates.juros = updates.juros;
    if (updates.multas !== undefined) parcelamentoUpdates.multas = updates.multas;
    if (updates.atualizacao !== undefined) parcelamentoUpdates.atualizacao = updates.atualizacao;
    if (updates.descontos !== undefined) parcelamentoUpdates.descontos = updates.descontos;
    if (updates.abatimentos !== undefined) parcelamentoUpdates.abatimentos = updates.abatimentos;
    if (updates.dt_vencimento_entrada !== undefined) parcelamentoUpdates.dt_vencimento_entrada = updates.dt_vencimento_entrada;
    if (updates.intervalo_ini !== undefined) parcelamentoUpdates.intervalo_ini = updates.intervalo_ini;
    if (updates.intervalo_rec !== undefined) parcelamentoUpdates.intervalo_rec = updates.intervalo_rec;
    
    // Campos da parcela
    if (updates.sku_parcela !== undefined) parcelaUpdates.sku_parcela = updates.sku_parcela;
    if (updates.dt_vencimento !== undefined) parcelaUpdates.dt_vencimento = updates.dt_vencimento;
    if (updates.status_parcela !== undefined) parcelaUpdates.status_parcela = updates.status_parcela;
    
    // Executar updates nas tabelas necessárias
    if (Object.keys(faturamentoUpdates).length > 0) {
      const { error: faturamentoError } = await supabase
        .from('tbl_faturamentos')
        .update(faturamentoUpdates)
        .eq('id_faturamento', faturamento.id_faturamento);
      
      if (faturamentoError) throw faturamentoError;
    }
    
    if (Object.keys(parcelamentoUpdates).length > 0) {
      const { error: parcelamentoError } = await supabase
        .from('tbl_parcelamentos')
        .update(parcelamentoUpdates)
        .eq('id_parcelamento', parcelamento.id_parcelamento);
      
      if (parcelamentoError) throw parcelamentoError;
    }
    
    if (Object.keys(parcelaUpdates).length > 0) {
      const { error: parcelaError } = await supabase
        .from('tbl_parcelas')
        .update(parcelaUpdates)
        .eq('id_parcela', idParcela);
      
      if (parcelaError) throw parcelaError;
    }
    
    // Buscar dados atualizados para retorno
    const registrosAtualizados = await this.getAllByTipo(parcelaAtual.tipo_registro as 'pagar' | 'receber');
    const registroAtualizado = registrosAtualizados.find(r => r.id_parcela === idParcela);
    
    if (!registroAtualizado) {
      throw new Error('Erro ao buscar registro atualizado');
    }
    
    return registroAtualizado;
  },

  // Excluir registro financeiro (soft delete)
  async delete(idParcela: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    // Buscar dados da parcela para obter IDs relacionados
    const { data: parcela, error: parcelaError } = await supabase
      .from('tbl_parcelas')
      .select(`
        *,
        tbl_parcelamentos!inner (
          *,
          tbl_faturamentos!inner (*)
        )
      `)
      .eq('id_parcela', idParcela)
      .is('deleted_at', null)
      .single();
    
    if (parcelaError || !parcela) throw parcelaError || new Error('Parcela não encontrada');
    
    const parcelamento = parcela.tbl_parcelamentos;
    const faturamento = parcelamento.tbl_faturamentos;
    
    // Soft delete em cascata
    const now = new Date().toISOString();
    
    // Marcar parcela como excluída
    const { error: parcelaDeleteError } = await supabase
      .from('tbl_parcelas')
      .update({ deleted_at: now })
      .eq('id_parcela', idParcela);
    
    if (parcelaDeleteError) throw parcelaDeleteError;
    
    // Verificar se há outras parcelas ativas no parcelamento
    const { data: outrasParcelasAtivas, error: outrasParcelasError } = await supabase
      .from('tbl_parcelas')
      .select('id_parcela')
      .eq('id_parcelamento_fk', parcelamento.id_parcelamento)
      .is('deleted_at', null);
    
    if (outrasParcelasError) throw outrasParcelasError;
    
    // Se não há outras parcelas ativas, marcar parcelamento como excluído
    if (!outrasParcelasAtivas || outrasParcelasAtivas.length === 0) {
      const { error: parcelamentoDeleteError } = await supabase
        .from('tbl_parcelamentos')
        .update({ deleted_at: now })
        .eq('id_parcelamento', parcelamento.id_parcelamento);
      
      if (parcelamentoDeleteError) throw parcelamentoDeleteError;
      
      // Verificar se há outros parcelamentos ativos no faturamento
      const { data: outrosParcelamentosAtivos, error: outrosParcelamentosError } = await supabase
        .from('tbl_parcelamentos')
        .select('id_parcelamento')
        .eq('id_faturamento_fk', faturamento.id_faturamento)
        .is('deleted_at', null);
      
      if (outrosParcelamentosError) throw outrosParcelamentosError;
      
      // Se não há outros parcelamentos ativos, marcar faturamento como excluído
      if (!outrosParcelamentosAtivos || outrosParcelamentosAtivos.length === 0) {
        const { error: faturamentoDeleteError } = await supabase
          .from('tbl_faturamentos')
          .update({ deleted_at: now })
          .eq('id_faturamento', faturamento.id_faturamento);
        
        if (faturamentoDeleteError) throw faturamentoDeleteError;
      }
    }
  },

  // Gerar SKU único para parcela
  async generateSKU(
    codFaturamento: string,
    nDocumentoOrigem: string,
    nParcela: number,
    qtdParcelas: number,
    codParticipante: string
  ): Promise<string> {
    const docTypeFormatted = codFaturamento.padStart(2, '0');
    const originDocFormatted = (nDocumentoOrigem || codParticipante.substring(0, 6)).padStart(6, '0');
    const totalParcelasFormatted = qtdParcelas.toString().padStart(2, '0');
    const numeroParcelaFormatted = nParcela.toString().padStart(2, '0');
    const lastTwoDigits = codParticipante.length >= 2 ? codParticipante.slice(-2) : '00';
    
    return `${docTypeFormatted}-${originDocFormatted}-${totalParcelasFormatted}-${numeroParcelaFormatted}-${lastTwoDigits}`;
  }
};

// Funções de mapeamento entre formatos antigo e novo

// Mapear RegistroFinanceiroCompleto para ContaPagar
function mapRegistroToContaPagar(registro: RegistroFinanceiroCompleto): ContaPagar {
  return {
    id: registro.id_parcela, // Usar ID da parcela como ID principal
    empresa_id: registro.empresa_id || '',
    fornecedor_id: registro.participante_id || '',
    categoria_id: registro.categoria_id,
    departamento_id: registro.departamento_id,
    forma_cobranca_id: registro.forma_cobranca_id,
    conta_cobranca_id: registro.conta_cobranca_id,
    tipo_documento_id: registro.tipo_documento_id,
    descricao: registro.descricao || '',
    valor_operacao: registro.valor_original,
    valor_juros: registro.juros,
    valor_multas: registro.multas,
    valor_atualizacao: registro.atualizacao,
    valor_descontos: registro.descontos,
    valor_abto: registro.abatimentos,
    valor_pagto: registro.valor_pago_total || 0,
    valor_financeiro: registro.valor_total_parcelas,
    valor_parcela: registro.valor_parcela,
    status: registro.status_parcela === 'Aberto' ? 'pendente' : 
            registro.status_parcela === 'Liquidado' ? 'pago' : 'cancelado',
    data_vencimento: registro.dt_vencimento,
    data_pagamento: registro.transacoes && registro.transacoes.length > 0 ? 
                   registro.transacoes[0].dt_pagamento : undefined,
    observacoes: registro.observacoes,
    created_at: registro.created_at,
    updated_at: registro.updated_at,
    deleted_at: registro.deleted_at,
    dados_ele: registro.dados_ele,
    id_autorizacao: registro.id_autorizacao,
    eh_parcelado: registro.qtd_parcelas > 1,
    total_parcelas: registro.qtd_parcelas,
    numero_parcela: registro.n_parcela,
    lancamento_pai_id: registro.n_parcela > 1 ? registro.id_faturamento : undefined,
    eh_recorrente: false, // Será implementado posteriormente
    periodicidade: undefined,
    frequencia_recorrencia: undefined,
    data_inicio_recorrencia: undefined,
    termino_apos_ocorrencias: undefined,
    n_docto_origem: registro.n_documento_origem,
    n_doctos_ref: registro.n_doctos_ref,
    projetos: registro.projetos,
    sku_parcela: registro.sku_parcela,
    intervalo_ini: registro.intervalo_ini,
    intervalo_rec: registro.intervalo_rec,
    eh_vencto_fixo: registro.eh_vencto_fixo
  };
}

// Mapear RegistroFinanceiroCompleto para ContaReceber
function mapRegistroToContaReceber(registro: RegistroFinanceiroCompleto): ContaReceber {
  return {
    id: registro.id_parcela, // Usar ID da parcela como ID principal
    empresa_id: registro.empresa_id || '',
    cliente_id: registro.participante_id || '',
    categoria_id: registro.categoria_id,
    departamento_id: registro.departamento_id,
    forma_cobranca_id: registro.forma_cobranca_id,
    conta_cobranca_id: registro.conta_cobranca_id,
    tipo_documento_id: registro.tipo_documento_id,
    descricao: registro.descricao || '',
    valor_operacao: registro.valor_original,
    valor_juros: registro.juros,
    valor_multas: registro.multas,
    valor_atualizacao: registro.atualizacao,
    valor_descontos: registro.descontos,
    valor_abto: registro.abatimentos,
    valor_pagto: registro.valor_pago_total || 0,
    valor_financeiro: registro.valor_total_parcelas,
    valor_parcela: registro.valor_parcela,
    status: registro.status_parcela === 'Aberto' ? 'pendente' : 
            registro.status_parcela === 'Liquidado' ? 'recebido' : 'cancelado',
    data_vencimento: registro.dt_vencimento,
    data_recebimento: registro.transacoes && registro.transacoes.length > 0 ? 
                     registro.transacoes[0].dt_pagamento : undefined,
    observacoes: registro.observacoes,
    created_at: registro.created_at,
    updated_at: registro.updated_at,
    deleted_at: registro.deleted_at,
    dados_ele: registro.dados_ele,
    id_autorizacao: registro.id_autorizacao,
    eh_parcelado: registro.qtd_parcelas > 1,
    total_parcelas: registro.qtd_parcelas,
    numero_parcela: registro.n_parcela,
    lancamento_pai_id: registro.n_parcela > 1 ? registro.id_faturamento : undefined,
    eh_recorrente: false, // Será implementado posteriormente
    periodicidade: undefined,
    frequencia_recorrencia: undefined,
    data_inicio_recorrencia: undefined,
    termino_apos_ocorrencias: undefined,
    n_docto_origem: registro.n_documento_origem,
    n_doctos_ref: registro.n_doctos_ref,
    projetos: registro.projetos,
    sku_parcela: registro.sku_parcela,
    intervalo_ini: registro.intervalo_ini,
    intervalo_rec: registro.intervalo_rec,
    eh_vencto_fixo: registro.eh_vencto_fixo
  };
}

// Mapear ContaPagar para formato de criação
function mapContaPagarToCreateInput(conta: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'>): any {
  return {
    // Dados do faturamento
    cod_faturamento: conta.sku_parcela?.split('-')[0] || undefined,
    n_documento_origem: conta.n_docto_origem,
    dt_faturamento: conta.data_vencimento, // Usar data de vencimento como data do faturamento
    valor_original: conta.valor_operacao,
    cod_participante: conta.fornecedor_id,
    
    // Dados do parcelamento
    qtd_parcelas: conta.total_parcelas || 1,
    valor_entrada: 0, // Por enquanto sem entrada
    juros: conta.valor_juros,
    multas: conta.valor_multas,
    atualizacao: conta.valor_atualizacao,
    descontos: conta.valor_descontos,
    abatimentos: conta.valor_abto || 0,
    dt_vencimento_entrada: undefined,
    intervalo_ini: conta.intervalo_ini,
    intervalo_rec: conta.intervalo_rec,
    
    // Metadados
    tipo_registro: 'pagar' as const,
    
    // Campos externos
    empresa_id: conta.empresa_id,
    participante_id: conta.fornecedor_id,
    categoria_id: conta.categoria_id,
    departamento_id: conta.departamento_id,
    forma_cobranca_id: conta.forma_cobranca_id,
    conta_cobranca_id: conta.conta_cobranca_id,
    tipo_documento_id: conta.tipo_documento_id,
    descricao: conta.descricao,
    observacoes: conta.observacoes,
    dados_ele: conta.dados_ele,
    id_autorizacao: conta.id_autorizacao,
    n_doctos_ref: conta.n_doctos_ref,
    projetos: conta.projetos,
    eh_vencto_fixo: conta.eh_vencto_fixo
  };
}

// Mapear ContaReceber para formato de criação
function mapContaReceberToCreateInput(conta: Omit<ContaReceber, 'id' | 'created_at' | 'updated_at'>): any {
  return {
    // Dados do faturamento
    cod_faturamento: conta.sku_parcela?.split('-')[0] || undefined,
    n_documento_origem: conta.n_docto_origem,
    dt_faturamento: conta.data_vencimento, // Usar data de vencimento como data do faturamento
    valor_original: conta.valor_operacao,
    cod_participante: conta.cliente_id,
    
    // Dados do parcelamento
    qtd_parcelas: conta.total_parcelas || 1,
    valor_entrada: 0, // Por enquanto sem entrada
    juros: conta.valor_juros,
    multas: conta.valor_multas,
    atualizacao: conta.valor_atualizacao,
    descontos: conta.valor_descontos,
    abatimentos: conta.valor_abto || 0,
    dt_vencimento_entrada: undefined,
    intervalo_ini: conta.intervalo_ini,
    intervalo_rec: conta.intervalo_rec,
    
    // Metadados
    tipo_registro: 'receber' as const,
    
    // Campos externos
    empresa_id: conta.empresa_id,
    participante_id: conta.cliente_id,
    categoria_id: conta.categoria_id,
    departamento_id: conta.departamento_id,
    forma_cobranca_id: conta.forma_cobranca_id,
    conta_cobranca_id: conta.conta_cobranca_id,
    tipo_documento_id: conta.tipo_documento_id,
    descricao: conta.descricao,
    observacoes: conta.observacoes,
    dados_ele: conta.dados_ele,
    id_autorizacao: conta.id_autorizacao,
    n_doctos_ref: conta.n_doctos_ref,
    projetos: conta.projetos,
    eh_vencto_fixo: conta.eh_vencto_fixo
  };
}

// Extended service for contas a pagar with compatibility methods
export const contasPagarServiceExtended = {
  async getAllWithRelations(): Promise<ContaPagar[]> {
    // Usar o novo serviço centralizado
    const registros = await registrosFinanceirosService.getAllByTipo('pagar');
    return registros.map(mapRegistroToContaPagar);
  },
  
  async create(item: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'>): Promise<ContaPagar> {
    // Converter para formato das novas tabelas e criar
    const createInput = mapContaPagarToCreateInput(item);
    const registrosCriados = await registrosFinanceirosService.create(createInput);
    
    // Retornar o primeiro registro criado (ou o principal se houver múltiplas parcelas)
    const registroPrincipal = registrosCriados.find(r => r.n_parcela === 1) || registrosCriados[0];
    return mapRegistroToContaPagar(registroPrincipal);
  },

  async update(id: string, updates: Partial<Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'>>): Promise<ContaPagar> {
    // Mapear updates para formato das novas tabelas
    const updateInput: any = {};
    
    // Mapear campos básicos
    if (updates.descricao !== undefined) updateInput.descricao = updates.descricao;
    if (updates.valor_operacao !== undefined) updateInput.valor_original = updates.valor_operacao;
    if (updates.valor_juros !== undefined) updateInput.juros = updates.valor_juros;
    if (updates.valor_multas !== undefined) updateInput.multas = updates.valor_multas;
    if (updates.valor_atualizacao !== undefined) updateInput.atualizacao = updates.valor_atualizacao;
    if (updates.valor_descontos !== undefined) updateInput.descontos = updates.valor_descontos;
    if (updates.valor_abto !== undefined) updateInput.abatimentos = updates.valor_abto;
    if (updates.data_vencimento !== undefined) updateInput.dt_vencimento = updates.data_vencimento;
    if (updates.sku_parcela !== undefined) updateInput.sku_parcela = updates.sku_parcela;
    if (updates.status !== undefined) {
      updateInput.status_parcela = updates.status === 'pendente' ? 'Aberto' : 
                                   updates.status === 'pago' ? 'Liquidado' : 'Cancelado';
    }
    
    // Mapear campos externos
    if (updates.empresa_id !== undefined) updateInput.empresa_id = updates.empresa_id;
    if (updates.fornecedor_id !== undefined) updateInput.participante_id = updates.fornecedor_id;
    if (updates.categoria_id !== undefined) updateInput.categoria_id = updates.categoria_id;
    if (updates.departamento_id !== undefined) updateInput.departamento_id = updates.departamento_id;
    if (updates.forma_cobranca_id !== undefined) updateInput.forma_cobranca_id = updates.forma_cobranca_id;
    if (updates.conta_cobranca_id !== undefined) updateInput.conta_cobranca_id = updates.conta_cobranca_id;
    if (updates.tipo_documento_id !== undefined) updateInput.tipo_documento_id = updates.tipo_documento_id;
    if (updates.observacoes !== undefined) updateInput.observacoes = updates.observacoes;
    if (updates.dados_ele !== undefined) updateInput.dados_ele = updates.dados_ele;
    if (updates.id_autorizacao !== undefined) updateInput.id_autorizacao = updates.id_autorizacao;
    if (updates.n_docto_origem !== undefined) updateInput.n_documento_origem = updates.n_docto_origem;
    if (updates.n_doctos_ref !== undefined) updateInput.n_doctos_ref = updates.n_doctos_ref;
    if (updates.projetos !== undefined) updateInput.projetos = updates.projetos;
    if (updates.eh_vencto_fixo !== undefined) updateInput.eh_vencto_fixo = updates.eh_vencto_fixo;
    
    const registroAtualizado = await registrosFinanceirosService.update(id, updateInput);
    return mapRegistroToContaPagar(registroAtualizado);
  },

  async delete(id: string): Promise<void> {
    await registrosFinanceirosService.delete(id);
  },

  async canDelete(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    if (!isSupabaseConfigured()) {
      return { canDelete: false, reason: 'Please connect to Supabase first' };
    }
    
    try {
      // Buscar parcela nas novas tabelas
      const { data: parcela, error } = await supabase
        .from('tbl_parcelas')
        .select(`
          *,
          tbl_parcelamentos!inner (
            qtd_parcelas,
            tbl_faturamentos!inner (*)
          )
        `)
        .eq('id_parcela', id)
        .is('deleted_at', null)
        .single();
      
      if (error || !parcela) {
        return { canDelete: false, reason: 'Registro não encontrado' };
      }
      
      const parcelamento = parcela.tbl_parcelamentos;
      
      // Se faz parte de uma série (mais de 1 parcela), verificar registros relacionados
      if (parcelamento.qtd_parcelas > 1) {
        const { data: relatedParcelas, error: relatedError } = await supabase
          .from('tbl_parcelas')
          .select('*')
          .eq('id_parcelamento_fk', parcelamento.id_parcelamento)
          .is('deleted_at', null);
        
        if (relatedError) throw relatedError;
        
        if (relatedParcelas && relatedParcelas.length > 1) {
          // Converter para formato antigo para compatibilidade com o modal
          const registros = await registrosFinanceirosService.getAllByTipo('pagar');
          const relatedRecords = registros
            .filter(r => relatedParcelas.some(p => p.id_parcela === r.id_parcela))
            .map(mapRegistroToContaPagar);
          
          return { 
            canDelete: false, 
            reason: 'Este registro faz parte de uma série. Use o cancelamento em massa.',
            requiresMassModal: true,
            relatedRecords
          };
        }
      }
      
      // Simple record - can be deleted normally
      return { canDelete: true };
    } catch (error) {
      console.error('Error checking delete permissions:', error);
      return { canDelete: false, reason: 'Erro ao verificar permissões de exclusão' };
    }
  },
  
  async cancelRecords(ids: string[]): Promise<void> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    // Cancelar parcelas nas novas tabelas
    const { error } = await supabase
      .from('tbl_parcelas')
      .update({ 
        status_parcela: 'Cancelado',
        updated_at: new Date().toISOString()
      })
      .in('id_parcela', ids)
      .is('deleted_at', null);
    
    if (error) throw error;
  }
};

// Extended service for contas a receber with compatibility methods
export const contasReceberServiceExtended = {
  async getAllWithRelations(): Promise<ContaReceber[]> {
    // Usar o novo serviço centralizado
    const registros = await registrosFinanceirosService.getAllByTipo('receber');
    return registros.map(mapRegistroToContaReceber);
  },
  
  async create(item: Omit<ContaReceber, 'id' | 'created_at' | 'updated_at'>): Promise<ContaReceber> {
    // Converter para formato das novas tabelas e criar
    const createInput = mapContaReceberToCreateInput(item);
    const registrosCriados = await registrosFinanceirosService.create(createInput);
    
    // Retornar o primeiro registro criado (ou o principal se houver múltiplas parcelas)
    const registroPrincipal = registrosCriados.find(r => r.n_parcela === 1) || registrosCriados[0];
    return mapRegistroToContaReceber(registroPrincipal);
  },

  async update(id: string, updates: Partial<Omit<ContaReceber, 'id' | 'created_at' | 'updated_at'>>): Promise<ContaReceber> {
    // Mapear updates para formato das novas tabelas
    const updateInput: any = {};
    
    // Mapear campos básicos
    if (updates.descricao !== undefined) updateInput.descricao = updates.descricao;
    if (updates.valor_operacao !== undefined) updateInput.valor_original = updates.valor_operacao;
    if (updates.valor_juros !== undefined) updateInput.juros = updates.valor_juros;
    if (updates.valor_multas !== undefined) updateInput.multas = updates.valor_multas;
    if (updates.valor_atualizacao !== undefined) updateInput.atualizacao = updates.valor_atualizacao;
    if (updates.valor_descontos !== undefined) updateInput.descontos = updates.valor_descontos;
    if (updates.valor_abto !== undefined) updateInput.abatimentos = updates.valor_abto;
    if (updates.data_vencimento !== undefined) updateInput.dt_vencimento = updates.data_vencimento;
    if (updates.sku_parcela !== undefined) updateInput.sku_parcela = updates.sku_parcela;
    if (updates.status !== undefined) {
      updateInput.status_parcela = updates.status === 'pendente' ? 'Aberto' : 
                                   updates.status === 'recebido' ? 'Liquidado' : 'Cancelado';
    }
    
    // Mapear campos externos
    if (updates.empresa_id !== undefined) updateInput.empresa_id = updates.empresa_id;
    if (updates.cliente_id !== undefined) updateInput.participante_id = updates.cliente_id;
    if (updates.categoria_id !== undefined) updateInput.categoria_id = updates.categoria_id;
    if (updates.departamento_id !== undefined) updateInput.departamento_id = updates.departamento_id;
    if (updates.forma_cobranca_id !== undefined) updateInput.forma_cobranca_id = updates.forma_cobranca_id;
    if (updates.conta_cobranca_id !== undefined) updateInput.conta_cobranca_id = updates.conta_cobranca_id;
    if (updates.tipo_documento_id !== undefined) updateInput.tipo_documento_id = updates.tipo_documento_id;
    if (updates.observacoes !== undefined) updateInput.observacoes = updates.observacoes;
    if (updates.dados_ele !== undefined) updateInput.dados_ele = updates.dados_ele;
    if (updates.id_autorizacao !== undefined) updateInput.id_autorizacao = updates.id_autorizacao;
    if (updates.n_docto_origem !== undefined) updateInput.n_documento_origem = updates.n_docto_origem;
    if (updates.n_doctos_ref !== undefined) updateInput.n_doctos_ref = updates.n_doctos_ref;
    if (updates.projetos !== undefined) updateInput.projetos = updates.projetos;
    if (updates.eh_vencto_fixo !== undefined) updateInput.eh_vencto_fixo = updates.eh_vencto_fixo;
    
    const registroAtualizado = await registrosFinanceirosService.update(id, updateInput);
    return mapRegistroToContaReceber(registroAtualizado);
  },

  async delete(id: string): Promise<void> {
    await registrosFinanceirosService.delete(id);
  },

  async canDelete(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    if (!isSupabaseConfigured()) {
      return { canDelete: false, reason: 'Please connect to Supabase first' };
    }
    
    try {
      // Buscar parcela nas novas tabelas
      const { data: parcela, error } = await supabase
        .from('tbl_parcelas')
        .select(`
          *,
          tbl_parcelamentos!inner (
            qtd_parcelas,
            tbl_faturamentos!inner (*)
          )
        `)
        .eq('id_parcela', id)
        .is('deleted_at', null)
        .single();
      
      if (error || !parcela) {
        return { canDelete: false, reason: 'Registro não encontrado' };
      }
      
      const parcelamento = parcela.tbl_parcelamentos;
      
      // Se faz parte de uma série (mais de 1 parcela), verificar registros relacionados
      if (parcelamento.qtd_parcelas > 1) {
        const { data: relatedParcelas, error: relatedError } = await supabase
          .from('tbl_parcelas')
          .select('*')
          .eq('id_parcelamento_fk', parcelamento.id_parcelamento)
          .is('deleted_at', null);
        
        if (relatedError) throw relatedError;
        
        if (relatedParcelas && relatedParcelas.length > 1) {
          // Converter para formato antigo para compatibilidade com o modal
          const registros = await registrosFinanceirosService.getAllByTipo('receber');
          const relatedRecords = registros
            .filter(r => relatedParcelas.some(p => p.id_parcela === r.id_parcela))
            .map(mapRegistroToContaReceber);
          
          return { 
            canDelete: false, 
            reason: 'Este registro faz parte de uma série. Use o cancelamento em massa.',
            requiresMassModal: true,
            relatedRecords
          };
        }
      }
      
      // Simple record - can be deleted normally
      return { canDelete: true };
    } catch (error) {
      console.error('Error checking delete permissions:', error);
      return { canDelete: false, reason: 'Erro ao verificar permissões de exclusão' };
    }
  },
  
  async cancelRecords(ids: string[]): Promise<void> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    // Cancelar parcelas nas novas tabelas
    const { error } = await supabase
      .from('tbl_parcelas')
      .update({ 
        status_parcela: 'Cancelado',
        updated_at: new Date().toISOString()
      })
      .in('id_parcela', ids)
      .is('deleted_at', null);
    
    if (error) throw error;
  }
};