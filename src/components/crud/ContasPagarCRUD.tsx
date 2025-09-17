import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import TagInput from '../ui/TagInput';
import ConfirmDialog from '../ui/ConfirmDialog';
import FinancialSummary from '../ui/FinancialSummary';
import ElectronicDataModal from '../modals/ElectronicDataModal';
import MassCancellationModal from '../modals/MassCancellationModal';
import RecurrenceReplicationModal from '../modals/RecurrenceReplicationModal';
import InstallmentReplicationModal from '../modals/InstallmentReplicationModal';
import InstallmentManagementModal from '../modals/InstallmentManagementModal';
import { useToast } from '../../hooks/useToast';
import { 
  contasPagarServiceExtended, 
  empresasService, 
  participantesService,
  categoriasService,
  departamentosService,
  formasCobrancaService,
  contasFinanceirasService,
  tiposDocumentosService
} from '../../services/database';
import { supabase } from '../../lib/supabase';
import { formatDateForInput, formatDateForDisplay } from '../../utils/dateUtils';
import { calculateValorFinanceiro } from '../../utils/financialCalculations';
import { Settings, Users, Calendar, RefreshCw } from 'lucide-react';
import type { 
  ContaPagar, 
  Empresa, 
  Participante, 
  Categoria, 
  Departamento, 
  FormaCobranca,
  ContaFinanceira,
  TipoDocumento,
  ElectronicData
} from '../../types/database';

interface ContasPagarCRUDProps {
  showError?: (message: string) => void;
  showSuccess?: (message: string) => void;
}

