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
          status_parcela: 'Aberto'
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
          status_parcela: 'Aberto'
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
    
    // Recalcular valores se necessário
    if (Object.keys(parcelamentoUpdates).length > 0) {
      const novoValorOriginal = faturamentoUpdates.valor_original || faturamento.valor_original;
      const novaValorEntrada = parcelamentoUpdates.valor_entrada !== undefined ? parcelamentoUpdates.valor_entrada : parcelamento.valor_entrada;
      const novoValorBase = novoValorOriginal - (novaValorEntrada || 0);
      
      const novosJuros = parcelamentoUpdates.juros !== undefined ? parcelamentoUpdates.juros : parcelamento.juros;
      const novasMultas = parcelamentoUpdates.multas !== undefined ? parcelamentoUpdates.multas : parcelamento.multas;
      const novaAtualizacao = parcelamentoUpdates.atualizacao !== undefined ? parcelamentoUpdates.atualizacao : parcelamento.atualizacao;
      const novosDescontos = parcelamentoUpdates.descontos !== undefined ? parcelamentoUpdates.descontos : parcelamento.descontos;
      const novosAbatimentos = parcelamentoUpdates.abatimentos !== undefined ? parcelamentoUpdates.abatimentos : parcelamento.abatimentos;
      
      const novoValorTotalParcelas = novoValorBase + novosJuros + novasMultas + novaAtualizacao - novosDescontos - novosAbatimentos;
      
      parcelamentoUpdates.valor_base = novoValorBase;
      parcelamentoUpdates.valor_total_parcelas = novoValorTotalParcelas;
    }
    
    // Executar updates nas tabelas
    if (Object.keys(faturamentoUpdates).length > 0) {
      const { error: faturamentoUpdateError } = await supabase
        .from('tbl_faturamentos')
        .update({ ...faturamentoUpdates, updated_at: new Date().toISOString() })
        .eq('id_faturamento', faturamento.id_faturamento);
      
      if (faturamentoUpdateError) throw faturamentoUpdateError;
    }
    
    if (Object.keys(parcelamentoUpdates).length > 0) {
      const { error: parcelamentoUpdateError } = await supabase
        .from('tbl_parcelamentos')
        .update({ ...parcelamentoUpdates, updated_at: new Date().toISOString() })
        .eq('id_parcelamento', parcelamento.id_parcelamento);
      
      if (parcelamentoUpdateError) throw parcelamentoUpdateError;
    }
    
    if (Object.keys(parcelaUpdates).length > 0) {
      const { error: parcelaUpdateError } = await supabase
        .from('tbl_parcelas')
        .update({ ...parcelaUpdates, updated_at: new Date().toISOString() })
        .eq('id_parcela', idParcela);
      
      if (parcelaUpdateError) throw parcelaUpdateError;
    }
    
    // Buscar registro atualizado
    const registrosAtualizados = await this.getAllByTipo(updates.tipo_registro || 'pagar');
    const registroAtualizado = registrosAtualizados.find(r => r.id_parcela === idParcela);
    
    if (!registroAtualizado) throw new Error('Erro ao buscar registro atualizado');
    
    return registroAtualizado;
  },

  // Excluir registro financeiro (soft delete em cascata)
  async delete(idParcela: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const agora = new Date().toISOString();
    
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
    
    // Soft delete em cascata
    await Promise.all([
      // Marcar parcela como excluída
      supabase
        .from('tbl_parcelas')
        .update({ deleted_at: agora, updated_at: agora })
        .eq('id_parcela', idParcela),
      
      // Marcar transações relacionadas como excluídas
      supabase
        .from('tbl_transacoes_financeiras')
        .update({ deleted_at: agora, updated_at: agora })
        .eq('id_parcela_fk', idParcela)
        .is('deleted_at', null)
    ]);
    
    // Verificar se todas as parcelas do parcelamento foram excluídas
    const { data: parcelasRestantes } = await supabase
      .from('tbl_parcelas')
      .select('id_parcela')
      .eq('id_parcelamento_fk', parcela.tbl_parcelamentos.id_parcelamento)
      .is('deleted_at', null);
    
    // Se não há mais parcelas ativas, excluir parcelamento e faturamento
    if (!parcelasRestantes || parcelasRestantes.length === 0) {
      await Promise.all([
        supabase
          .from('tbl_parcelamentos')
          .update({ deleted_at: agora, updated_at: agora })
          .eq('id_parcelamento', parcela.tbl_parcelamentos.id_parcelamento),
        
        supabase
          .from('tbl_faturamentos')
          .update({ deleted_at: agora, updated_at: agora })
          .eq('id_faturamento', parcela.tbl_parcelamentos.tbl_faturamentos.id_faturamento)
      ]);
    }
  },

  // Cancelar múltiplos registros
  async cancelRecords(idsParcelas: string[]): Promise<void> {
    if (idsParcelas.length === 0) return;
    
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const agora = new Date().toISOString();
    
    // Atualizar status das parcelas para 'Cancelado' e marcar como excluídas
    const { error } = await supabase
      .from('tbl_parcelas')
      .update({ 
        status_parcela: 'Cancelado',
        deleted_at: agora,
        updated_at: agora
      })
      .in('id_parcela', idsParcelas)
      .is('deleted_at', null);
    
    if (error) throw error;
    
    // Cancelar transações relacionadas
    await supabase
      .from('tbl_transacoes_financeiras')
      .update({ deleted_at: agora, updated_at: agora })
      .in('id_parcela_fk', idsParcelas)
      .is('deleted_at', null);
  },

  // Registrar pagamento
  async registrarPagamento(dados: {
    id_faturamento: string;
    id_parcela: string;
    tipo_transacao: 'Entrada' | 'Pagamento de Parcela' | 'Estorno' | 'Ajuste';
    dt_pagamento: string;
    valor_pago: number;
  }): Promise<TransacaoFinanceira> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    // Buscar próximo número de ordem para esta parcela
    const { data: ultimaTransacao } = await supabase
      .from('tbl_transacoes_financeiras')
      .select('digito_ordem_pagamento')
      .eq('id_parcela_fk', dados.id_parcela)
      .is('deleted_at', null)
      .order('digito_ordem_pagamento', { ascending: false })
      .limit(1)
      .single();
    
    const proximaOrdem = (ultimaTransacao?.digito_ordem_pagamento || 0) + 1;
    
    // Criar transação
    const { data: transacao, error } = await supabase
      .from('tbl_transacoes_financeiras')
      .insert([{
        id_faturamento_fk: dados.id_faturamento,
        id_parcela_fk: dados.id_parcela,
        tipo_transacao: dados.tipo_transacao,
        dt_pagamento: dados.dt_pagamento,
        valor_pago: dados.valor_pago,
        digito_ordem_pagamento: proximaOrdem
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Atualizar status da parcela baseado no valor pago
    await this.atualizarStatusParcela(dados.id_parcela);
    
    return transacao;
  },

  // Atualizar status da parcela baseado nos pagamentos
  async atualizarStatusParcela(idParcela: string): Promise<void> {
    // Buscar valor da parcela e total pago
    const { data: parcela } = await supabase
      .from('tbl_parcelas')
      .select('valor_parcela')
      .eq('id_parcela', idParcela)
      .single();
    
    const { data: transacoes } = await supabase
      .from('tbl_transacoes_financeiras')
      .select('valor_pago')
      .eq('id_parcela_fk', idParcela)
      .is('deleted_at', null);
    
    if (!parcela) return;
    
    const valorParcela = parcela.valor_parcela;
    const totalPago = (transacoes || []).reduce((sum, t) => sum + t.valor_pago, 0);
    
    let novoStatus: 'Aberto' | 'Parcial' | 'Liquidado';
    
    if (totalPago === 0) {
      novoStatus = 'Aberto';
    } else if (totalPago >= valorParcela) {
      novoStatus = 'Liquidado';
    } else {
      novoStatus = 'Parcial';
    }
    
    // Atualizar status
    await supabase
      .from('tbl_parcelas')
      .update({ 
        status_parcela: novoStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id_parcela', idParcela);
  },

  // Gerar SKU conforme nova lógica
  async generateSKU(
    codFaturamento: string,
    nDocumentoOrigem: string,
    nParcela: number,
    qtdParcelas: number,
    codParticipante: string
  ): Promise<string> {
    // Formato: cod_faturamento + n_documento_origem + n_parcela + qtd_parcelas + 2_ultimos_digitos_cod_participante
    
    const codFaturamentoFormatted = codFaturamento.padStart(2, '0');
    const nDocumentoFormatted = nDocumentoOrigem.padStart(6, '0');
    const nParcelaFormatted = nParcela.toString();
    const qtdParcelasFormatted = qtdParcelas.toString();
    
    // Extrair últimos 2 dígitos do código do participante
    const numericParticipante = codParticipante.replace(/\D/g, '');
    const ultimosDigitos = numericParticipante.length >= 2 ? numericParticipante.slice(-2) : '00';
    
    return `${codFaturamentoFormatted}-${nDocumentoFormatted}-${nParcelaFormatted}-${qtdParcelasFormatted}-${ultimosDigitos}`;
  },

  // Verificar se pode excluir (lógica similar à anterior)
  async canDelete(idParcela: string): Promise<{ 
    canDelete: boolean; 
    reason?: string; 
    requiresMassModal?: boolean;
    parentId?: string;
    relatedRecords?: RegistroFinanceiroCompleto[];
  }> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    // Buscar dados da parcela
    const { data: parcela, error } = await supabase
      .from('tbl_parcelas')
      .select(`
        *,
        tbl_parcelamentos!inner (
          qtd_parcelas,
          tbl_faturamentos!inner (id_faturamento)
        )
      `)
      .eq('id_parcela', idParcela)
      .is('deleted_at', null)
      .single();
      
    if (error || !parcela) {
      return { canDelete: false, reason: 'Registro não encontrado' };
    }

    // Se faz parte de uma série de parcelas (mais de 1 parcela)
    if (parcela.tbl_parcelamentos.qtd_parcelas > 1) {
      // Buscar todas as parcelas da série
      const { data: parcelasSerie, error: serieError } = await supabase
        .from('tbl_parcelas')
        .select('*')
        .eq('id_parcelamento_fk', parcela.id_parcelamento_fk)
        .is('deleted_at', null)
        .order('n_parcela', { ascending: true });
        
      if (serieError) {
        return { canDelete: false, reason: 'Erro ao verificar série de parcelas' };
      }
      
      // Converter para formato esperado pelo modal
      const registrosRelacionados = await Promise.all(
        (parcelasSerie || []).map(async (p) => {
          const registros = await this.getAllByTipo('pagar'); // Assumindo tipo, pode ser melhorado
          return registros.find(r => r.id_parcela === p.id_parcela);
        })
      );
      
      return { 
        canDelete: false, 
        reason: 'Registros parcelados devem ser cancelados em massa',
        requiresMassModal: true,
        parentId: parcela.tbl_parcelamentos.tbl_faturamentos.id_faturamento,
        relatedRecords: registrosRelacionados.filter(Boolean) as RegistroFinanceiroCompleto[]
      };
    }
          status_parcela: 'Aberto',
          tipo_registro: tipo
    // Registro simples - pode ser excluído normalmente
    return { canDelete: true };
  }
};

// Extended service for contas a pagar with full relationships
export const contasPagarServiceExtended = {
  // Adaptar para usar o novo serviço unificado
  async getAllWithRelations(): Promise<ContaPagar[]> {
    // Buscar registros das 4 tabelas e converter para formato ContaPagar
    const registros = await registrosFinanceirosService.getAllByTipo('pagar');
    
    // Converter RegistroFinanceiroCompleto para ContaPagar para compatibilidade
    return registros.map(registro => ({
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
      valor_financeiro: registro.valor_saldo || 0,
      valor_parcela: registro.valor_parcela,
      status: registro.status_parcela === 'Liquidado' ? 'pago' : 
              registro.status_parcela === 'Cancelado' ? 'cancelado' : 'pendente',
      data_vencimento: registro.dt_vencimento,
      data_pagamento: registro.transacoes?.[0]?.dt_pagamento,
      observacoes: registro.observacoes,
      created_at: registro.created_at,
      updated_at: registro.updated_at,
      deleted_at: registro.deleted_at,
      dados_ele: registro.dados_ele,
      id_autorizacao: registro.id_autorizacao,
      eh_parcelado: registro.qtd_parcelas > 1,
      total_parcelas: registro.qtd_parcelas,
      numero_parcela: registro.n_parcela,
      lancamento_pai_id: registro.id_faturamento, // Usar faturamento como pai
      eh_recorrente: false, // Por enquanto, pode ser expandido
      n_docto_origem: registro.n_documento_origem,
      n_doctos_ref: registro.n_doctos_ref,
      projetos: registro.projetos,
      sku_parcela: registro.sku_parcela,
      intervalo_ini: registro.intervalo_ini,
      intervalo_rec: registro.intervalo_rec,
      eh_vencto_fixo: registro.eh_vencto_fixo,
      empresas: registro.empresas,
      participantes: registro.participantes,
      categorias: registro.categorias,
      departamentos: registro.departamentos,
      formas_cobranca: registro.formas_cobranca,
      tipos_documentos: registro.tipos_documentos
    } as ContaPagar));
  },
  
  async getByStatus(status: string): Promise<ContaPagar[]> {
    const todosRegistros = await this.getAllWithRelations();
    return todosRegistros.filter(conta => conta.status === status);
  },

  async canDelete(id: string): Promise<{ 
    canDelete: boolean; 
    reason?: string; 
    requiresMassModal?: boolean;
    parentId?: string;
    relatedRecords?: ContaPagar[];
  }> {
    // Usar novo serviço unificado
    const result = await registrosFinanceirosService.canDelete(id);
    
    // Converter RegistroFinanceiroCompleto para ContaPagar se necessário
    if (result.relatedRecords) {
      const contasPagar = await this.getAllWithRelations();
      const relatedContasPagar = result.relatedRecords
        .map(registro => contasPagar.find(conta => conta.id === registro.id_parcela))
        .filter(Boolean) as ContaPagar[];
      
      return {
        ...result,
        relatedRecords: relatedContasPagar
      };
    }
    
    return result;
  },

  async cancelRecords(ids: string[]): Promise<void> {
    return registrosFinanceirosService.cancelRecords(ids);
  },

  async create(item: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at' | 'empresas' | 'participantes' | 'categorias' | 'departamentos' | 'formas_cobranca' | 'valor_financeiro'>): Promise<ContaPagar[]> {
    // Converter dados do ContaPagar para o novo formato
    const dadosParaCriar = {
      // Dados do faturamento
      cod_faturamento: item.sku_parcela?.split('-')[0] || undefined,
      n_documento_origem: item.n_docto_origem,
      dt_faturamento: item.data_vencimento,
      valor_original: item.valor_operacao || 0,
      cod_participante: item.fornecedor_id,
      
      // Dados do parcelamento
      qtd_parcelas: item.total_parcelas || 1,
      valor_entrada: 0, // Por enquanto, pode ser expandido
      juros: item.valor_juros || 0,
      multas: item.valor_multas || 0,
      atualizacao: item.valor_atualizacao || 0,
      descontos: item.valor_descontos || 0,
      abatimentos: item.valor_abto || 0,
      dt_vencimento_entrada: item.data_vencimento,
      intervalo_ini: item.intervalo_ini || 0,
      intervalo_rec: item.intervalo_rec || 30,
      
      // Metadados
      tipo_registro: 'pagar' as const,
      
      // Campos externos
      empresa_id: item.empresa_id,
      participante_id: item.fornecedor_id,
      categoria_id: item.categoria_id,
      departamento_id: item.departamento_id,
      forma_cobranca_id: item.forma_cobranca_id,
      conta_cobranca_id: item.conta_cobranca_id,
      tipo_documento_id: item.tipo_documento_id,
      descricao: item.descricao,
      observacoes: item.observacoes,
      dados_ele: item.dados_ele,
      id_autorizacao: item.id_autorizacao,
      n_doctos_ref: item.n_doctos_ref,
      projetos: item.projetos,
      eh_vencto_fixo: item.eh_vencto_fixo
    };
    
    const registrosCriados = await registrosFinanceirosService.create(dadosParaCriar);
    
    // Converter de volta para ContaPagar
    return registrosCriados.map(registro => ({
      id: registro.id_parcela,
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
      valor_financeiro: registro.valor_saldo || 0,
      valor_parcela: registro.valor_parcela,
      status: registro.status_parcela === 'Liquidado' ? 'pago' : 
              registro.status_parcela === 'Cancelado' ? 'cancelado' : 'pendente',
      data_vencimento: registro.dt_vencimento,
      data_pagamento: registro.transacoes?.[0]?.dt_pagamento,
      observacoes: registro.observacoes,
      created_at: registro.created_at,
      updated_at: registro.updated_at,
      deleted_at: registro.deleted_at,
      dados_ele: registro.dados_ele,
      id_autorizacao: registro.id_autorizacao,
      eh_parcelado: registro.qtd_parcelas > 1,
      total_parcelas: registro.qtd_parcelas,
      numero_parcela: registro.n_parcela,
      lancamento_pai_id: registro.id_faturamento,
      eh_recorrente: false,
      n_docto_origem: registro.n_documento_origem,
      n_doctos_ref: registro.n_doctos_ref,
      projetos: registro.projetos,
      sku_parcela: registro.sku_parcela,
      intervalo_ini: registro.intervalo_ini,
      intervalo_rec: registro.intervalo_rec,
      eh_vencto_fixo: registro.eh_vencto_fixo
    } as ContaPagar));
  },

  async update(id: string, updates: Partial<Omit<ContaPagar, 'id' | 'created_at' | 'updated_at' | 'empresas' | 'participantes' | 'categorias' | 'departamentos' | 'formas_cobranca' | 'valor_financeiro'>>): Promise<ContaPagar> {
    // Converter updates do ContaPagar para o novo formato
    const dadosParaAtualizar = {
      // Campos do faturamento
      n_documento_origem: updates.n_docto_origem,
      dt_faturamento: updates.data_vencimento,
      valor_original: updates.valor_operacao,
      cod_participante: updates.fornecedor_id,
      
      // Campos do parcelamento
      juros: updates.valor_juros,
      multas: updates.valor_multas,
      atualizacao: updates.valor_atualizacao,
      descontos: updates.valor_descontos,
      abatimentos: updates.valor_abto,
      intervalo_ini: updates.intervalo_ini,
      intervalo_rec: updates.intervalo_rec,
      
      // Campos da parcela
      sku_parcela: updates.sku_parcela,
      dt_vencimento: updates.data_vencimento,
      status_parcela: updates.status === 'pago' ? 'Liquidado' as const :
                     updates.status === 'cancelado' ? 'Cancelado' as const : 'Aberto' as const,
      
      // Campos externos
      empresa_id: updates.empresa_id,
      participante_id: updates.fornecedor_id,
      categoria_id: updates.categoria_id,
      departamento_id: updates.departamento_id,
      forma_cobranca_id: updates.forma_cobranca_id,
      conta_cobranca_id: updates.conta_cobranca_id,
      tipo_documento_id: updates.tipo_documento_id,
      descricao: updates.descricao,
      observacoes: updates.observacoes,
      dados_ele: updates.dados_ele,
      id_autorizacao: updates.id_autorizacao,
      n_doctos_ref: updates.n_doctos_ref,
      projetos: updates.projetos,
      eh_vencto_fixo: updates.eh_vencto_fixo,
      tipo_registro: 'pagar' as const
    };
    
    const registroAtualizado = await registrosFinanceirosService.update(id, dadosParaAtualizar);
    
    // Converter de volta para ContaPagar
    return {
      id: registroAtualizado.id_parcela,
      empresa_id: registroAtualizado.empresa_id || '',
      fornecedor_id: registroAtualizado.participante_id || '',
      categoria_id: registroAtualizado.categoria_id,
      departamento_id: registroAtualizado.departamento_id,
      forma_cobranca_id: registroAtualizado.forma_cobranca_id,
      conta_cobranca_id: registroAtualizado.conta_cobranca_id,
      tipo_documento_id: registroAtualizado.tipo_documento_id,
      descricao: registroAtualizado.descricao || '',
      valor_operacao: registroAtualizado.valor_original,
      valor_juros: registroAtualizado.juros,
      valor_multas: registroAtualizado.multas,
      valor_atualizacao: registroAtualizado.atualizacao,
      valor_descontos: registroAtualizado.descontos,
      valor_abto: registroAtualizado.abatimentos,
      valor_pagto: registroAtualizado.valor_pago_total || 0,
      valor_financeiro: registroAtualizado.valor_saldo || 0,
      valor_parcela: registroAtualizado.valor_parcela,
      status: registroAtualizado.status_parcela === 'Liquidado' ? 'pago' : 
              registroAtualizado.status_parcela === 'Cancelado' ? 'cancelado' : 'pendente',
      data_vencimento: registroAtualizado.dt_vencimento,
      data_pagamento: registroAtualizado.transacoes?.[0]?.dt_pagamento,
      observacoes: registroAtualizado.observacoes,
      created_at: registroAtualizado.created_at,
      updated_at: registroAtualizado.updated_at,
      deleted_at: registroAtualizado.deleted_at,
      dados_ele: registroAtualizado.dados_ele,
      id_autorizacao: registroAtualizado.id_autorizacao,
      eh_parcelado: registroAtualizado.qtd_parcelas > 1,
      total_parcelas: registroAtualizado.qtd_parcelas,
      numero_parcela: registroAtualizado.n_parcela,
      lancamento_pai_id: registroAtualizado.id_faturamento,
      eh_recorrente: false,
      n_docto_origem: registroAtualizado.n_documento_origem,
      n_doctos_ref: registroAtualizado.n_doctos_ref,
      projetos: registroAtualizado.projetos,
      sku_parcela: registroAtualizado.sku_parcela,
      intervalo_ini: registroAtualizado.intervalo_ini,
      intervalo_rec: registroAtualizado.intervalo_rec,
      eh_vencto_fixo: registroAtualizado.eh_vencto_fixo
    } as ContaPagar;
  },

  async delete(id: string): Promise<void> {
    return registrosFinanceirosService.delete(id);
  }
};

// Extended service for contas a receber with full relationships
export const contasReceberServiceExtended = {
  async getAllWithRelations(): Promise<ContaReceber[]> {
    // Buscar registros das 4 tabelas e converter para formato ContaReceber
    const registros = await registrosFinanceirosService.getAllByTipo('receber');
    
    // Converter RegistroFinanceiroCompleto para ContaReceber para compatibilidade
    return registros.map(registro => ({
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
      valor_financeiro: registro.valor_saldo || 0,
      valor_parcela: registro.valor_parcela,
      status: registro.status_parcela === 'Liquidado' ? 'recebido' : 
              registro.status_parcela === 'Cancelado' ? 'cancelado' : 'pendente',
      data_vencimento: registro.dt_vencimento,
      data_recebimento: registro.transacoes?.[0]?.dt_pagamento,
      observacoes: registro.observacoes,
      created_at: registro.created_at,
      updated_at: registro.updated_at,
      deleted_at: registro.deleted_at,
      dados_ele: registro.dados_ele,
      id_autorizacao: registro.id_autorizacao,
      eh_parcelado: registro.qtd_parcelas > 1,
      total_parcelas: registro.qtd_parcelas,
      numero_parcela: registro.n_parcela,
      lancamento_pai_id: registro.id_faturamento, // Usar faturamento como pai
      eh_recorrente: false, // Por enquanto, pode ser expandido
      n_docto_origem: registro.n_documento_origem,
      n_doctos_ref: registro.n_doctos_ref,
      projetos: registro.projetos,
      sku_parcela: registro.sku_parcela,
      intervalo_ini: registro.intervalo_ini,
      intervalo_rec: registro.intervalo_rec,
      eh_vencto_fixo: registro.eh_vencto_fixo,
      empresas: registro.empresas,
      participantes: registro.participantes,
      categorias: registro.categorias,
      departamentos: registro.departamentos,
      formas_cobranca: registro.formas_cobranca,
      tipos_documentos: registro.tipos_documentos
    } as ContaReceber));
  },
  
  async getByStatus(status: string): Promise<ContaReceber[]> {
    const todosRegistros = await this.getAllWithRelations();
    return todosRegistros.filter(conta => conta.status === status);
  },

  async canDelete(id: string): Promise<{ 
    canDelete: boolean; 
    reason?: string; 
    requiresMassModal?: boolean;
    parentId?: string;
    relatedRecords?: ContaReceber[];
  }> {
    // Usar novo serviço unificado
    const result = await registrosFinanceirosService.canDelete(id);
    
    // Converter RegistroFinanceiroCompleto para ContaReceber se necessário
    if (result.relatedRecords) {
      const contasReceber = await this.getAllWithRelations();
      const relatedContasReceber = result.relatedRecords
        .map(registro => contasReceber.find(conta => conta.id === registro.id_parcela))
        .filter(Boolean) as ContaReceber[];
      
      return {
        ...result,
        relatedRecords: relatedContasReceber
      };
    }
    
    return result;
  },

  async cancelRecords(ids: string[]): Promise<void> {
    return registrosFinanceirosService.cancelRecords(ids);
  },

  async create(item: Omit<ContaReceber, 'id' | 'created_at' | 'updated_at' | 'empresas' | 'participantes' | 'categorias' | 'departamentos' | 'formas_cobranca' | 'valor_financeiro'>): Promise<ContaReceber[]> {
    // Converter dados do ContaReceber para o novo formato
    const dadosParaCriar = {
      // Dados do faturamento
      cod_faturamento: item.sku_parcela?.split('-')[0] || undefined,
      n_documento_origem: item.n_docto_origem,
      dt_faturamento: item.data_vencimento,
      valor_original: item.valor_operacao || 0,
      cod_participante: item.cliente_id,
      
      // Dados do parcelamento
      qtd_parcelas: item.total_parcelas || 1,
      valor_entrada: 0, // Por enquanto, pode ser expandido
      juros: item.valor_juros || 0,
      multas: item.valor_multas || 0,
      atualizacao: item.valor_atualizacao || 0,
      descontos: item.valor_descontos || 0,
      abatimentos: item.valor_abto || 0,
      dt_vencimento_entrada: item.data_vencimento,
      intervalo_ini: item.intervalo_ini || 0,
      intervalo_rec: item.intervalo_rec || 30,
      
      // Metadados
      tipo_registro: 'receber' as const,
      
      // Campos externos
      empresa_id: item.empresa_id,
      participante_id: item.cliente_id,
      categoria_id: item.categoria_id,
      departamento_id: item.departamento_id,
      forma_cobranca_id: item.forma_cobranca_id,
      conta_cobranca_id: item.conta_cobranca_id,
      tipo_documento_id: item.tipo_documento_id,
      descricao: item.descricao,
      observacoes: item.observacoes,
      dados_ele: item.dados_ele,
      id_autorizacao: item.id_autorizacao,
      n_doctos_ref: item.n_doctos_ref,
      projetos: item.projetos,
      eh_vencto_fixo: item.eh_vencto_fixo
    };
    
    const registrosCriados = await registrosFinanceirosService.create(dadosParaCriar);
    
    // Converter de volta para ContaReceber
    return registrosCriados.map(registro => ({
      id: registro.id_parcela,
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
      valor_financeiro: registro.valor_saldo || 0,
      valor_parcela: registro.valor_parcela,
      status: registro.status_parcela === 'Liquidado' ? 'recebido' : 
              registro.status_parcela === 'Cancelado' ? 'cancelado' : 'pendente',
      data_vencimento: registro.dt_vencimento,
      data_recebimento: registro.transacoes?.[0]?.dt_pagamento,
      observacoes: registro.observacoes,
      created_at: registro.created_at,
      updated_at: registro.updated_at,
      deleted_at: registro.deleted_at,
      dados_ele: registro.dados_ele,
      id_autorizacao: registro.id_autorizacao,
      eh_parcelado: registro.qtd_parcelas > 1,
      total_parcelas: registro.qtd_parcelas,
      numero_parcela: registro.n_parcela,
      lancamento_pai_id: registro.id_faturamento,
      eh_recorrente: false,
      n_docto_origem: registro.n_documento_origem,
      n_doctos_ref: registro.n_doctos_ref,
      projetos: registro.projetos,
      sku_parcela: registro.sku_parcela,
      intervalo_ini: registro.intervalo_ini,
      intervalo_rec: registro.intervalo_rec,
      eh_vencto_fixo: registro.eh_vencto_fixo
    } as ContaReceber));
  },

  async update(id: string, updates: Partial<Omit<ContaReceber, 'id' | 'created_at' | 'updated_at' | 'empresas' | 'participantes' | 'categorias' | 'departamentos' | 'formas_cobranca' | 'valor_financeiro'>>): Promise<ContaReceber> {
    // Converter updates do ContaReceber para o novo formato
    const dadosParaAtualizar = {
      // Campos do faturamento
      n_documento_origem: updates.n_docto_origem,
      dt_faturamento: updates.data_vencimento,
      valor_original: updates.valor_operacao,
      cod_participante: updates.cliente_id,
      
      // Campos do parcelamento
      juros: updates.valor_juros,
      multas: updates.valor_multas,
      atualizacao: updates.valor_atualizacao,
      descontos: updates.valor_descontos,
      abatimentos: updates.valor_abto,
      intervalo_ini: updates.intervalo_ini,
      intervalo_rec: updates.intervalo_rec,
      
      // Campos da parcela
      sku_parcela: updates.sku_parcela,
      dt_vencimento: updates.data_vencimento,
      status_parcela: updates.status === 'recebido' ? 'Liquidado' as const :
                     updates.status === 'cancelado' ? 'Cancelado' as const : 'Aberto' as const,
      
      // Campos externos
      empresa_id: updates.empresa_id,
      participante_id: updates.cliente_id,
      categoria_id: updates.categoria_id,
      departamento_id: updates.departamento_id,
      forma_cobranca_id: updates.forma_cobranca_id,
      conta_cobranca_id: updates.conta_cobranca_id,
      tipo_documento_id: updates.tipo_documento_id,
      descricao: updates.descricao,
      observacoes: updates.observacoes,
      dados_ele: updates.dados_ele,
      id_autorizacao: updates.id_autorizacao,
      n_doctos_ref: updates.n_doctos_ref,
      projetos: updates.projetos,
      eh_vencto_fixo: updates.eh_vencto_fixo,
      tipo_registro: 'receber' as const
    };
    
    const registroAtualizado = await registrosFinanceirosService.update(id, dadosParaAtualizar);
    
    // Converter de volta para ContaReceber
    return {
      id: registroAtualizado.id_parcela,
      empresa_id: registroAtualizado.empresa_id || '',
      cliente_id: registroAtualizado.participante_id || '',
      categoria_id: registroAtualizado.categoria_id,
      departamento_id: registroAtualizado.departamento_id,
      forma_cobranca_id: registroAtualizado.forma_cobranca_id,
      conta_cobranca_id: registroAtualizado.conta_cobranca_id,
      tipo_documento_id: registroAtualizado.tipo_documento_id,
      descricao: registroAtualizado.descricao || '',
      valor_operacao: registroAtualizado.valor_original,
      valor_juros: registroAtualizado.juros,
      valor_multas: registroAtualizado.multas,
      valor_atualizacao: registroAtualizado.atualizacao,
      valor_descontos: registroAtualizado.descontos,
      valor_abto: registroAtualizado.abatimentos,
      valor_pagto: registroAtualizado.valor_pago_total || 0,
      valor_financeiro: registroAtualizado.valor_saldo || 0,
      valor_parcela: registroAtualizado.valor_parcela,
      status: registroAtualizado.status_parcela === 'Liquidado' ? 'recebido' : 
              registroAtualizado.status_parcela === 'Cancelado' ? 'cancelado' : 'pendente',
      data_vencimento: registroAtualizado.dt_vencimento,
      data_recebimento: registroAtualizado.transacoes?.[0]?.dt_pagamento,
      observacoes: registroAtualizado.observacoes,
      created_at: registroAtualizado.created_at,
      updated_at: registroAtualizado.updated_at,
      deleted_at: registroAtualizado.deleted_at,
      dados_ele: registroAtualizado.dados_ele,
      id_autorizacao: registroAtualizado.id_autorizacao,
      eh_parcelado: registroAtualizado.qtd_parcelas > 1,
      total_parcelas: registroAtualizado.qtd_parcelas,
      numero_parcela: registroAtualizado.n_parcela,
      lancamento_pai_id: registroAtualizado.id_faturamento,
      eh_recorrente: false,
      n_docto_origem: registroAtualizado.n_documento_origem,
      n_doctos_ref: registroAtualizado.n_doctos_ref,
      projetos: registroAtualizado.projetos,
      sku_parcela: registroAtualizado.sku_parcela,
      intervalo_ini: registroAtualizado.intervalo_ini,
      intervalo_rec: registroAtualizado.intervalo_rec,
      eh_vencto_fixo: registroAtualizado.eh_vencto_fixo
    } as ContaReceber;
  },

  async delete(id: string): Promise<void> {
    return registrosFinanceirosService.delete(id);
  }
};

// Helper function to add interval to date
function addIntervalToDate(date: Date, periodicidade: string, frequencia: number): Date {
  const newDate = new Date(date);
  
  switch (periodicidade) {
    case 'diario':
      newDate.setDate(newDate.getDate() + frequencia);
      break;
    case 'semanal':
      newDate.setDate(newDate.getDate() + (frequencia * 7));
      break;
    case 'mensal':
      newDate.setMonth(newDate.getMonth() + frequencia);
      break;
    case 'anual':
      newDate.setFullYear(newDate.getFullYear() + frequencia);
      break;
    default:
      throw new Error(`Periodicidade não suportada: ${periodicidade}`);
  }
  
  return newDate;
}