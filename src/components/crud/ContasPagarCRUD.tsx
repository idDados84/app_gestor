import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import ElectronicDataModal from '../modals/ElectronicDataModal';
import MassCancellationModal from '../modals/MassCancellationModal';
import InstallmentManagementModal from '../modals/InstallmentManagementModal';
import InstallmentReplicationModal from '../modals/InstallmentReplicationModal';
import RecurrenceReplicationModal from '../modals/RecurrenceReplicationModal';
import ConfirmDialog from '../ui/ConfirmDialog';
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
  const [fornecedores, setFornecedores] = useState<Participante[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [formasCobranca, setFormasCobranca] = useState<FormaCobranca[]>([]);
  const [contasFinanceiras, setContasFinanceiras] = useState<ContaFinanceira[]>([]);
  const [tiposDocumentos, setTiposDocumentos] = useState<TipoDocumento[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaPagar | null>(null);
  const [isElectronicDataModalOpen, setIsElectronicDataModalOpen] = useState(false);
  const [currentElectronicData, setCurrentElectronicData] = useState<ElectronicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: ContaPagar | null;
  }>({ isOpen: false, item: null });
  const [massCancellationModal, setMassCancellationModal] = useState<{
    isOpen: boolean;
    records: ContaPagar[];
    parentId: string | null;
  }>({ isOpen: false, records: [], parentId: null });
  const [massCancellationLoading, setMassCancellationLoading] = useState(false);
  const [installmentModal, setInstallmentModal] = useState<{
    isOpen: boolean;
    records: ContaPagar[];
    parentId: string | null;
  }>({ isOpen: false, records: [], parentId: null });
  const [installmentLoading, setInstallmentLoading] = useState(false);
  const [recurrenceReplicationModal, setRecurrenceReplicationModal] = useState<{
    isOpen: boolean;
    originalRecord: ContaPagar | null;
    updatedRecord: ContaPagar | null;
    futureRecords: ContaPagar[];
  }>({ isOpen: false, originalRecord: null, updatedRecord: null, futureRecords: [] });
  const [recurrenceReplicationLoading, setRecurrenceReplicationLoading] = useState(false);
  const [installmentReplicationModal, setInstallmentReplicationModal] = useState<{
    isOpen: boolean;
    originalRecord: ContaPagar | null;
    updatedRecord: ContaPagar | null;
    futureInstallments: ContaPagar[];
  }>({ isOpen: false, originalRecord: null, updatedRecord: null, futureInstallments: [] });
  const [installmentReplicationLoading, setInstallmentReplicationLoading] = useState(false);
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
    valor: '',
    status: 'pendente' as 'pendente' | 'pago' | 'cancelado',
    data_vencimento: '',
    data_pagamento: '',
    observacoes: '',
    dados_ele: null as ElectronicData | null,
    id_autorizacao: '',
    eh_parcelado: false,
    total_parcelas: 1,
    numero_parcela: 1,
    lancamento_pai_id: '',
    eh_recorrente: false,
    periodicidade: 'mensal',
    frequencia_recorrencia: 1,
    data_inicio_recorrencia: '',
    termino_apos_ocorrencias: 0,
    n_docto_origem: '',
    sku_parcela: '',
    intervalo_ini: 0,
    intervalo_rec: 30,
    eh_vencto_fixo: false,
  });

  const columns = [
    {
      key: 'descricao' as keyof ContaPagar,
      header: 'Descrição',
      sortable: true
    },
    {
      key: 'numero_parcela' as keyof ContaPagar,
      header: 'Parcela/Recorrência',
      render: (value: number, item: ContaPagar) => {
        // Verifica se é recorrente
        if (item.eh_recorrente) {
          const periodicidade = item.periodicidade || 'mensal';
          const frequencia = item.frequencia_recorrencia || 1;
          const termino = item.termino_apos_ocorrencias;
          
          // Formatar periodicidade
          const periodoMap: Record<string, string> = {
            'diario': 'Diário',
            'semanal': 'Semanal', 
            'mensal': 'Mensal',
            'anual': 'Anual'
          };
          
          const periodoLabel = periodoMap[periodicidade] || periodicidade;
          
          // Calcular posição atual na sequência de recorrência
          let posicaoAtual = 1;
          if (item.lancamento_pai_id) {
            // Para ocorrências subsequentes, calcular posição baseada na data de vencimento
            // Assumindo que as datas seguem a periodicidade configurada
            const dataInicio = new Date(item.data_inicio_recorrencia || item.data_vencimento);
            const dataAtual = new Date(item.data_vencimento);
            
            // Calcular diferença em dias
            const diffTime = dataAtual.getTime() - dataInicio.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Calcular posição baseada na periodicidade
            switch (periodicidade) {
              case 'diario':
                posicaoAtual = Math.floor(diffDays / (item.frequencia_recorrencia || 1)) + 1;
                break;
              case 'semanal':
                posicaoAtual = Math.floor(diffDays / (7 * (item.frequencia_recorrencia || 1))) + 1;
                break;
              case 'mensal':
                // Para mensal, usar diferença de meses
                const mesesDiff = (dataAtual.getFullYear() - dataInicio.getFullYear()) * 12 + 
                                 (dataAtual.getMonth() - dataInicio.getMonth());
                posicaoAtual = Math.floor(mesesDiff / (item.frequencia_recorrencia || 1)) + 1;
                break;
              case 'anual':
                const anosDiff = dataAtual.getFullYear() - dataInicio.getFullYear();
                posicaoAtual = Math.floor(anosDiff / (item.frequencia_recorrencia || 1)) + 1;
                break;
            }
          }
          
          const terminoLabel = termino ? `/${posicaoAtual}-${termino}` : `/${posicaoAtual}-∞`;
          
          return `${periodoLabel}${terminoLabel}`;
        }
        
        // Verifica se é parte de uma série de parcelas
        const isPartOfSeries = item.eh_parcelado || item.lancamento_pai_id || item.total_parcelas > 1;
        if (!isPartOfSeries) return '-';
        
        const parcela = value || 1;
        const total = item.total_parcelas || 1;
        return `${parcela}/${total}`;
      }
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
      key: 'valor' as keyof ContaPagar,
      header: 'Valor',
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
      render: (value: string) => {
        if (!value) return '-';
        // Parse YYYY-MM-DD format directly without timezone conversion
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('pt-BR');
      },
      sortable: true
    },
    {
      key: 'special_actions' as keyof ContaPagar,
      header: 'Gerenciamento',
      render: (value: any, item: ContaPagar) => {
        // Verifica se é recorrente
        if (item.eh_recorrente) {
          return (
            <button
              onClick={() => handleRecurrenceManagement(item)}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              title="Gerenciar Recorrência"
            >
              Gerenciar Recorrência
            </button>
          );
        }
        
        // Verifica se é parte de uma série de parcelas
        const isInstallment = item.eh_parcelado || item.lancamento_pai_id || item.total_parcelas > 1;
        if (!isInstallment) return '-';
        
        return (
          <button
            onClick={() => handleInstallmentManagement(item)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            title="Gerenciar Parcelas"
          >
            Gerenciar Parcelas
          </button>
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
      // Filtrar apenas fornecedores
      setFornecedores(participantesData.filter(p => p.tipo === 'fornecedor' || p.tipo === 'ambos'));
      setCategorias(categoriasData.filter(c => c.tipo === 'despesa' || c.tipo === 'ambos'));
      setDepartamentos(departamentosData);
      setFormasCobranca(formasData);
      setContasFinanceiras(contasFinanceirasData);
      setTiposDocumentos(tiposDocumentosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
      valor: '',
      status: 'pendente',
      data_vencimento: '',
      data_pagamento: '',
      observacoes: '',
      dados_ele: null,
      id_autorizacao: '',
      eh_parcelado: false,
      total_parcelas: 1,
      numero_parcela: 1,
      lancamento_pai_id: '',
      eh_recorrente: false,
      periodicidade: 'mensal',
      frequencia_recorrencia: 1,
      data_inicio_recorrencia: '',
      termino_apos_ocorrencias: 0,
      n_docto_origem: '',
      sku_parcela: '',
      intervalo_ini: 0,
      intervalo_rec: 30,
      eh_vencto_fixo: false,
    });
    setCurrentElectronicData(null);
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
      valor: (conta.valor ?? 0).toString(),
      status: conta.status,
      data_vencimento: conta.data_vencimento,
      data_pagamento: conta.data_pagamento || '',
      observacoes: conta.observacoes || '',
      dados_ele: conta.dados_ele || null,
      id_autorizacao: conta.id_autorizacao || '',
      eh_parcelado: conta.eh_parcelado || false,
      total_parcelas: conta.total_parcelas || 1,
      numero_parcela: conta.numero_parcela || 1,
      lancamento_pai_id: conta.lancamento_pai_id || '',
      eh_recorrente: conta.eh_recorrente || false,
      periodicidade: conta.periodicidade || 'mensal',
      frequencia_recorrencia: conta.frequencia_recorrencia || 1,
      data_inicio_recorrencia: formatDateForInput(conta.data_inicio_recorrencia),
      termino_apos_ocorrencias: conta.termino_apos_ocorrencias || 0,
      n_docto_origem: conta.n_docto_origem || '',
      sku_parcela: conta.sku_parcela || '',
      intervalo_ini: conta.intervalo_ini || 0,
      intervalo_rec: conta.intervalo_rec || 30,
      eh_vencto_fixo: conta.eh_vencto_fixo || false,
    });
    setCurrentElectronicData(conta.dados_ele || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (conta: ContaPagar) => {
    try {
      const { canDelete, reason, requiresMassModal, parentId, relatedRecords } = 
        await contasPagarServiceExtended.canDelete(conta.id);
      
      if (!canDelete) {
        if (requiresMassModal && relatedRecords && parentId) {
          // Open mass cancellation modal
          setMassCancellationModal({
            isOpen: true,
            records: relatedRecords,
            parentId
          });
        } else {
          showError(reason || 'Não é possível excluir este registro');
        }
        return;
      }
      
      // Simple record - show normal confirmation dialog
      setConfirmDialog({ isOpen: true, item: conta });
    } catch (error) {
      console.error('Erro ao verificar se pode excluir:', error);
      showError('Erro ao verificar permissões de exclusão');
      return;
    }
  };

  const confirmDelete = async () => {
    if (!confirmDialog.item) return;
    
    try {
      await contasPagarServiceExtended.delete(confirmDialog.item.id);
      showSuccess('Conta a pagar excluída com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      showError('Erro ao excluir conta a pagar');
    }
  };

  const handleInstallmentManagement = async (conta: ContaPagar) => {
    try {
      // Find all related installments
      const parentId = conta.lancamento_pai_id || conta.id;
      
      // Get all installments from the same series
      const allContas = await contasPagarServiceExtended.getAllWithRelations();
      const relatedRecords = allContas.filter(c => 
        c.id === parentId || c.lancamento_pai_id === parentId
      ).sort((a, b) => {
        const aNum = a.numero_parcela || 1;
        const bNum = b.numero_parcela || 1;
        return aNum - bNum;
      });
      
      if (relatedRecords.length === 0) {
        showError('Nenhuma parcela encontrada para gerenciar');
        return;
      }
      
      setInstallmentModal({
        isOpen: true,
        records: relatedRecords,
        parentId
      });
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error);
      showError('Erro ao carregar parcelas para gerenciamento');
    }
  };

  const handleRecurrenceManagement = async (conta: ContaPagar) => {
    try {
      // Find all related recurrence records
      const parentId = conta.lancamento_pai_id || conta.id;
      
      // Get all recurrence records from the same series
      const allContas = await contasPagarServiceExtended.getAllWithRelations();
      const relatedRecords = allContas.filter(c => 
        (c.id === parentId || c.lancamento_pai_id === parentId) && c.eh_recorrente
      ).sort((a, b) => {
        const aDate = new Date(a.data_vencimento);
        const bDate = new Date(b.data_vencimento);
        return aDate.getTime() - bDate.getTime();
      });
      
      if (relatedRecords.length === 0) {
        showError('Nenhum registro de recorrência encontrado para gerenciar');
        return;
      }
      
      // For now, use the same modal but with different context
      // In the future, this could be a specialized recurrence modal
      setMassCancellationModal({
        isOpen: true,
        records: relatedRecords,
        parentId
      });
    } catch (error) {
      console.error('Erro ao carregar registros de recorrência:', error);
      showError('Erro ao carregar registros de recorrência para gerenciamento');
    }
  };
  const handleInstallmentSave = async (installments: any[]) => {
    if (installments.length === 0) return;
    
    setInstallmentLoading(true);
    try {
      // Update each installment
      for (const installment of installments) {
        const updateData = {
          sku_parcela: installment.skuParcela,
          data_vencimento: installment.dueDate,
          forma_cobranca_id: installment.collectionMethodId || null,
          conta_cobranca_id: installment.collectionAccountId || null,
          valor: installment.amount
        };
        
        await contasPagarServiceExtended.update(installment.id, updateData);
      }
      
      showSuccess(`${installments.length} parcela(s) atualizada(s) com sucesso`);
      setInstallmentModal({ isOpen: false, records: [], parentId: null });
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar parcelas:', error);
      showError('Erro ao salvar alterações das parcelas');
    } finally {
      setInstallmentLoading(false);
    }
  };

  const handleMassCancellation = async (selectedIds: string[]) => {
    if (selectedIds.length === 0) return;
    
    setMassCancellationLoading(true);
    try {
      await contasPagarServiceExtended.cancelRecords(selectedIds);
      showSuccess(`${selectedIds.length} registro(s) cancelado(s) com sucesso`);
      setMassCancellationModal({ isOpen: false, records: [], parentId: null });
      await loadData();
    } catch (error) {
      console.error('Erro ao cancelar registros:', error);
      showError('Erro ao cancelar registros em massa');
    } finally {
      setMassCancellationLoading(false);
    }
  };

  const handleElectronicDataSubmit = (data: ElectronicData, authorizationId: string) => {
    setFormData(prev => ({
      ...prev,
      dados_ele: data,
      id_autorizacao: authorizationId
    }));
    setCurrentElectronicData(data);
    setIsElectronicDataModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store original record for comparison if editing a recurrent record
    const originalRecord = editingConta;
    
    try {
      const dataToSubmit = {
        ...formData,
        valor: parseFloat(formData.valor),
        categoria_id: formData.categoria_id || null,
        departamento_id: formData.departamento_id || null,
        forma_cobranca_id: formData.forma_cobranca_id || null,
        data_pagamento: formData.data_pagamento || null,
        dados_ele: formData.dados_ele,
        id_autorizacao: formData.id_autorizacao || null,
        eh_parcelado: formData.eh_parcelado,
        total_parcelas: formData.eh_parcelado ? formData.total_parcelas : null,
        numero_parcela: formData.eh_parcelado ? formData.numero_parcela : null,
        lancamento_pai_id: formData.lancamento_pai_id || null,
        eh_recorrente: formData.eh_recorrente,
        periodicidade: formData.eh_recorrente ? formData.periodicidade : null,
        frequencia_recorrencia: formData.eh_recorrente ? formData.frequencia_recorrencia : null,
        data_inicio_recorrencia: formData.eh_recorrente ? (formData.data_inicio_recorrencia || null) : null,
        termino_apos_ocorrencias: formData.eh_recorrente ? formData.termino_apos_ocorrencias : null,
      };
      
      // Filter out properties with empty string values, but preserve null values and boolean/number fields
      const filteredData = Object.fromEntries(
        Object.entries(dataToSubmit).filter(([key, value]) => {
          // Always include boolean and number fields (including 0 and 1)
          if (typeof value === 'boolean' || typeof value === 'number') {
            return true;
          }
          // Include null values (they're valid for optional fields)
          if (value === null) {
            return true;
          }
          // Include objects (like dados_ele)
          if (typeof value === 'object' && value !== null) {
            return true;
          }
          // Only exclude empty strings and undefined values
          return value !== '' && value !== undefined;
        })
      );
      
      if (editingConta) {
        const updatedRecord = await contasPagarServiceExtended.update(editingConta.id, filteredData);
        
        // Check if this is a recurrent record and if we should show recurrence replication modal
        if (originalRecord?.eh_recorrente && updatedRecord) {
          await checkForRecurrenceReplication(originalRecord, updatedRecord);
        }
        // Check if this is an installment record and if we should show installment replication modal
        else if ((originalRecord?.eh_parcelado || originalRecord?.lancamento_pai_id || originalRecord?.total_parcelas > 1) && updatedRecord) {
          await checkForInstallmentReplication(originalRecord, updatedRecord);
        }
      } else {
        await contasPagarServiceExtended.create(filteredData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    }
  };

  const checkForRecurrenceReplication = async (originalRecord: ContaPagar, updatedRecord: ContaPagar) => {
    try {
      // Find all future recurrent records from the same series
      const parentId = originalRecord.lancamento_pai_id || originalRecord.id;
      const allContas = await contasPagarServiceExtended.getAllWithRelations();
      
      const futureRecords = allContas.filter(c => {
        // Same series
        const isSameSeries = c.id === parentId || c.lancamento_pai_id === parentId;
        // Is recurrent
        const isRecurrent = c.eh_recorrente;
        // Is future (after current record)
        const isFuture = new Date(c.data_vencimento) > new Date(updatedRecord.data_vencimento);
        // Is open (not processed)
        const isOpen = c.status.toLowerCase() !== 'pago' && c.status.toLowerCase() !== 'cancelado';
        
        return isSameSeries && isRecurrent && isFuture && isOpen;
      }).sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
      
      // Only show modal if there are future records and there are actual changes
      if (futureRecords.length > 0 && hasSignificantChanges(originalRecord, updatedRecord)) {
        setRecurrenceReplicationModal({
          isOpen: true,
          originalRecord,
          updatedRecord,
          futureRecords
        });
      }
    } catch (error) {
      console.error('Erro ao verificar replicação de recorrência:', error);
    }
  };

  const checkForInstallmentReplication = async (originalRecord: ContaPagar, updatedRecord: ContaPagar) => {
    try {
      // Find all future installments from the same series
      const parentId = originalRecord.lancamento_pai_id || originalRecord.id;
      const allContas = await contasPagarServiceExtended.getAllWithRelations();
      
      const futureInstallments = allContas.filter(c => {
        // Same series
        const isSameSeries = c.id === parentId || c.lancamento_pai_id === parentId;
        // Is installment (not recurrent)
        const isInstallment = !c.eh_recorrente && (c.eh_parcelado || c.lancamento_pai_id || c.total_parcelas > 1);
        // Is future (higher installment number)
        const currentInstallmentNum = updatedRecord.numero_parcela || 1;
        const thisInstallmentNum = c.numero_parcela || 1;
        const isFuture = thisInstallmentNum > currentInstallmentNum;
        // Is open (not processed)
        const isOpen = c.status.toLowerCase() !== 'pago' && c.status.toLowerCase() !== 'cancelado';
        
        return isSameSeries && isInstallment && isFuture && isOpen;
      }).sort((a, b) => (a.numero_parcela || 1) - (b.numero_parcela || 1));
      
      // Only show modal if there are future installments and there are actual changes
      if (futureInstallments.length > 0 && hasSignificantChanges(originalRecord, updatedRecord)) {
        setInstallmentReplicationModal({
          isOpen: true,
          originalRecord,
          updatedRecord,
          futureInstallments
        });
      }
    } catch (error) {
      console.error('Erro ao verificar replicação de parcelas:', error);
    }
  };

  const hasSignificantChanges = (original: ContaPagar, updated: ContaPagar): boolean => {
    return (
      original.data_vencimento !== updated.data_vencimento ||
      original.valor !== updated.valor ||
      original.descricao !== updated.descricao ||
      original.categoria_id !== updated.categoria_id ||
      original.observacoes !== updated.observacoes ||
      original.forma_cobranca_id !== updated.forma_cobranca_id ||
      original.conta_cobranca_id !== updated.conta_cobranca_id
    );
  };

  const handleRecurrenceReplication = async (selectedChanges: any[]) => {
    if (selectedChanges.length === 0 || !recurrenceReplicationModal.futureRecords.length) return;
    
    setRecurrenceReplicationLoading(true);
    try {
      const { originalRecord, updatedRecord, futureRecords } = recurrenceReplicationModal;
      
      for (const futureRecord of futureRecords) {
        const updates: any = {};
        
        for (const change of selectedChanges) {
          switch (change.field) {
            case 'data_vencimento':
              // Maintain recurrence pattern but update the day
              const originalDate = new Date(originalRecord!.data_vencimento);
              const updatedDate = new Date(updatedRecord!.data_vencimento);
              const futureDate = new Date(futureRecord.data_vencimento);
              
              // Update day while maintaining month/year progression
              futureDate.setDate(updatedDate.getDate());
              updates.data_vencimento = futureDate.toISOString().split('T')[0];
              break;
              
            case 'valor':
              updates.valor = updatedRecord!.valor;
              break;
              
            case 'descricao':
              updates.descricao = updatedRecord!.descricao;
              break;
              
            case 'categoria_id':
              updates.categoria_id = updatedRecord!.categoria_id;
              break;
              
            case 'observacoes':
              updates.observacoes = updatedRecord!.observacoes;
              break;
          }
        }
        
        if (Object.keys(updates).length > 0) {
          await contasPagarServiceExtended.update(futureRecord.id, updates);
        }
      }
      
      showSuccess(`Alterações aplicadas a ${futureRecords.length} registro(s) recorrente(s) futuro(s)`);
      setRecurrenceReplicationModal({ isOpen: false, originalRecord: null, updatedRecord: null, futureRecords: [] });
      await loadData();
    } catch (error) {
      console.error('Erro ao replicar alterações:', error);
      showError('Erro ao aplicar alterações aos registros recorrentes');
    } finally {
      setRecurrenceReplicationLoading(false);
    }
  };

  const handleInstallmentReplication = async (selectedChanges: any[]) => {
    if (selectedChanges.length === 0 || !installmentReplicationModal.futureInstallments.length) return;
    
    setInstallmentReplicationLoading(true);
    try {
      const { originalRecord, updatedRecord, futureInstallments } = installmentReplicationModal;
      
      for (const futureInstallment of futureInstallments) {
        const updates: any = {};
        
        for (const change of selectedChanges) {
          switch (change.field) {
            case 'data_vencimento':
              // Maintain installment pattern but update the day
              const originalDate = new Date(originalRecord!.data_vencimento);
              const updatedDate = new Date(updatedRecord!.data_vencimento);
              const futureDate = new Date(futureInstallment.data_vencimento);
              
              // Calculate day difference and apply to future installment
              const dayDifference = updatedDate.getDate() - originalDate.getDate();
              futureDate.setDate(futureDate.getDate() + dayDifference);
              updates.data_vencimento = futureDate.toISOString().split('T')[0];
              break;
              
            case 'valor':
              updates.valor = updatedRecord!.valor;
              break;
              
            case 'descricao':
              updates.descricao = updatedRecord!.descricao;
              break;
              
            case 'categoria_id':
              updates.categoria_id = updatedRecord!.categoria_id;
              break;
              
            case 'observacoes':
              updates.observacoes = updatedRecord!.observacoes;
              break;
              
            case 'forma_cobranca_id':
              updates.forma_cobranca_id = updatedRecord!.forma_cobranca_id;
              break;
              
            case 'conta_cobranca_id':
              updates.conta_cobranca_id = updatedRecord!.conta_cobranca_id;
              break;
          }
        }
        
        if (Object.keys(updates).length > 0) {
          await contasPagarServiceExtended.update(futureInstallment.id, updates);
        }
      }
      
      showSuccess(`Alterações aplicadas a ${futureInstallments.length} parcela(s) futura(s)`);
      setInstallmentReplicationModal({ isOpen: false, originalRecord: null, updatedRecord: null, futureInstallments: [] });
      await loadData();
    } catch (error) {
      console.error('Erro ao replicar alterações nas parcelas:', error);
      showError('Erro ao aplicar alterações às parcelas futuras');
    } finally {
      setInstallmentReplicationLoading(false);
    }
  };

  const empresasOptions = empresas.map(emp => ({ value: emp.id, label: emp.nome }));
  const fornecedoresOptions = fornecedores.map(forn => ({ value: forn.id, label: forn.nome }));
  const categoriasOptions = categorias.map(cat => ({ value: cat.id, label: cat.nome }));
  const departamentosOptions = departamentos.map(dep => ({ value: dep.id, label: dep.nome }));
  const formasOptions = formasCobranca.map(forma => ({ value: forma.id, label: forma.nome }));
  const contasFinanceirasOptions = contasFinanceiras.map(conta => ({ 
    value: conta.id, 
    label: `${conta.codigo_conta || conta.nome_conta} - ${conta.nome_conta}` 
  }));
  const tiposDocumentosOptions = tiposDocumentos.map(tipo => ({ 
    value: tipo.id, 
    label: `${tipo.codigo_tipo} - ${tipo.nome_tipo}` 
  }));

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
        size="lg"
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
              label="Valor"
              type="number"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              required
              step="0.01"
              min="0"
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
            
            <Input
              label="Nº Documento Origem"
              value={formData.n_docto_origem}
              onChange={(e) => setFormData({ ...formData, n_docto_origem: e.target.value })}
              placeholder="Ex: 12345"
            />
            
            <Input
              label="SKU da Parcela"
              value={formData.sku_parcela}
              onChange={(e) => setFormData({ ...formData, sku_parcela: e.target.value })}
              placeholder="Auto-gerado"
              disabled
            />
            
            <Input
              label="Intervalo Inicial (dias)"
              type="number"
              value={formData.intervalo_ini.toString()}
              onChange={(e) => setFormData({ ...formData, intervalo_ini: parseInt(e.target.value) || 0 })}
              min="0"
            />
            
            <Input
              label="Intervalo Recorrente (dias)"
              type="number"
              value={formData.intervalo_rec.toString()}
              onChange={(e) => setFormData({ ...formData, intervalo_rec: parseInt(e.target.value) || 30 })}
              min="1"
            />
            
            <div className="col-span-2">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setIsElectronicDataModalOpen(true)}
                className="w-full"
              >
                {formData.dados_ele ? 'Editar Dados Eletrônicos' : 'Adicionar Dados Eletrônicos'}
              </Button>
              {formData.dados_ele && (
                <p className="text-sm text-gray-600 mt-2">
                  Dados Eletrônicos: {formData.dados_ele.tipoIntegracao} - {formData.dados_ele.numeroAutorizacao}
                </p>
              )}
            </div>
            
            <div className="col-span-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600"
                  checked={formData.eh_parcelado}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    eh_parcelado: e.target.checked, 
                    eh_recorrente: e.target.checked ? false : formData.eh_recorrente 
                  })}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">É Parcelado?</span>
              </label>
            </div>
            
            {formData.eh_parcelado && (
              <Input
                label="Total de Parcelas"
                type="number"
                value={formData.total_parcelas.toString()}
                onChange={(e) => setFormData({ ...formData, total_parcelas: parseInt(e.target.value) || 1 })}
                min="1"
                required
              />
            )}
            
            <div className="col-span-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600"
                  checked={formData.eh_vencto_fixo}
                  onChange={(e) => setFormData({ ...formData, eh_vencto_fixo: e.target.checked })}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Vencimento Fixo?</span>
              </label>
            </div>
            
            <div className="col-span-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600"
                  checked={formData.eh_recorrente}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    eh_recorrente: e.target.checked, 
                    eh_parcelado: e.target.checked ? false : formData.eh_parcelado 
                  })}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">É Recorrente?</span>
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
                    { value: 'anual', label: 'Anual' },
                  ]}
                  required
                />
                <Input
                  label="Frequência (a cada X)"
                  type="number"
                  value={formData.frequencia_recorrencia.toString()}
                  onChange={(e) => setFormData({ ...formData, frequencia_recorrencia: parseInt(e.target.value) || 1 })}
                  min="1"
                  required
                />
                <Input
                  label="Data Início Recorrência"
                  type="date"
                  value={formData.data_inicio_recorrencia}
                  onChange={(e) => setFormData({ ...formData, data_inicio_recorrencia: e.target.value })}
                  required
                />
                <Input
                  label="Término após (ocorrências)"
                  type="number"
                  value={formData.termino_apos_ocorrencias.toString()}
                  onChange={(e) => setFormData({ ...formData, termino_apos_ocorrencias: parseInt(e.target.value) || 0 })}
                  min="1"
                  required
                />
              </>
            )}
          </div>
          
          <Input
            label="Descrição"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            required
          />
          
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
      
      <ElectronicDataModal
        isOpen={isElectronicDataModalOpen}
        onClose={() => setIsElectronicDataModalOpen(false)}
        onSubmit={handleElectronicDataSubmit}
        initialData={currentElectronicData}
      />
      
      <InstallmentManagementModal
        isOpen={installmentModal.isOpen}
        onClose={() => setInstallmentModal({ isOpen: false, records: [], parentId: null })}
        onSave={handleInstallmentSave}
        records={installmentModal.records}
        type="pagar"
        contasFinanceiras={contasFinanceiras}
        formasCobranca={formasCobranca}
        loading={installmentLoading}
      />
      
      <MassCancellationModal
        isOpen={massCancellationModal.isOpen}
        onClose={() => setMassCancellationModal({ isOpen: false, records: [], parentId: null })}
        onConfirm={handleMassCancellation}
        records={massCancellationModal.records}
        type="pagar"
        loading={massCancellationLoading}
      />
      
      <RecurrenceReplicationModal
        isOpen={recurrenceReplicationModal.isOpen}
        onClose={() => setRecurrenceReplicationModal({ isOpen: false, originalRecord: null, updatedRecord: null, futureRecords: [] })}
        onConfirm={handleRecurrenceReplication}
        originalRecord={recurrenceReplicationModal.originalRecord!}
        updatedRecord={recurrenceReplicationModal.updatedRecord!}
        futureRecords={recurrenceReplicationModal.futureRecords}
        type="pagar"
        loading={recurrenceReplicationLoading}
      />
      
      <InstallmentReplicationModal
        isOpen={installmentReplicationModal.isOpen}
        onClose={() => setInstallmentReplicationModal({ isOpen: false, originalRecord: null, updatedRecord: null, futureInstallments: [] })}
        onConfirm={handleInstallmentReplication}
        originalRecord={installmentReplicationModal.originalRecord!}
        updatedRecord={installmentReplicationModal.updatedRecord!}
        futureInstallments={installmentReplicationModal.futureInstallments}
        type="pagar"
        loading={installmentReplicationLoading}
      />
      
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
    </div>
  );
};

export default ContasPagarCRUD;