const ContasPagarCRUD: React.FC<ContasPagarCRUDProps> = ({ 
  showError: externalShowError, 
  showSuccess: externalShowSuccess 
}) => {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [formasCobranca, setFormasCobranca] = useState<FormaCobranca[]>([]);
  const [contasFinanceiras, setContasFinanceiras] = useState<ContaFinanceira[]>([]);
  const [tiposDocumentos, setTiposDocumentos] = useState<TipoDocumento[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaPagar | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: ContaPagar | null;
  }>({ isOpen: false, item: null });
  const [massCancellationModal, setMassCancellationModal] = useState<{
    isOpen: boolean;
    records: ContaPagar[];
  }>({ isOpen: false, records: [] });
  const [recurrenceReplicationModal, setRecurrenceReplicationModal] = useState<{
    isOpen: boolean;
    originalRecord: ContaPagar | null;
    updatedRecord: ContaPagar | null;
    futureRecords: ContaPagar[];
  }>({ isOpen: false, originalRecord: null, updatedRecord: null, futureRecords: [] });
  const [installmentReplicationModal, setInstallmentReplicationModal] = useState<{
    isOpen: boolean;
    originalRecord: ContaPagar | null;
    updatedRecord: ContaPagar | null;
    futureInstallments: ContaPagar[];
  }>({ isOpen: false, originalRecord: null, updatedRecord: null, futureInstallments: [] });
  const [installmentManagementModal, setInstallmentManagementModal] = useState<{
    isOpen: boolean;
    records: ContaPagar[];
    isRecurringSeries: boolean;
  }>({ isOpen: false, records: [], isRecurringSeries: false });
  const [electronicDataModal, setElectronicDataModal] = useState<{
    isOpen: boolean;
    initialData: ElectronicData | null;
  }>({ isOpen: false, initialData: null });
  const { showError: internalShowError, showSuccess: internalShowSuccess } = useToast();
  
  // Use external toast functions if provided, otherwise use internal ones
  const showError = externalShowError || internalShowError;
  const showSuccess = externalShowSuccess || internalShowSuccess;
  
  const [formData, setFormData] = useState({
    empresa_id: '',
    fornecedor_id: '',
    categoria_id: '',
    departamento_id: '',
    forma_cobranca_id: '',
    conta_cobranca_id: '',
    tipo_documento_id: '',
    descricao: '',
    valor_operacao: '',
    valor_juros: '',
    valor_multas: '',
    valor_atualizacao: '',
    valor_descontos: '',
    valor_abto: '',
    valor_pagto: '',
    valor_parcela: '',
    status: 'pendente' as 'pendente' | 'pago' | 'cancelado',
    data_vencimento: '',
    data_pagamento: '',
    observacoes: '',
    dados_ele: null as ElectronicData | null,
    id_autorizacao: '',
    eh_parcelado: false,
    total_parcelas: '',
    eh_recorrente: false,
    periodicidade: '',
    frequencia_recorrencia: '',
    data_inicio_recorrencia: '',
    termino_apos_ocorrencias: '',
    n_docto_origem: '',
    n_doctos_ref: [] as string[],
    projetos: [] as string[],
    sku_parcela: '',
    intervalo_ini: '',
    intervalo_rec: '',
    eh_vencto_fixo: false
  });

  const columns = [
    {
      key: 'descricao' as keyof ContaPagar,
      header: 'Descrição',
      sortable: true
    },
    {
      key: 'participantes' as keyof ContaPagar,
      header: 'Fornecedor',
      render: (value: any) => value?.nome || '-'
    },
    {
      key: 'valor_financeiro' as keyof ContaPagar,
      header: 'Valor Financeiro',
      render: (value: number) => `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
    },
    {
      key: 'valor_parcela' as keyof ContaPagar,
      header: 'Valor Parcela',
      render: (value: number) => `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
    },
    {
      key: 'status' as keyof ContaPagar,
      header: 'Status',
      render: (value: string) => {
        const statusColors = {
          pendente: 'bg-yellow-100 text-yellow-800',
          pago: 'bg-green-100 text-green-800',
          cancelado: 'bg-gray-100 text-gray-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[value as keyof typeof statusColors]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'data_vencimento' as keyof ContaPagar,
      header: 'Vencimento',
      render: (value: string) => formatDateForDisplay(value),
      sortable: true
    },
    {
      key: 'eh_parcelado' as keyof ContaPagar,
      header: 'Tipo',
      render: (value: boolean, item: ContaPagar) => {
        if (item.eh_recorrente) {
          return <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">Recorrente</span>;
        }
        if (value || item.total_parcelas > 1) {
          return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Parcelado</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Único</span>;
      }
    },
    {
      key: 'numero_parcela' as keyof ContaPagar,
      header: 'Parcela',
      render: (value: number, item: ContaPagar) => {
        if (item.eh_recorrente) {
          return `${value || 1}ª ocorrência`;
        }
        if (item.total_parcelas > 1) {
          return `${value || 1}/${item.total_parcelas}`;
        }
        return '-';
      }
    },
    {
      key: 'id' as keyof ContaPagar,
      header: 'Gerenciar',
      render: (value: string, item: ContaPagar) => {
        const isPartOfSeries = item.eh_parcelado || item.eh_recorrente || item.lancamento_pai_id || (item.total_parcelas && item.total_parcelas > 1);
        
        if (!isPartOfSeries) return '-';
        
        return (
          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSeriesManagement(item);
              }}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
              title={item.eh_recorrente ? 'Gerenciar Recorrência' : 'Gerenciar Parcelas'}
            >
              {item.eh_recorrente ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
            </button>
          </div>
        );
      }
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        contasData, 
        empresasData, 
        participantesData, 
        categoriasData, 
        departamentosData, 
        formasData,
        contasFinanceirasData,
        tiposDocumentosData
      ] = await Promise.all([
        contasPagarServiceExtended.getAllWithRelations(),
        empresasService.getAll(),
        participantesService.getAll(),
        categoriasService.getAll(),
        departamentosService.getAll(),
        formasCobrancaService.getAll(),
        contasFinanceirasService.getAll(),
        tiposDocumentosService.getAll()
      ]);
      
      setContas(contasData);
      setEmpresas(empresasData);
      setParticipantes(participantesData);
      setCategorias(categoriasData);
      setDepartamentos(departamentosData);
      setFormasCobranca(formasData);
      setContasFinanceiras(contasFinanceirasData);
      setTiposDocumentos(tiposDocumentosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      empresa_id: '',
      fornecedor_id: '',
      categoria_id: '',
      departamento_id: '',
      forma_cobranca_id: '',
      conta_cobranca_id: '',
      tipo_documento_id: '',
      descricao: '',
      valor_operacao: '',
      valor_juros: '',
      valor_multas: '',
      valor_atualizacao: '',
      valor_descontos: '',
      valor_abto: '',
      valor_pagto: '',
      valor_parcela: '',
      status: 'pendente',
      data_vencimento: '',
      data_pagamento: '',
      observacoes: '',
      dados_ele: null,
      id_autorizacao: '',
      eh_parcelado: false,
      total_parcelas: '',
      eh_recorrente: false,
      periodicidade: '',
      frequencia_recorrencia: '',
      data_inicio_recorrencia: '',
      termino_apos_ocorrencias: '',
      n_docto_origem: '',
      n_doctos_ref: [],
      projetos: [],
      sku_parcela: '',
      intervalo_ini: '',
      intervalo_rec: '',
      eh_vencto_fixo: false
    });
  };

  const handleAdd = () => {
    setEditingConta(null);
    resetFormData();
    setIsModalOpen(true);
  };

  const handleSeriesManagement = async (conta: ContaPagar) => {
    try {
      // Find all related records in the series
      const parentId = conta.lancamento_pai_id || conta.id;
      const { data: relatedRecords, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .or(`id.eq.${parentId},lancamento_pai_id.eq.${parentId}`)
        .is('deleted_at', null)
        .order('data_vencimento', { ascending: true });
        
      if (error) throw error;
      
      const isRecurringSeries = conta.eh_recorrente || relatedRecords?.some(r => r.eh_recorrente) || false;
      
      setInstallmentManagementModal({
        isOpen: true,
        records: relatedRecords || [conta],
        isRecurringSeries
      });
    } catch (error) {
      console.error('Erro ao carregar série:', error);
      showError('Erro ao carregar série de registros');
    }
  };

  const handleEdit = (conta: ContaPagar) => {
    setEditingConta(conta);
    setFormData({
      empresa_id: conta.empresa_id,
      fornecedor_id: conta.fornecedor_id,
      categoria_id: conta.categoria_id || '',
      departamento_id: conta.departamento_id || '',
      forma_cobranca_id: conta.forma_cobranca_id || '',
      conta_cobranca_id: conta.conta_cobranca_id || '',
      tipo_documento_id: conta.tipo_documento_id || '',
      descricao: conta.descricao,
      valor_operacao: conta.valor_operacao?.toString() || '',
      valor_juros: conta.valor_juros?.toString() || '',
      valor_multas: conta.valor_multas?.toString() || '',
      valor_atualizacao: conta.valor_atualizacao?.toString() || '',
      valor_descontos: conta.valor_descontos?.toString() || '',
      valor_abto: conta.valor_abto?.toString() || '',
      valor_pagto: conta.valor_pagto?.toString() || '',
      valor_parcela: conta.valor_parcela?.toString() || '',
      status: conta.status,
      data_vencimento: formatDateForInput(conta.data_vencimento),
      data_pagamento: formatDateForInput(conta.data_pagamento),
      observacoes: conta.observacoes || '',
      dados_ele: conta.dados_ele || null,
      id_autorizacao: conta.id_autorizacao || '',
      eh_parcelado: conta.eh_parcelado || false,
      total_parcelas: conta.total_parcelas?.toString() || '',
      eh_recorrente: conta.eh_recorrente || false,
      periodicidade: conta.periodicidade || '',
      frequencia_recorrencia: conta.frequencia_recorrencia?.toString() || '',
      data_inicio_recorrencia: formatDateForInput(conta.data_inicio_recorrencia),
      termino_apos_ocorrencias: conta.termino_apos_ocorrencias?.toString() || '',
      n_docto_origem: conta.n_docto_origem || '',
      n_doctos_ref: conta.n_doctos_ref || [],
      projetos: conta.projetos || [],
      sku_parcela: conta.sku_parcela || '',
      intervalo_ini: conta.intervalo_ini?.toString() || '',
      intervalo_rec: conta.intervalo_rec?.toString() || '',
      eh_vencto_fixo: conta.eh_vencto_fixo || false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (conta: ContaPagar) => {
    try {
      const deleteCheck = await contasPagarServiceExtended.canDelete(conta.id);
      
      if (!deleteCheck.canDelete) {
        if (deleteCheck.requiresMassModal && deleteCheck.relatedRecords) {
          setMassCancellationModal({
            isOpen: true,
            records: deleteCheck.relatedRecords
          });
        } else {
          showError(deleteCheck.reason || 'Não é possível excluir este registro');
        }
        return;
      }
      
      // Simple record - show confirmation dialog
      setConfirmDialog({ isOpen: true, item: conta });
    } catch (error) {
      console.error('Erro ao verificar possibilidade de exclusão:', error);
      showError('Erro ao verificar possibilidade de exclusão');
    }
  };

  const confirmDelete = async () => {
    if (!confirmDialog.item) return;
    
    try {
      await contasPagarServiceExtended.delete(confirmDialog.item.id);
      showSuccess('Conta excluída com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      showError('Erro ao excluir conta');
    }
  };

  const handleMassCancellation = async (selectedIds: string[]) => {
    try {
      await contasPagarServiceExtended.cancelRecords(selectedIds);
      showSuccess(`${selectedIds.length} registro(s) cancelado(s) com sucesso`);
      setMassCancellationModal({ isOpen: false, records: [] });
      await loadData();
    } catch (error) {
      console.error('Erro ao cancelar registros:', error);
      showError('Erro ao cancelar registros');
    }
  };

  const handleRecurrenceReplication = async (selectedChanges: any[]) => {
    try {
      const { futureRecords } = recurrenceReplicationModal;
      
      for (const record of futureRecords) {
        const updates: any = {};
        
        for (const change of selectedChanges) {
          if (change.field === 'data_vencimento' && change.newDayOfMonth) {
            // Special handling for date changes - apply new day of month
            const currentDate = parseDateFromYYYYMMDD(record.data_vencimento);
            const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), change.newDayOfMonth);
            updates.data_vencimento = formatDateToYYYYMMDD(newDate);
          } else {
            updates[change.field] = change.newValue;
          }
        }
        
        if (Object.keys(updates).length > 0) {
          await contasPagarServiceExtended.update(record.id, updates);
        }
      }
      
      setRecurrenceReplicationModal({ 
        isOpen: false, 
        originalRecord: null, 
        updatedRecord: null, 
        futureRecords: [] 
      });
      setIsModalOpen(false);
      showSuccess(`Alterações aplicadas a ${futureRecords.length} registro(s) recorrente(s)`);
      await loadData();
    } catch (error) {
      console.error('Erro ao replicar alterações:', error);
      showError('Erro ao replicar alterações');
    }
  };

  const handleInstallmentReplication = async (selectedChanges: any[]) => {
    try {
      const { futureInstallments } = installmentReplicationModal;
      
      for (const installment of futureInstallments) {
        const updates: any = {};
        
        for (const change of selectedChanges) {
          if (change.field === 'data_vencimento') {
            // Calculate date difference and apply to future installments
            const originalDate = parseDateFromYYYYMMDD(change.oldValue);
            const newDate = parseDateFromYYYYMMDD(change.newValue);
            const dayDifference = newDate.getDate() - originalDate.getDate();
            
            const installmentDate = parseDateFromYYYYMMDD(installment.data_vencimento);
            installmentDate.setDate(installmentDate.getDate() + dayDifference);
            updates.data_vencimento = formatDateToYYYYMMDD(installmentDate);
          } else {
            updates[change.field] = change.newValue;
          }
        }
        
        if (Object.keys(updates).length > 0) {
          await contasPagarServiceExtended.update(installment.id, updates);
        }
      }
      
      setInstallmentReplicationModal({ 
        isOpen: false, 
        originalRecord: null, 
        updatedRecord: null, 
        futureInstallments: [] 
      });
      setIsModalOpen(false);
      showSuccess(`Alterações aplicadas a ${futureInstallments.length} parcela(s) futura(s)`);
      await loadData();
    } catch (error) {
      console.error('Erro ao replicar alterações:', error);
      showError('Erro ao replicar alterações');
    }
  };

  const handleInstallmentManagement = async (installments: any[]) => {
    try {
      for (const installment of installments) {
        const updates = {
          sku_parcela: installment.skuParcela,
          data_vencimento: installment.dueDate,
          forma_cobranca_id: installment.collectionMethodId || null,
          conta_cobranca_id: installment.collectionAccountId || null,
          valor_parcela: installment.amount,
          valor_operacao: installment.amount
        };
        
        await contasPagarServiceExtended.update(installment.id, updates);
      }
      
      setInstallmentManagementModal({ isOpen: false, records: [], isRecurringSeries: false });
      showSuccess(`${installments.length} registro(s) atualizado(s) com sucesso`);
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar registros:', error);
      showError('Erro ao atualizar registros');
    }
  };

  const handleInstallmentEdit = (editedInstallmentId: string, originalData: ContaPagar, updatedData: ContaPagar, isRecurring: boolean) => {
    // This function is called when an individual installment is edited within the management modal
    // It should trigger the appropriate replication modal based on the type of series
    
    if (isRecurring) {
      // For recurring series, find future occurrences
      const parentId = originalData.lancamento_pai_id || originalData.id;
      supabase
        .from('contas_pagar')
        .select('*')
        .or(`id.eq.${parentId},lancamento_pai_id.eq.${parentId}`)
        .gt('data_vencimento', originalData.data_vencimento)
        .eq('eh_recorrente', true)
        .is('deleted_at', null)
        .order('data_vencimento', { ascending: true })
        .then(({ data: futureRecords, error }) => {
          if (!error && futureRecords && futureRecords.length > 0) {
            setRecurrenceReplicationModal({
              isOpen: true,
              originalRecord: originalData,
              updatedRecord: updatedData,
              futureRecords
            });
          }
        });
    } else {
      // For installment series, find future installments
      const parentId = originalData.lancamento_pai_id || originalData.id;
      supabase
        .from('contas_pagar')
        .select('*')
        .or(`id.eq.${parentId},lancamento_pai_id.eq.${parentId}`)
        .gt('numero_parcela', originalData.numero_parcela || 1)
        .is('deleted_at', null)
        .order('numero_parcela', { ascending: true })
        .then(({ data: futureInstallments, error }) => {
          if (!error && futureInstallments && futureInstallments.length > 0) {
            setInstallmentReplicationModal({
              isOpen: true,
              originalRecord: originalData,
              updatedRecord: updatedData,
              futureInstallments
            });
          }
        });
    }
  };

  const handleElectronicDataSubmit = (data: ElectronicData, authorizationId: string) => {
    setFormData(prev => ({
      ...prev,
      dados_ele: data,
      id_autorizacao: authorizationId
    }));
    setElectronicDataModal({ isOpen: false, initialData: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        valor_operacao: parseFloat(formData.valor_operacao) || 0,
        valor_juros: parseFloat(formData.valor_juros) || 0,
        valor_multas: parseFloat(formData.valor_multas) || 0,
        valor_atualizacao: parseFloat(formData.valor_atualizacao) || 0,
        valor_descontos: parseFloat(formData.valor_descontos) || 0,
        valor_abto: parseFloat(formData.valor_abto) || 0,
        valor_pagto: parseFloat(formData.valor_pagto) || 0,
        valor_parcela: parseFloat(formData.valor_parcela) || 0,
        total_parcelas: parseInt(formData.total_parcelas) || 1,
        frequencia_recorrencia: parseInt(formData.frequencia_recorrencia) || 1,
        termino_apos_ocorrencias: parseInt(formData.termino_apos_ocorrencias) || null,
        intervalo_ini: parseInt(formData.intervalo_ini) || 0,
        intervalo_rec: parseInt(formData.intervalo_rec) || 30,
        categoria_id: formData.categoria_id || null,
        departamento_id: formData.departamento_id || null,
        forma_cobranca_id: formData.forma_cobranca_id || null,
        conta_cobranca_id: formData.conta_cobranca_id || null,
        tipo_documento_id: formData.tipo_documento_id || null,
        data_pagamento: formData.data_pagamento || null,
        periodicidade: formData.periodicidade || null,
        data_inicio_recorrencia: formData.data_inicio_recorrencia || null,
        n_docto_origem: formData.n_docto_origem || null,
        sku_parcela: formData.sku_parcela || null,
        id_autorizacao: formData.id_autorizacao || null
      };
      
      if (editingConta) {
        await contasPagarServiceExtended.update(editingConta.id, dataToSubmit);
        showSuccess('Conta atualizada com sucesso');
      } else {
        await contasPagarServiceExtended.create(dataToSubmit);
        showSuccess('Conta criada com sucesso');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      showError('Erro ao salvar conta');
    }
  };

  const empresasOptions = empresas.map(emp => ({ value: emp.id, label: emp.nome }));
  const fornecedoresOptions = participantes
    .filter(p => p.tipo === 'fornecedor' || p.tipo === 'ambos')
    .map(part => ({ value: part.id, label: part.nome }));
  const categoriasOptions = categorias.map(cat => ({ value: cat.id, label: cat.nome }));
  const departamentosOptions = departamentos.map(dep => ({ value: dep.id, label: dep.nome }));
  const formasOptions = formasCobranca.map(forma => ({ value: forma.id, label: forma.nome }));
  const contasFinanceirasOptions = contasFinanceiras.map(conta => ({ 
    value: conta.id, 
    label: `${conta.codigo_conta} - ${conta.nome_conta}` 
  }));
  const tiposDocumentosOptions = tiposDocumentos.map(tipo => ({ 
    value: tipo.id, 
    label: `${tipo.sigla_tipo} - ${tipo.nome_tipo}` 
  }));

  // Calculate financial values for summary
  const financialValues = {
    valor_operacao: parseFloat(formData.valor_operacao) || 0,
    valor_juros: parseFloat(formData.valor_juros) || 0,
    valor_multas: parseFloat(formData.valor_multas) || 0,
    valor_atualizacao: parseFloat(formData.valor_atualizacao) || 0,
    valor_descontos: parseFloat(formData.valor_descontos) || 0,
    valor_abto: parseFloat(formData.valor_abto) || 0,
    valor_pagto: parseFloat(formData.valor_pagto) || 0
  };

  return (
    <div>
      <DataTable
        data={contas}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        title="Contas a Pagar"
        addButtonText="Adicionar Conta a Pagar"
        searchPlaceholder="Buscar contas a pagar..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingConta ? 'Editar Conta a Pagar' : 'Adicionar Conta a Pagar'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          {/* Informações Básicas */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Empresa"
                value={formData.empresa_id}
                onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                options={empresasOptions}
                placeholder="Selecione uma empresa"
                required
              />
              
              <Select
                label="Fornecedor"
                value={formData.fornecedor_id}
                onChange={(e) => setFormData({ ...formData, fornecedor_id: e.target.value })}
                options={fornecedoresOptions}
                placeholder="Selecione um fornecedor"
                required
              />
              
              <Select
                label="Categoria"
                value={formData.categoria_id}
                onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                options={categoriasOptions}
                placeholder="Selecione uma categoria"
              />
              
              <Select
                label="Departamento"
                value={formData.departamento_id}
                onChange={(e) => setFormData({ ...formData, departamento_id: e.target.value })}
                options={departamentosOptions}
                placeholder="Selecione um departamento"
              />
            </div>
            
            <Input
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
            />
          </div>

          {/* Valores Financeiros */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Valores Financeiros</h3>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Valor da Operação"
                type="number"
                value={formData.valor_operacao}
                onChange={(e) => setFormData({ ...formData, valor_operacao: e.target.value })}
                step="0.01"
                min="0"
                required
              />
              
              <Input
                label="Juros"
                type="number"
                value={formData.valor_juros}
                onChange={(e) => setFormData({ ...formData, valor_juros: e.target.value })}
                step="0.01"
                min="0"
              />
              
              <Input
                label="Multas"
                type="number"
                value={formData.valor_multas}
                onChange={(e) => setFormData({ ...formData, valor_multas: e.target.value })}
                step="0.01"
                min="0"
              />
              
              <Input
                label="Atualização Monetária"
                type="number"
                value={formData.valor_atualizacao}
                onChange={(e) => setFormData({ ...formData, valor_atualizacao: e.target.value })}
                step="0.01"
                min="0"
              />
              
              <Input
                label="Descontos"
                type="number"
                value={formData.valor_descontos}
                onChange={(e) => setFormData({ ...formData, valor_descontos: e.target.value })}
                step="0.01"
                min="0"
              />
              
              <Input
                label="Abatimentos"
                type="number"
                value={formData.valor_abto}
                onChange={(e) => setFormData({ ...formData, valor_abto: e.target.value })}
                step="0.01"
                min="0"
              />
              
              <Input
                label="Pagamentos Realizados"
                type="number"
                value={formData.valor_pagto}
                onChange={(e) => setFormData({ ...formData, valor_pagto: e.target.value })}
                step="0.01"
                min="0"
              />
              
              <Input
                label="Valor da Parcela"
                type="number"
                value={formData.valor_parcela}
                onChange={(e) => setFormData({ ...formData, valor_parcela: e.target.value })}
                step="0.01"
                min="0"
              />
            </div>
            
            {/* Financial Summary */}
            <FinancialSummary 
              values={financialValues}
              isInstallment={formData.eh_parcelado}
              totalInstallments={parseInt(formData.total_parcelas) || 1}
              startDate={formData.data_vencimento}
              className="mt-4"
            />
          </div>

          {/* Datas e Status */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Datas e Status</h3>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Data de Vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                required
              />
              
              <Input
                label="Data de Pagamento"
                type="date"
                value={formData.data_pagamento}
                onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
              />
              
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pendente' | 'pago' | 'cancelado' })}
                options={[
                  { value: 'pendente', label: 'Pendente' },
                  { value: 'pago', label: 'Pago' },
                  { value: 'cancelado', label: 'Cancelado' }
                ]}
                required
              />
            </div>
          </div>

          {/* Formas de Cobrança */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Formas de Cobrança</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Forma de Cobrança"
                value={formData.forma_cobranca_id}
                onChange={(e) => setFormData({ ...formData, forma_cobranca_id: e.target.value })}
                options={formasOptions}
                placeholder="Selecione uma forma"
              />
              
              <Select
                label="Conta de Cobrança"
                value={formData.conta_cobranca_id}
                onChange={(e) => setFormData({ ...formData, conta_cobranca_id: e.target.value })}
                options={contasFinanceirasOptions}
                placeholder="Selecione uma conta"
              />
            </div>
          </div>

          {/* Parcelamento */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Parcelamento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="eh_parcelado"
                  checked={formData.eh_parcelado}
                  onChange={(e) => setFormData({ ...formData, eh_parcelado: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="eh_parcelado" className="text-sm font-medium text-gray-700">
                  É Parcelado?
                </label>
              </div>
              
              {formData.eh_parcelado && (
                <Input
                  label="Total de Parcelas"
                  type="number"
                  value={formData.total_parcelas}
                  onChange={(e) => setFormData({ ...formData, total_parcelas: e.target.value })}
                  min="2"
                  required={formData.eh_parcelado}
                />
              )}
            </div>
          </div>

          {/* Configurações de Recorrência */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Recorrência</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="É Recorrente?"
                value={formData.eh_recorrente ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, eh_recorrente: e.target.value === 'true' })}
                options={[
                  { value: 'false', label: 'Não' },
                  { value: 'true', label: 'Sim' }
                ]}
              />
              
              {formData.eh_recorrente && (
                <Select
                  label="Periodicidade"
                  value={formData.periodicidade}
                  onChange={(e) => setFormData({ ...formData, periodicidade: e.target.value })}
                  options={[
                    { value: 'diario', label: 'Diário' },
                    { value: 'semanal', label: 'Semanal' },
                    { value: 'mensal', label: 'Mensal' },
                    { value: 'anual', label: 'Anual' }
                  ]}
                  placeholder="Selecione a periodicidade"
                  required={formData.eh_recorrente}
                />
              )}
            </div>
            
            {formData.eh_recorrente && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <Input
                  label="Frequência de Recorrência"
                  type="number"
                  value={formData.frequencia_recorrencia}
                  onChange={(e) => setFormData({ ...formData, frequencia_recorrencia: e.target.value })}
                  min="1"
                  required={formData.eh_recorrente}
                />
                
                <Input
                  label="Data de Início da Recorrência"
                  type="date"
                  value={formData.data_inicio_recorrencia}
                  onChange={(e) => setFormData({ ...formData, data_inicio_recorrencia: e.target.value })}
                  required={formData.eh_recorrente}
                />
                
                <Input
                  label="Terminar Após (Ocorrências)"
                  type="number"
                  value={formData.termino_apos_ocorrencias}
                  onChange={(e) => setFormData({ ...formData, termino_apos_ocorrencias: e.target.value })}
                  min="1"
                />
              </div>
            )}
          </div>

          {/* Documentos */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Documentos</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de Documento"
                value={formData.tipo_documento_id}
                onChange={(e) => setFormData({ ...formData, tipo_documento_id: e.target.value })}
                options={tiposDocumentosOptions}
                placeholder="Selecione um tipo"
              />
              
              <Input
                label="Nº Documento Origem"
                value={formData.n_docto_origem}
                onChange={(e) => setFormData({ ...formData, n_docto_origem: e.target.value })}
              />
              
              <Input
                label="SKU da Parcela"
                value={formData.sku_parcela}
                onChange={(e) => setFormData({ ...formData, sku_parcela: e.target.value })}
              />
              
              <Input
                label="ID Autorização"
                value={formData.id_autorizacao}
                onChange={(e) => setFormData({ ...formData, id_autorizacao: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <TagInput
                label="Documentos de Referência"
                value={formData.n_doctos_ref}
                onChange={(tags) => setFormData({ ...formData, n_doctos_ref: tags })}
                placeholder="Digite um documento e pressione Enter"
              />
              
              <TagInput
                label="Projetos"
                value={formData.projetos}
                onChange={(tags) => setFormData({ ...formData, projetos: tags })}
                placeholder="Digite um projeto e pressione Enter"
              />
            </div>
          </div>

          {/* Configurações Adicionais */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações Adicionais</h3>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Intervalo Inicial (dias)"
                type="number"
                value={formData.intervalo_ini}
                onChange={(e) => setFormData({ ...formData, intervalo_ini: e.target.value })}
                min="0"
              />
              
              <Input
                label="Intervalo Recorrente (dias)"
                type="number"
                value={formData.intervalo_rec}
                onChange={(e) => setFormData({ ...formData, intervalo_rec: e.target.value })}
                min="1"
              />
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="eh_vencto_fixo"
                  checked={formData.eh_vencto_fixo}
                  onChange={(e) => setFormData({ ...formData, eh_vencto_fixo: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="eh_vencto_fixo" className="text-sm font-medium text-gray-700">
                  Vencimento Fixo?
                </label>
              </div>
            </div>
          </div>

          {/* Dados Eletrônicos */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Eletrônicos</h3>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setElectronicDataModal({ isOpen: true, initialData: formData.dados_ele })}
            >
              {formData.dados_ele ? 'Editar Dados Eletrônicos' : 'Adicionar Dados Eletrônicos'}
            </Button>
            {formData.dados_ele && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Tipo:</strong> {formData.dados_ele.tipoIntegracao} | 
                  <strong> Credenciadora:</strong> {formData.dados_ele.credenciadora} | 
                  <strong> Bandeira:</strong> {formData.dados_ele.bandeira}
                </p>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingConta ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a conta "${confirmDialog.item?.descricao}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />

      <MassCancellationModal
        isOpen={massCancellationModal.isOpen}
        onClose={() => setMassCancellationModal({ isOpen: false, records: [] })}
        onConfirm={handleMassCancellation}
        records={massCancellationModal.records}
        type="pagar"
      />

      <RecurrenceReplicationModal
        isOpen={recurrenceReplicationModal.isOpen}
        onClose={() => setRecurrenceReplicationModal({ 
          isOpen: false, 
          originalRecord: null, 
          updatedRecord: null, 
          futureRecords: [] 
        })}
        onConfirm={handleRecurrenceReplication}
        originalRecord={recurrenceReplicationModal.originalRecord}
        updatedRecord={recurrenceReplicationModal.updatedRecord}
        futureRecords={recurrenceReplicationModal.futureRecords}
        type="pagar"
        empresas={empresas}
        participantes={participantes}
        categorias={categorias}
        departamentos={departamentos}
        formasCobranca={formasCobranca}
        contasFinanceiras={contasFinanceiras}
        tiposDocumentos={tiposDocumentos}
      />

      <InstallmentReplicationModal
        isOpen={installmentReplicationModal.isOpen}
        onClose={() => setInstallmentReplicationModal({ 
          isOpen: false, 
          originalRecord: null, 
          updatedRecord: null, 
          futureInstallments: [] 
        })}
        onConfirm={async (selectedChanges) => {
          try {
            setLoading(true);
            
            if (!installmentReplicationModal.originalRecord || !installmentReplicationModal.updatedRecord) {
              showError('Dados da parcela original não encontrados');
              return;
            }
            
            const originalRecord = installmentReplicationModal.originalRecord;
            const updatedRecord = installmentReplicationModal.updatedRecord;
            const futureInstallments = installmentReplicationModal.futureInstallments;
            
            // Filter future installments to only open ones
            const futureOpenInstallments = futureInstallments.filter(record => {
              const status = record.status.toLowerCase();
              return status !== 'pago' && status !== 'cancelado';
            });
            
            if (futureOpenInstallments.length === 0) {
              showError('Nenhuma parcela futura em aberto para aplicar as alterações');
              return;
            }
            
            let updatedCount = 0;
            
            // Apply changes to each future open installment
            for (const futureInstallment of futureOpenInstallments) {
              const updates: any = {};
              
              for (const change of selectedChanges) {
                if (change.field === 'data_vencimento') {
                  // For installments, maintain monthly intervals
                  const originalDate = new Date(originalRecord.data_vencimento);
                  const updatedDate = new Date(updatedRecord.data_vencimento);
                  const dayDifference = updatedDate.getDate() - originalDate.getDate();
                  
                  const futureDate = new Date(futureInstallment.data_vencimento);
                  futureDate.setDate(futureDate.getDate() + dayDifference);
                  
                  updates.data_vencimento = formatDateToYYYYMMDD(futureDate);
                } else if (change.field === 'valor_parcela') {
                  updates.valor_parcela = change.newValue;
                  updates.valor_operacao = change.newValue;
                } else {
                  // Handle other fields generically
                  let value = change.newValue;
                  
                  // Convert empty strings to null for nullable fields
                  if (value === '' && change.field.includes('_id')) {
                    value = null;
                  }
                  
                  updates[change.field] = value;
                }
              }
              
              // Only update if there are actual changes
              if (Object.keys(updates).length > 0) {
                await contasPagarServiceExtended.update(futureInstallment.id, updates);
                updatedCount++;
              }
            }
            
            if (updatedCount > 0) {
              showSuccess(`${selectedChanges.length} alteração(ões) aplicada(s) com sucesso a ${updatedCount} parcela(s) futura(s)`);
            } else {
              showSuccess('Nenhuma alteração foi necessária - todas as parcelas já estão atualizadas');
            }
            
            await loadData();
          } catch (error) {
            console.error('Erro ao replicar alterações nas parcelas:', error);
            showError(`Erro ao aplicar alterações às parcelas futuras: ${(error as any)?.message || error}`);
          } finally {
            setLoading(false);
          }
        }}
        originalRecord={installmentReplicationModal.originalRecord}
        updatedRecord={installmentReplicationModal.updatedRecord}
        futureInstallments={installmentReplicationModal.futureInstallments}
        type="pagar"
      />

      <InstallmentManagementModal
        isOpen={installmentManagementModal.isOpen}
        onClose={() => setInstallmentManagementModal({ isOpen: false, records: [], isRecurringSeries: false })}
        onSave={handleInstallmentManagement}
        onInstallmentEdit={handleInstallmentEdit}
        records={installmentManagementModal.records}
        type="pagar"
        contasFinanceiras={contasFinanceiras}
        formasCobranca={formasCobranca}
        isRecurringSeries={installmentManagementModal.isRecurringSeries}
      />

      <ElectronicDataModal
        isOpen={electronicDataModal.isOpen}
        onClose={() => setElectronicDataModal({ isOpen: false, initialData: null })}
        onSubmit={handleElectronicDataSubmit}
        initialData={electronicDataModal.initialData}
      />
    </div>
  );
};

export default ContasPagarCRUD;