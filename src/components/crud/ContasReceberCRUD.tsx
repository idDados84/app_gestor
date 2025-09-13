import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import ElectronicDataModal from '../modals/ElectronicDataModal';
import MassCancellationModal from '../modals/MassCancellationModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { formatDateForInput } from '../../utils/dateUtils';
import { 
  contasReceberServiceExtended, 
  empresasService, 
  participantesService,
  categoriasService,
  departamentosService,
  formasCobrancaService,
  contasFinanceirasService,
  tiposDocumentosService
} from '../../services/database';
import type { 
  ContaReceber, 
  Empresa, 
  Participante, 
  Categoria, 
  Departamento, 
  FormaCobranca,
  ContaFinanceira,
  TipoDocumento,
  ElectronicData
} from '../../types/database';

interface ContasReceberCRUDProps {
  showError?: (message: string) => void;
  showSuccess?: (message: string) => void;
}

const ContasReceberCRUD: React.FC<ContasReceberCRUDProps> = ({ 
  showError: externalShowError, 
  showSuccess: externalShowSuccess 
}) => {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [clientes, setClientes] = useState<Participante[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [formasCobranca, setFormasCobranca] = useState<FormaCobranca[]>([]);
  const [contasFinanceiras, setContasFinanceiras] = useState<ContaFinanceira[]>([]);
  const [tiposDocumentos, setTiposDocumentos] = useState<TipoDocumento[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaReceber | null>(null);
  const [isElectronicDataModalOpen, setIsElectronicDataModalOpen] = useState(false);
  const [currentElectronicData, setCurrentElectronicData] = useState<ElectronicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: ContaReceber | null;
  }>({ isOpen: false, item: null });
  const [massCancellationModal, setMassCancellationModal] = useState<{
    isOpen: boolean;
    records: ContaReceber[];
    parentId: string | null;
  }>({ isOpen: false, records: [], parentId: null });
  const [massCancellationLoading, setMassCancellationLoading] = useState(false);
  const { showError: internalShowError, showSuccess: internalShowSuccess } = useToast();
  
  // Use external toast functions if provided, otherwise use internal ones
  const showError = externalShowError || internalShowError;
  const showSuccess = externalShowSuccess || internalShowSuccess;
  const [formData, setFormData] = useState({
    empresa_id: '',
    cliente_id: '',
    categoria_id: '',
    departamento_id: '',
    forma_cobranca_id: '',
    descricao: '',
    valor: '',
    status: 'pendente' as 'pendente' | 'recebido' | 'cancelado',
    data_vencimento: '',
    data_recebimento: '',
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
  });

  const columns = [
    {
      key: 'descricao' as keyof ContaReceber,
      header: 'Descrição',
      sortable: true
    },
    {
      key: 'empresas' as keyof ContaReceber,
      header: 'Empresa',
      render: (value: any) => value?.nome || '-'
    },
    {
      key: 'participantes' as keyof ContaReceber,
      header: 'Cliente',
      render: (value: any) => value?.nome || '-'
    },
    {
      key: 'valor' as keyof ContaReceber,
      header: 'Valor',
      render: (value: number) => `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
    },
    {
      key: 'status' as keyof ContaReceber,
      header: 'Status',
      render: (value: string) => {
        const statusColors = {
          pendente: 'bg-yellow-100 text-yellow-800',
          recebido: 'bg-green-100 text-green-800',
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
      key: 'data_vencimento' as keyof ContaReceber,
      header: 'Vencimento',
      render: (value: string) => {
        if (!value) return '-';
        // Parse YYYY-MM-DD format directly without timezone conversion
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('pt-BR');
      },
      sortable: true
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
        contasReceberServiceExtended.getAllWithRelations(),
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
      // Filtrar apenas clientes
      setClientes(participantesData.filter(p => p.tipo === 'cliente' || p.tipo === 'ambos'));
      setCategorias(categoriasData.filter(c => c.tipo === 'receita' || c.tipo === 'ambos'));
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
      cliente_id: '',
      categoria_id: '',
      departamento_id: '',
      forma_cobranca_id: '',
      descricao: '',
      valor: '',
      status: 'pendente',
      data_vencimento: '',
      data_recebimento: '',
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
    });
    setCurrentElectronicData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (conta: ContaReceber) => {
    setEditingConta(conta);
    setFormData({
      empresa_id: conta.empresa_id,
      cliente_id: conta.cliente_id,
      categoria_id: conta.categoria_id || '',
      departamento_id: conta.departamento_id || '',
      forma_cobranca_id: conta.forma_cobranca_id || '',
      descricao: conta.descricao,
      valor: conta.valor.toString(),
      status: conta.status,
      data_vencimento: conta.data_vencimento,
      data_recebimento: conta.data_recebimento || '',
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
    });
    setCurrentElectronicData(conta.dados_ele || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (conta: ContaReceber) => {
    try {
      const { canDelete, reason, requiresMassModal, parentId, relatedRecords } = 
        await contasReceberServiceExtended.canDelete(conta.id);
      
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
      await contasReceberServiceExtended.delete(confirmDialog.item.id);
      showSuccess('Conta a receber excluída com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      showError('Erro ao excluir conta a receber');
    }
  };

  const handleMassCancellation = async (selectedIds: string[]) => {
    if (selectedIds.length === 0) return;
    
    setMassCancellationLoading(true);
    try {
      await contasReceberServiceExtended.cancelRecords(selectedIds);
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
    try {
      const dataToSubmit = {
        ...formData,
        valor: parseFloat(formData.valor),
        categoria_id: formData.categoria_id || null,
        departamento_id: formData.departamento_id || null,
        forma_cobranca_id: formData.forma_cobranca_id || null,
        data_recebimento: formData.data_recebimento || null,
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
          // Always include boolean and number fields
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
          // Only exclude empty strings
          return value !== '';
        })
      );
      
      if (editingConta) {
        await contasReceberServiceExtended.update(editingConta.id, filteredData);
      } else {
        await contasReceberServiceExtended.create(filteredData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    }
  };

  const empresasOptions = empresas.map(emp => ({ value: emp.id, label: emp.nome }));
  const clientesOptions = clientes.map(cli => ({ value: cli.id, label: cli.nome }));
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
        title="Contas a Receber"
        addButtonText="Adicionar Conta a Receber"
        searchPlaceholder="Buscar contas a receber..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingConta ? 'Editar Conta a Receber' : 'Adicionar Conta a Receber'}
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
              label="Cliente"
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              options={clientesOptions}
              placeholder="Selecione um cliente"
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
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pendente' | 'recebido' | 'cancelado' })}
              options={[
                { value: 'pendente', label: 'Pendente' },
                { value: 'recebido', label: 'Recebido' },
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
              label="Data de Recebimento"
              type="date"
              value={formData.data_recebimento}
              onChange={(e) => setFormData({ ...formData, data_recebimento: e.target.value })}
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
      
      <MassCancellationModal
        isOpen={massCancellationModal.isOpen}
        onClose={() => setMassCancellationModal({ isOpen: false, records: [], parentId: null })}
        onConfirm={handleMassCancellation}
        records={massCancellationModal.records}
        type="receber"
        loading={massCancellationLoading}
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

export default ContasReceberCRUD;