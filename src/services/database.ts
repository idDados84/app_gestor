import { supabase } from '../lib/supabase';
import { formatDateToYYYYMMDD, parseDateFromYYYYMMDD } from '../utils/dateUtils';
import { calculateInstallmentValues, calculateValorFinanceiro, generateSkuForNewRecord } from '../utils/financialCalculations';

// Helper function to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

// Helper function to throw configuration error
const throwConfigError = () => {
  throw new Error('Please connect to Supabase first by clicking the "Connect to Supabase" button in the top right corner');
};

import type { 
  Usuario, GrupoEmpresa, Empresa, Departamento, 
  Categoria, Participante, FormaCobranca, ContaCobranca,
  ContaPagar, ContaReceber, ContaFinanceira, TipoDocumento
} from '../types/database';


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

// Extended service for contas a pagar with full relationships
export const contasPagarServiceExtended = {
  ...createExtendedService(contasPagarService),
  async getAllWithRelations(): Promise<ContaPagar[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from('contas_pagar')
      .select(`
        *,
        empresas(*), 
        participantes!contas_pagar_fornecedor_id_fkey(*), 
        categorias(*), 
        departamentos(*), 
        formas_cobranca(*),
        tipos_documentos(*)
      `)
      .is('deleted_at', null);
    
    if (error) throw error;
    return data || [];
  },
  
  async getByStatus(status: string): Promise<ContaPagar[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from('contas_pagar')
      .select(`
        *,
        empresas(*), 
        participantes!contas_pagar_fornecedor_id_fkey(*), 
        categorias(*), 
        departamentos(*), 
        formas_cobranca(*),
        tipos_documentos(*)
      `)
      .eq('status', status)
      .is('deleted_at', null);
    
    if (error) throw error;
    return data || [];
  },

  // Override canDelete to implement deletion rules
  async canDelete(id: string): Promise<{ 
    canDelete: boolean; 
    reason?: string; 
    requiresMassModal?: boolean;
    parentId?: string;
    relatedRecords?: ContaPagar[];
  }> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data: conta, error } = await supabase
      .from('contas_pagar')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
      
    if (error || !conta) {
      return { canDelete: false, reason: 'Registro não encontrado' };
    }

    // Rule 1: Check if it's part of installments series (including first installment)
    if (conta.eh_parcelado || conta.lancamento_pai_id || conta.total_parcelas > 1) {
      // Find all related records
      const parentId = conta.lancamento_pai_id || conta.id;
      
      const { data: relatedRecords, error: relatedError } = await supabase
        .from('contas_pagar')
        .select('*')
        .or(`id.eq.${parentId},lancamento_pai_id.eq.${parentId}`)
        .is('deleted_at', null)
        .order('data_vencimento', { ascending: true });
        
      if (relatedError) {
        return { canDelete: false, reason: 'Erro ao verificar registros relacionados' };
      }
      
      return { 
        canDelete: false, 
        reason: 'Registros parcelados/recorrentes devem ser cancelados em massa',
        requiresMassModal: true,
        parentId,
        relatedRecords: relatedRecords || []
      };
    }

    // Rule 2: Check if it's part of recurring series (including first occurrence)
    if (conta.eh_recorrente) {
      // Find all related recurrence records
      const parentId = conta.lancamento_pai_id || conta.id;
      
      const { data: relatedRecords, error: relatedError } = await supabase
        .from('contas_pagar')
        .select('*')
        .or(`id.eq.${parentId},lancamento_pai_id.eq.${parentId}`)
        .eq('eh_recorrente', true)
        .is('deleted_at', null)
        .order('data_vencimento', { ascending: true });
        
      if (relatedError) {
        return { canDelete: false, reason: 'Erro ao verificar registros de recorrência relacionados' };
      }
      
      return { 
        canDelete: false, 
        reason: 'Registros recorrentes devem ser cancelados em massa',
        requiresMassModal: true,
        parentId,
        relatedRecords: relatedRecords || []
      };
    }
    // Simple record - can be deleted normally
    return { canDelete: true };
  },

  // New function for mass cancellation
  async cancelRecords(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { error } = await supabase
      .from('contas_pagar')
      .update({ 
        status: 'cancelado',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', ids)
      .is('deleted_at', null);
    
    if (error) throw error;
  },

  // Override the create method to handle recurrence and installments
  async create(item: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at' | 'empresas' | 'participantes' | 'categorias' | 'departamentos' | 'formas_cobranca' | 'valor_financeiro'>): Promise<ContaPagar[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const createdItems: ContaPagar[] = [];

    // Validate recurrence data before processing
    if (item.eh_recorrente) {
      if (!item.periodicidade || !item.frequencia_recorrencia || !item.data_inicio_recorrencia) {
        throw new Error('Dados de recorrência incompletos. Periodicidade, frequência e data de início são obrigatórios.');
      }
    }

    // Handle recurrence
    if (item.eh_recorrente && item.periodicidade && item.frequencia_recorrencia && item.data_inicio_recorrencia) {
      let currentDate = new Date(item.data_inicio_recorrencia);
      let occurrences = 0;
      const maxOccurrences = item.termino_apos_ocorrencias || Infinity;

      let parentId: string | undefined = item.lancamento_pai_id;

      while (occurrences < maxOccurrences) {
        // Generate SKU for this occurrence
        const skuParcela = await generateSkuForNewRecord(
          item.tipo_documento_id || null,
          item.n_docto_origem || null,
          item.fornecedor_id,
          occurrences + 1,
          1 // For recurring items, each occurrence is treated as a single item
        );
        
        const newItem = {
          ...item,
          data_vencimento: currentDate.toISOString().split('T')[0], // Format as 'YYYY-MM-DD'
          eh_recorrente: true, // Keep recurrence flag for validation purposes
          eh_parcelado: false, // Recurring items are not parcelled
          lancamento_pai_id: parentId,
          sku_parcela: skuParcela,
          numero_parcela: occurrences + 1,
          total_parcelas: 1
        };

        const { data: createdItem, error } = await supabase.from('contas_pagar').insert([newItem]).select().single();
        if (error) throw error;
        createdItems.push(createdItem);

        if (occurrences === 0 && !parentId) {
          parentId = createdItem.id; // Set the first created item's ID as the parent for subsequent recurrences
        }

        currentDate = addIntervalToDate(currentDate, item.periodicidade, item.frequencia_recorrencia);
        occurrences++;
      }
    }
    // Handle installments (if not recurring)
    else if (item.eh_parcelado && item.total_parcelas && item.total_parcelas > 1) {
      // Calcular valor_financeiro primeiro
      const valorFinanceiro = calculateValorFinanceiro({
        valor_operacao: item.valor_operacao || 0,
        valor_juros: item.valor_juros || 0,
        valor_multas: item.valor_multas || 0,
        valor_atualizacao: item.valor_atualizacao || 0,
        valor_descontos: item.valor_descontos || 0,
        valor_abto: item.valor_abto || 0,
        valor_pagto: item.valor_pagto || 0
      });
      
      // Use valor_financeiro para distribuir as parcelas
      const valorParaDistribuir = valorFinanceiro;
      const parcelasParaDistribuir = item.total_parcelas;
      
      // Calcular distribuição usando a nova lógica financeira
      const valoresParcelas = calculateInstallmentValues(valorParaDistribuir, parcelasParaDistribuir, false);
      let parentId: string | undefined = item.lancamento_pai_id;

      for (let i = 0; i < item.total_parcelas; i++) {
        const installmentDate = parseDateFromYYYYMMDD(item.data_vencimento);
        // Assuming monthly installments for simplicity, adjust as needed
        installmentDate.setMonth(installmentDate.getMonth() + i);

        const installmentItem = {
          ...item,
          valor_parcela: valoresParcelas[i] || 0,
          numero_parcela: i + 1,
          total_parcelas: item.total_parcelas,
          data_vencimento: formatDateToYYYYMMDD(installmentDate),
          eh_parcelado: false, // Subsequent items are not parcelled themselves
          eh_recorrente: false, // Installments are not recurring
          lancamento_pai_id: parentId,
        };

        const { data: createdInstallment, error } = await supabase.from('contas_pagar').insert([installmentItem]).select().single();
        if (error) throw error;
        createdItems.push(createdInstallment);

        if (i === 0 && !parentId) {
          parentId = createdInstallment.id; // Set the first created installment's ID as the parent for subsequent installments
        }
      }
    }
    // If neither recurring nor parcelled, just create a single item
    else {
      const { data, error } = await supabase.from('contas_pagar').insert([item]).select().single();
      if (error) throw error;
      createdItems.push(data);
    }
    return createdItems;
  },

  // Update method remains largely the same, as updating a series is complex and out of scope
  async update(id: string, updates: Partial<Omit<ContaPagar, 'id' | 'created_at' | 'updated_at' | 'empresas' | 'participantes' | 'categorias' | 'departamentos' | 'formas_cobranca' | 'valor_financeiro'>>): Promise<ContaPagar> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from('contas_pagar')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Extended service for contas a receber with full relationships
export const contasReceberServiceExtended = {
  ...createExtendedService(contasReceberService),
  async getAllWithRelations(): Promise<ContaReceber[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from('contas_receber')
      .select(`
        *,
        empresas(*), 
        participantes!contas_receber_cliente_id_fkey(*), 
        categorias(*), 
        departamentos(*), 
        formas_cobranca(*),
        tipos_documentos(*)
      `)
      .is('deleted_at', null);
    
    if (error) throw error;
    return data || [];
  },
  
  async getByStatus(status: string): Promise<ContaReceber[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from('contas_receber')
      .select(`
        id, empresa_id, cliente_id, categoria_id, departamento_id, forma_cobranca_id,
        conta_cobranca_id, tipo_documento_id, descricao, valor_operacao, valor_juros,
        valor_multas, valor_atualizacao, valor_descontos, valor_pagto, valor_parcela,
        status, data_vencimento, data_recebimento, observacoes, created_at, updated_at,
        deleted_at, dados_ele, id_autorizacao, eh_parcelado, total_parcelas, numero_parcela,
        lancamento_pai_id, eh_recorrente, periodicidade, frequencia_recorrencia,
        data_inicio_recorrencia, termino_apos_ocorrencias, n_docto_origem, n_doctos_ref,
        projetos, sku_parcela, intervalo_ini, intervalo_rec, eh_vencto_fixo,
        empresas(*), 
        participantes!contas_receber_cliente_id_fkey(*), 
        categorias(*), 
        departamentos(*), 
        formas_cobranca(*),
        tipos_documentos(*)
      `)
      .eq('status', status)
      .is('deleted_at', null);
    
    if (error) throw error;
    return data || [];
  },

  // Override canDelete to implement deletion rules
  async canDelete(id: string): Promise<{ 
    canDelete: boolean; 
    reason?: string; 
    requiresMassModal?: boolean;
    parentId?: string;
    relatedRecords?: ContaReceber[];
  }> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data: conta, error } = await supabase
      .from('contas_receber')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
      
    if (error || !conta) {
      return { canDelete: false, reason: 'Registro não encontrado' };
    }

    // Rule 1: Check if it's part of installments series (including first installment)
    if (conta.eh_parcelado || conta.lancamento_pai_id || conta.total_parcelas > 1) {
      // Find all related records
      const parentId = conta.lancamento_pai_id || conta.id;
      
      const { data: relatedRecords, error: relatedError } = await supabase
        .from('contas_receber')
        .select('*')
        .or(`id.eq.${parentId},lancamento_pai_id.eq.${parentId}`)
        .is('deleted_at', null)
        .order('data_vencimento', { ascending: true });
        
      if (relatedError) {
        return { canDelete: false, reason: 'Erro ao verificar registros relacionados' };
      }
      
      return { 
        canDelete: false, 
        reason: 'Registros parcelados devem ser cancelados em massa',
        requiresMassModal: true,
        parentId,
        relatedRecords: relatedRecords || []
      };
    }

    // Rule 2: Check if it's part of recurring series (including first occurrence)
    if (conta.eh_recorrente) {
      // Find all related recurrence records
      const parentId = conta.lancamento_pai_id || conta.id;
      
      const { data: relatedRecords, error: relatedError } = await supabase
        .from('contas_receber')
        .select('*')
        .or(`id.eq.${parentId},lancamento_pai_id.eq.${parentId}`)
        .eq('eh_recorrente', true)
        .is('deleted_at', null)
        .order('data_vencimento', { ascending: true });
        
      if (relatedError) {
        return { canDelete: false, reason: 'Erro ao verificar registros de recorrência relacionados' };
      }
      
      return { 
        canDelete: false, 
        reason: 'Registros recorrentes devem ser cancelados em massa',
        requiresMassModal: true,
        parentId,
        relatedRecords: relatedRecords || []
      };
    }
    // Simple record - can be deleted normally
    return { canDelete: true };
  },

  // New function for mass cancellation
  async cancelRecords(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { error } = await supabase
      .from('contas_receber')
      .update({ 
        status: 'cancelado',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', ids)
      .is('deleted_at', null);
    
    if (error) throw error;
  },

  // Override the create method to handle recurrence and installments
  async create(item: Omit<ContaReceber, 'id' | 'created_at' | 'updated_at' | 'empresas' | 'participantes' | 'categorias' | 'departamentos' | 'formas_cobranca' | 'valor_financeiro'>): Promise<ContaReceber[]> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const createdItems: ContaReceber[] = [];

    // Validate recurrence data before processing
    if (item.eh_recorrente) {
      if (!item.periodicidade || !item.frequencia_recorrencia || !item.data_inicio_recorrencia) {
        throw new Error('Dados de recorrência incompletos. Periodicidade, frequência e data de início são obrigatórios.');
      }
    }

    // Handle recurrence
    if (item.eh_recorrente && item.periodicidade && item.frequencia_recorrencia && item.data_inicio_recorrencia) {
      let currentDate = new Date(item.data_inicio_recorrencia);
      let occurrences = 0;
      const maxOccurrences = item.termino_apos_ocorrencias || Infinity;

      let parentId: string | undefined = item.lancamento_pai_id;

      while (occurrences < maxOccurrences) {
        const newItem = {
          ...item,
          data_vencimento: currentDate.toISOString().split('T')[0], // Format as 'YYYY-MM-DD'
          eh_recorrente: true, // Keep recurrence flag for validation purposes
          eh_parcelado: false, // Recurring items are not parcelled
          lancamento_pai_id: parentId,
        };

        const { data: createdItem, error } = await supabase.from('contas_receber').insert([newItem]).select().single();
        if (error) throw error;
        createdItems.push(createdItem);

        if (occurrences === 0 && !parentId) {
          parentId = createdItem.id; // Set the first created item's ID as the parent for subsequent recurrences
        }

        currentDate = addIntervalToDate(currentDate, item.periodicidade, item.frequencia_recorrencia);
        occurrences++;
      }
    }
    // Handle installments (if not recurring)
    else if (item.eh_parcelado && item.total_parcelas && item.total_parcelas > 1) {
      // Calcular valor_financeiro primeiro
      const valorFinanceiro = calculateValorFinanceiro({
        valor_operacao: item.valor_operacao || 0,
        valor_juros: item.valor_juros || 0,
        valor_multas: item.valor_multas || 0,
        valor_atualizacao: item.valor_atualizacao || 0,
        valor_descontos: item.valor_descontos || 0,
        valor_abto: item.valor_abto || 0,
        valor_pagto: item.valor_pagto || 0
      });
      
      // Use valor_financeiro para distribuir as parcelas
      const valorParaDistribuir = valorFinanceiro;
      const parcelasParaDistribuir = item.total_parcelas;
      
      // Calcular distribuição usando a nova lógica financeira
      const valoresParcelas = calculateInstallmentValues(valorParaDistribuir, parcelasParaDistribuir, false);
      
      let parentId: string | undefined = item.lancamento_pai_id;

      for (let i = 0; i < item.total_parcelas; i++) {
        const installmentDate = parseDateFromYYYYMMDD(item.data_vencimento);
        // Assuming monthly installments for simplicity, adjust as needed
        installmentDate.setMonth(installmentDate.getMonth() + i);

        const installmentItem = {
          ...item,
          valor_parcela: valoresParcelas[i] || 0,
          numero_parcela: i + 1,
          total_parcelas: item.total_parcelas,
          data_vencimento: formatDateToYYYYMMDD(installmentDate),
          eh_parcelado: false, // Subsequent items are not parcelled themselves
          eh_recorrente: false, // Installments are not recurring
          lancamento_pai_id: parentId,
        };

        const { data: createdInstallment, error } = await supabase.from('contas_receber').insert([installmentItem]).select().single();
        if (error) throw error;
        createdItems.push(createdInstallment);

        if (i === 0 && !parentId) {
          parentId = createdInstallment.id; // Set the first created installment's ID as the parent for subsequent installments
        }
      }
    }
    // If neither recurring nor parcelled, just create a single item
    else {
      const { data, error } = await supabase.from('contas_receber').insert([item]).select().single();
      if (error) throw error;
      createdItems.push(data);
    }
    return createdItems;
  },

  // Update method remains largely the same, as updating a series is complex and out of scope
  async update(id: string, updates: Partial<Omit<ContaReceber, 'id' | 'created_at' | 'updated_at' | 'empresas' | 'participantes' | 'categorias' | 'departamentos' | 'formas_cobranca' | 'valor_financeiro'>>): Promise<ContaReceber> {
    if (!isSupabaseConfigured()) {
      throwConfigError();
    }
    
    const { data, error } = await supabase
      .from('contas_receber')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
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