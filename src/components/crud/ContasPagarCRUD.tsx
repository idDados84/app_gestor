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
import InstallmentReplicationModal from '../modals/InstallmentReplicationModal';
import RecurrenceReplicationModal from '../modals/RecurrenceReplicationModal';
import { useToast } from '../../hooks/useToast';
import { Settings, Edit } from 'lucide-react';
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
import { formatDateForInput, formatDateForDisplay } from '../../utils/dateUtils';
import { parseDateFromYYYYMMDD, formatDateToYYYYMMDD } from '../../utils/dateUtils';
import { calculateValorFinanceiro } from '../../utils/financialCalculations';
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
    parentId?: string;
  }>({ isOpen: false, records: [] });
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<ContaPagar | null>(null);
  
  // Replication modal states
  const [isReplicationModalOpen, setIsReplicationModalOpen] = useState(false);
  const [originalRecordForReplication, setOriginalRecordForReplication] = useState<ContaPagar | null>(null);
  const [updatedRecordForReplication, setUpdatedRecordForReplication] = useState<ContaPagar | null>(null);
  const [futureRecordsForReplication, setFutureRecordsForReplication] = useState<ContaPagar[]>([]);
  const [isReplicationForRecurring, setIsReplicationForRecurring] = useState(false);
  const [electronicDataModal, setElectronicDataModal] = useState<{
    isOpen: boolean;
    data: ElectronicData | null;
  }>({ isOpen: false, data: null });
  const [installmentManagementModal, setInstallmentManagementModal] = useState<{
    isOpen: boolean;
    records: ContaPagar[];
    parentId?: string;
  }>({ isOpen: false, records: [] });
  const [installmentReplicationModal, setInstallmentReplicationModal] = useState<{
    isOpen: boolean;
    originalRecord: ContaPagar | null;
    updatedRecord: ContaPagar | null;
    futureInstallments: ContaPagar[];
  }>({ isOpen: false, originalRecord: null, updatedRecord: null, futureInstallments: [] });
  const [recurrenceReplicationModal, setRecurrenceReplicationModal] = useState<{
    isOpen: boolean;
    originalRecord: ContaPagar | null;
    updatedRecord: ContaPagar | null;
    futureRecords: ContaPagar[];
  }>({ isOpen: false, originalRecord: null, updatedRecord: null, futureRecords: [] });

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
      key: 'empresas' as keyof ContaPagar,
      header: 'Empresa',
      render: (value: any) => value?.nome || '-'
    },
    {
      key: 'participantes' as keyof ContaPagar,
      header: 'Fornecedor',
      render: (value: any) => value?.nome || '-'
    },
    {
      key: 'valor_parcela' as keyof ContaPagar,
      header: 'Valor Parcela',
      render: (value: number | null | undefined) => `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
    },
    {
      key: 'valor_operacao' as keyof ContaPagar,
      header: 'Valor Operação',
      render: (value: number | null | undefined) => `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
    },
    {
      key: 'valor_financeiro' as keyof ContaPagar,
      header: 'Valor Financeiro',
      render: (value: number | null | undefined) => `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
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
      header: 'Parcelado',
      render: (value: boolean, item: ContaPagar) => {
        if (value || (item.total_parcelas && item.total_parcelas > 1)) {
          return (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              {item.numero_parcela}/{item.total_parcelas}
            </span>
          );
        }
        return '-';
      }
    },
    {
      key: 'eh_recorrente' as keyof ContaPagar,
      header: 'Recorrente',
      render: (value: boolean) => value ? (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
          Sim
        </span>
      ) : '-'
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

  const handleAdd = () => {
    setEditingConta(null);
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
    setIsModalOpen(true);
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
            records: deleteCheck.relatedRecords,
            parentId: deleteCheck.parentId
          });
        } else {
          showError(deleteCheck.reason || 'Não é possível excluir este registro');
        }
        return;
      }
      
      // Simple record - show confirmation dialog
      setConfirmDialog({ isOpen: true, item: conta });
    } catch (error) {
      console.error('Erro ao verificar exclusão:', error);
      showError('Erro ao verificar se o registro pode ser excluído');
    }
  };

  const handleManageInstallments = async (conta: ContaPagar) => {
    try {
      setSelectedRecordForModal(conta);
      // Find all related installments
      const parentId = conta.lancamento_pai_id || conta.id;
      console.log('handleManageInstallments - Record:', conta);
      console.log('handleManageInstallments - eh_recorrente:', conta.eh_recorrente);
      const allInstallments = contas.filter(c => 
        c.id === parentId || c.lancamento_pai_id === parentId
      );
      
      if (allInstallments.length > 1) {
        setInstallmentManagementModal({
          isOpen: true,
          records: allInstallments.sort((a, b) => {
            const aNum = a.numero_parcela || 1;
            const bNum = b.numero_parcela || 1;
            return aNum - bNum;
          }),
          parentId
        });
      } else {
        showError('Nenhuma parcela relacionada encontrada');
      }
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
      showError('Erro ao carregar parcelas para gerenciamento');
    }
  };

  const confirmDelete = async () => {
    if (!confirmDialog.item) return;
    
    try {
      await contasPagarServiceExtended.delete(confirmDialog.item.id);
      showSuccess('Conta a pagar excluída com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir conta a pagar:', error);
      showError('Erro ao excluir conta a pagar');
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
      showError('Erro ao cancelar registros em massa');
    }
  };

  const handleInstallmentManagementSave = async (installments: any[]) => {
    try {
      // Update each installment with the new data
      for (const installment of installments) {
        const updateData = {
          sku_parcela: installment.skuParcela,
          data_vencimento: installment.dueDate,
          forma_cobranca_id: installment.collectionMethodId || null,
          conta_cobranca_id: installment.collectionAccountId || null,
          valor_parcela: installment.amount
        };
        
        await contasPagarServiceExtended.update(installment.id, updateData);
      }
      
      showSuccess('Parcelas atualizadas com sucesso');
      setInstallmentManagementModal({ isOpen: false, records: [] });
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar parcelas:', error);
      showError('Erro ao atualizar parcelas');
    }
  };

  const handleInstallmentEdit = async (editedInstallmentId: string, originalData: ContaPagar, updatedData: ContaPagar) => {
    try {
      // First, update the edited installment in the database
      const updateData = {
        sku_parcela: updatedData.sku_parcela,
        data_vencimento: updatedData.data_vencimento,
        forma_cobranca_id: updatedData.forma_cobranca_id,
        conta_cobranca_id: updatedData.conta_cobranca_id,
        valor_parcela: updatedData.valor_parcela
      };
      
      await contasPagarServiceExtended.update(editedInstallmentId, updateData);
      
      // Find all installments in the same series
      const parentId = originalData.lancamento_pai_id || originalData.id;
      const allInstallments = contas.filter(c => 
        c.id === parentId || c.lancamento_pai_id === parentId
      );
      
      // Find future installments (after the edited one)
      const futureInstallments = allInstallments.filter(c => 
        c.id !== editedInstallmentId && (
          new Date(c.data_vencimento) > new Date(updatedData.data_vencimento) ||
          (new Date(c.data_vencimento).getTime() === new Date(updatedData.data_vencimento).getTime() && 
           (c.numero_parcela || 0) > (updatedData.numero_parcela || 0))
        )
      );
      
      // If there are future installments, show replication modal
      if (futureInstallments.length > 0) {
        setInstallmentReplicationModal({
          isOpen: true,
          originalRecord: originalData,
          updatedRecord: updatedData,
          futureInstallments
        });
      } else {
        showSuccess('Parcela atualizada com sucesso');
      }
      
      // Close installment management modal and reload data
      setInstallmentManagementModal({ isOpen: false, records: [] });
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar parcela:', error);
      showError('Erro ao atualizar parcela');
    }
  };

  const handleElectronicDataSubmit = (data: ElectronicData, authorizationId: string) => {
    setFormData(prev => ({
      ...prev,
      dados_ele: data,
      id_autorizacao: authorizationId
    }));
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
        sku_parcela: formData.sku_parcela || null
      };
      
      if (editingConta) {
        const originalRecord = editingConta;
        await contasPagarServiceExtended.update(editingConta.id, dataToSubmit);
        
        // Check if this is part of installments or recurrence and if changes should be replicated
        const updatedRecord = { ...originalRecord, ...dataToSubmit };
        
        // Check for installment replication
        if (originalRecord.eh_parcelado || (originalRecord.total_parcelas && originalRecord.total_parcelas > 1) || originalRecord.lancamento_pai_id) {
          const parentId = originalRecord.lancamento_pai_id || originalRecord.id;
          const allInstallments = contas.filter(c => 
            c.id === parentId || c.lancamento_pai_id === parentId
          );
          const futureInstallments = allInstallments.filter(c => 
            c.id !== originalRecord.id && (
              new Date(c.data_vencimento) > new Date(originalRecord.data_vencimento) ||
              (new Date(c.data_vencimento).getTime() === new Date(originalRecord.data_vencimento).getTime() && c.numero_parcela > originalRecord.numero_parcela)
            )
          );
          
          if (futureInstallments.length > 0) {
            setInstallmentReplicationModal({
              isOpen: true,
              originalRecord,
              updatedRecord,
              futureInstallments
            });
          }
        }
        
        // Check for recurrence replication
        if (originalRecord.eh_recorrente) {
          const parentId = originalRecord.lancamento_pai_id || originalRecord.id;
          const allRecurrences = contas.filter(c => 
            (c.id === parentId || c.lancamento_pai_id === parentId) && c.eh_recorrente
          );
          const futureRecurrences = allRecurrences.filter(c => 
            c.id !== originalRecord.id && 
            new Date(c.data_vencimento) >= new Date(originalRecord.data_vencimento)
          );
          
          if (futureRecurrences.length > 0) {
            setRecurrenceReplicationModal({
              isOpen: true,
              originalRecord,
              updatedRecord,
              futureRecords: futureRecurrences
            });
          }
        }
        
        showSuccess('Conta a pagar atualizada com sucesso');
      } else {
        await contasPagarServiceExtended.create(dataToSubmit);
        showSuccess('Conta a pagar criada com sucesso');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar conta a pagar:', error);
      showError('Erro ao salvar conta a pagar');
    }
  };

  // Calculate financial summary values
  const financialValues = {
    valor_operacao: parseFloat(formData.valor_operacao) || 0,
    valor_juros: parseFloat(formData.valor_juros) || 0,
    valor_multas: parseFloat(formData.valor_multas) || 0,
    valor_atualizacao: parseFloat(formData.valor_atualizacao) || 0,
    valor_descontos: parseFloat(formData.valor_descontos) || 0,
    valor_abto: parseFloat(formData.valor_abto) || 0,
    valor_pagto: parseFloat(formData.valor_pagto) || 0
  };

  const empresasOptions = empresas.map(emp => ({ value: emp.id, label: emp.nome }));
  const participantesOptions = participantes.filter(p => p.tipo === 'fornecedor' || p.tipo === 'ambos').map(part => ({ value: part.id, label: part.nome }));
  const categoriasOptions = categorias.filter(c => c.tipo === 'despesa' || c.tipo === 'ambos').map(cat => ({ value: cat.id, label: cat.nome }));
  const departamentosOptions = departamentos.map(dep => ({ value: dep.id, label: dep.nome }));
  const formasOptions = formasCobranca.map(forma => ({ value: forma.id, label: forma.nome }));
  const contasFinanceirasOptions = contasFinanceiras.map(conta => ({ value: conta.id, label: `${conta.codigo_conta} - ${conta.nome_conta}` }));
  const tiposDocumentosOptions = tiposDocumentos.map(tipo => ({ value: tipo.id, label: `${tipo.sigla_tipo} - ${tipo.nome_tipo}` }));

  // Check if a record is part of a series (installments or recurrence)
  const isPartOfSeries = (conta: ContaPagar) => {
    return conta.eh_parcelado || 
           (conta.total_parcelas && conta.total_parcelas > 1) || 
           conta.lancamento_pai_id || 
           conta.eh_recorrente;
  };

  // Enhanced columns with manage installments action
  const enhancedColumns = [
    ...columns,
    {
      key: 'actions' as keyof ContaPagar,
      header: 'Ações Especiais',
      render: (value: any, item: ContaPagar) => {
        if (isPartOfSeries(item)) {
          return (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleManageInstallments(item)}
              icon={Settings}
            >
              Gerenciar Parcelas
            </Button>
          );
        }
        return '-';
      }
    }
  ];

  return (
    <div>
      <DataTable
        data={contas}
        columns={enhancedColumns}
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
              options={participantesOptions}
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
              placeholder="Número do documento de origem"
            />
            
            <Input
              label="SKU da Parcela"
              value={formData.sku_parcela}
              onChange={(e) => setFormData({ ...formData, sku_parcela: e.target.value })}
              placeholder="SKU identificador da parcela"
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
          </div>
          
          <Input
            label="Descrição"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            required
          />

          {/* Financial Values Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Valores Financeiros</h3>
            <div className="grid grid-cols-2 gap-4">
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
                label="Valor da Parcela"
                type="number"
                value={formData.valor_parcela}
                onChange={(e) => setFormData({ ...formData, valor_parcela: e.target.value })}
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
            </div>
          </div>

          {/* Financial Summary */}
          <FinancialSummary 
            values={financialValues}
            isInstallment={formData.eh_parcelado}
            totalInstallments={parseInt(formData.total_parcelas) || 1}
            startDate={formData.data_vencimento}
            className="mt-4"
          />

          {/* Installment Section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
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
                  É Parcelado
                </label>
              </div>
              
              {formData.eh_parcelado && (
                <Input
                  label="Total de Parcelas"
                  type="number"
                  value={formData.total_parcelas}
                  onChange={(e) => setFormData({ ...formData, total_parcelas: e.target.value })}
                  min="2"
                  max="360"
                />
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="eh_vencto_fixo"
                  checked={formData.eh_vencto_fixo}
                  onChange={(e) => setFormData({ ...formData, eh_vencto_fixo: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="eh_vencto_fixo" className="text-sm font-medium text-gray-700">
                  Vencimento Fixo
                </label>
              </div>
              
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
            </div>
          </div>

          {/* Recurrence Section */}
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recorrência</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="eh_recorrente"
                  checked={formData.eh_recorrente}
                  onChange={(e) => setFormData({ ...formData, eh_recorrente: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="eh_recorrente" className="text-sm font-medium text-gray-700">
                  É Recorrente
                </label>
              </div>
              
              {formData.eh_recorrente && (
                <>
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
                  />
                  
                  <Input
                    label="Frequência"
                    type="number"
                    value={formData.frequencia_recorrencia}
                    onChange={(e) => setFormData({ ...formData, frequencia_recorrencia: e.target.value })}
                    min="1"
                    placeholder="Ex: 1 = todo mês, 2 = a cada 2 meses"
                  />
                  
                  <Input
                    label="Data de Início da Recorrência"
                    type="date"
                    value={formData.data_inicio_recorrencia}
                    onChange={(e) => setFormData({ ...formData, data_inicio_recorrencia: e.target.value })}
                  />
                  
                  <Input
                    label="Terminar Após (ocorrências)"
                    type="number"
                    value={formData.termino_apos_ocorrencias}
                    onChange={(e) => setFormData({ ...formData, termino_apos_ocorrencias: e.target.value })}
                    min="1"
                    placeholder="Deixe vazio para recorrência infinita"
                  />
                </>
              )}
            </div>
          </div>

          {/* TagInput Fields */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <TagInput
              label="Nº Documentos Referência"
              value={formData.n_doctos_ref}
              onChange={(tags) => setFormData({ ...formData, n_doctos_ref: tags })}
              placeholder="Digite um documento e pressione Enter"
              addButtonText="Adicionar"
            />
            
            <TagInput
              label="Projetos"
              value={formData.projetos}
              onChange={(tags) => setFormData({ ...formData, projetos: tags })}
              placeholder="Digite um projeto e pressione Enter"
              addButtonText="Adicionar"
            />
          </div>
          
          <div className="mb-4">
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

          {/* Electronic Data Button */}
          <div className="mb-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setElectronicDataModal({ isOpen: true, data: formData.dados_ele || null })}
            >
              Configurar Dados Eletrônicos
            </Button>
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

      <InstallmentManagementModal
        isOpen={installmentManagementModal.isOpen}
        onClose={() => setInstallmentManagementModal({ isOpen: false, records: [] })}
        onSave={handleInstallmentManagementSave}
        onInstallmentEdit={handleInstallmentEdit}
        records={installmentManagementModal.records}
        type="pagar"
        contasFinanceiras={contasFinanceiras}
        formasCobranca={formasCobranca}
        isRecurringSeries={Boolean(selectedRecordForModal?.eh_recorrente)}
        loading={false}
      />

      <ElectronicDataModal
        isOpen={electronicDataModal.isOpen}
        onClose={() => setElectronicDataModal({ isOpen: false, data: null })}
        onSubmit={handleElectronicDataSubmit}
        initialData={electronicDataModal.data}
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
          setInstallmentReplicationModal({ 
            isOpen: false, 
            originalRecord: null, 
            updatedRecord: null, 
            futureInstallments: [] 
          });
        }}
        originalRecord={installmentReplicationModal.originalRecord}
        updatedRecord={installmentReplicationModal.updatedRecord}
        futureInstallments={installmentReplicationModal.futureInstallments}
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
        onConfirm={async (selectedChanges) => {
          try {
            setLoading(true);
            
            if (!recurrenceReplicationModal.originalRecord || !recurrenceReplicationModal.updatedRecord) {
              showError('Dados do registro original não encontrados');
              return;
            }
            
            const originalRecord = recurrenceReplicationModal.originalRecord;
            const updatedRecord = recurrenceReplicationModal.updatedRecord;
            const futureRecords = recurrenceReplicationModal.futureRecords;
            
            // Filter future records to only open ones
            const futureOpenRecords = futureRecords.filter(record => {
              const status = record.status.toLowerCase();
              return status !== 'pago' && status !== 'recebido' && status !== 'cancelado';
            });
            
            if (futureOpenRecords.length === 0) {
              showError('Nenhum registro futuro em aberto para aplicar as alterações');
              return;
            }
            
            let updatedCount = 0;
            
            // Apply changes to each future open record
            for (const futureRecord of futureOpenRecords) {
              const updates: any = {};
              
              for (const change of selectedChanges) {
                if (change.field === 'data_vencimento' && change.newDayOfMonth !== undefined) {
                  // Apply new day of month to future record, preserving month and year
                  const currentDate = parseDateFromYYYYMMDD(futureRecord.data_vencimento);
                  const targetDay = change.newDayOfMonth;
                  
                  // Get the last day of the current month
                  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                  
                  // Use the target day or the last day of the month if target day doesn't exist
                  const finalDay = Math.min(targetDay, lastDayOfMonth);
                  
                  // Set the new day while preserving month and year
                  currentDate.setDate(finalDay);
                  updates.data_vencimento = formatDateToYYYYMMDD(currentDate);
                } else if (change.field === 'valor_parcela') {
                  // Keep valor_parcela and valor_operacao in sync
                  updates.valor_parcela = change.newValue;
                  updates.valor_operacao = change.newValue;
                } else {
                  // Handle all other fields generically
                  let value = change.newValue;
                  
                  // Convert empty strings to null for nullable fields
                  if (value === '' && (
                    change.field.includes('_id') || 
                    ['observacoes', 'n_docto_origem', 'sku_parcela', 'periodicidade', 'id_autorizacao'].includes(change.field)
                  )) {
                    value = null;
                  }
                  
                  // Convert string numbers to actual numbers for numeric fields
                  if (change.field.includes('valor_') || 
                      ['frequencia_recorrencia', 'termino_apos_ocorrencias', 'intervalo_ini', 'intervalo_rec'].includes(change.field)) {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      value = numValue;
                    }
                  }
                  
                  // Convert string booleans to actual booleans
                  if (change.field === 'eh_vencto_fixo' && typeof value === 'string') {
                    value = value === 'true';
                  }
                  
                  updates[change.field] = value;
                }
              }
              
              // Only update if there are actual changes
              if (Object.keys(updates).length > 0) {
                await contasPagarServiceExtended.update(futureRecord.id, updates);
                updatedCount++;
              }
            }
            
            if (updatedCount > 0) {
              showSuccess(`${selectedChanges.length} alteração(ões) aplicada(s) com sucesso a ${updatedCount} registro(s) recorrente(s) futuro(s)`);
            } else {
              showSuccess('Nenhuma alteração foi necessária - todos os registros já estão atualizados');
            }
            
            await loadData();
          } catch (error) {
            console.error('Erro ao replicar alterações:', error);
            showError(`Erro ao aplicar alterações aos registros recorrentes: ${(error as any)?.message || error}`);
          } finally {
            setLoading(false);
          }
          setRecurrenceReplicationModal({ 
            isOpen: false, 
            originalRecord: null, 
            updatedRecord: null, 
            futureRecords: [] 
          });
        }}
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
      
      {/* Replication Modals */}
      {isReplicationForRecurring ? (
        <RecurrenceReplicationModal
          isOpen={isReplicationModalOpen}
          onClose={() => setIsReplicationModalOpen(false)}
          onConfirm={handleConfirmRecurrenceReplication}
          originalRecord={originalRecordForReplication}
          updatedRecord={updatedRecordForReplication}
          futureRecords={futureRecordsForReplication}
          type="pagar"
          loading={false}
          empresas={empresas}
          participantes={participantes}
          categorias={categorias}
          departamentos={departamentos}
          formasCobranca={formasCobranca}
          contasFinanceiras={contasFinanceiras}
          tiposDocumentos={tiposDocumentos}
        />
      ) : (
        <InstallmentReplicationModal
          isOpen={isReplicationModalOpen}
          onClose={() => setIsReplicationModalOpen(false)}
          onConfirm={handleConfirmInstallmentReplication}
          originalRecord={originalRecordForReplication!}
          updatedRecord={updatedRecordForReplication!}
          futureInstallments={futureRecordsForReplication}
          type="pagar"
          loading={false}
        />
      )}
    </div>
  );
};

export default ContasPagarCRUD;