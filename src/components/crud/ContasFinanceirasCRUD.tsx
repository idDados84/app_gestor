import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { contasFinanceirasService } from '../../services/database';
import type { ContaFinanceira } from '../../types/database';

interface ContasFinanceirasCRUDProps {
  showError?: (message: string) => void;
  showSuccess?: (message: string) => void;
}

const ContasFinanceirasCRUD: React.FC<ContasFinanceirasCRUDProps> = ({ 
  showError: externalShowError, 
  showSuccess: externalShowSuccess 
}) => {
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaFinanceira | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: ContaFinanceira | null;
  }>({ isOpen: false, item: null });
  const { showError: internalShowError, showSuccess: internalShowSuccess } = useToast();
  
  // Use external toast functions if provided, otherwise use internal ones
  const showError = externalShowError || internalShowError;
  const showSuccess = externalShowSuccess || internalShowSuccess;
  
  const [formData, setFormData] = useState({
    codigo_conta: '',
    nome_conta: '',
    tipo_conta: 'BANCO' as 'BANCO' | 'CAIXA' | 'POUPANCA' | 'INVESTIMENTO',
    banco_codigo: '',
    agencia: '',
    conta_numero: '',
    saldo_inicial: '',
    saldo_atual: '',
    ativo: true
  });

  const columns = [
    {
      key: 'codigo_conta' as keyof ContaFinanceira,
      header: 'Código',
      sortable: true
    },
    {
      key: 'nome_conta' as keyof ContaFinanceira,
      header: 'Nome da Conta',
      sortable: true
    },
    {
      key: 'tipo_conta' as keyof ContaFinanceira,
      header: 'Tipo',
      render: (value: string) => {
        const tipoColors = {
          BANCO: 'bg-blue-100 text-blue-800',
          CAIXA: 'bg-green-100 text-green-800',
          POUPANCA: 'bg-purple-100 text-purple-800',
          INVESTIMENTO: 'bg-yellow-100 text-yellow-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${tipoColors[value as keyof typeof tipoColors]}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'banco_codigo' as keyof ContaFinanceira,
      header: 'Banco'
    },
    {
      key: 'saldo_atual' as keyof ContaFinanceira,
      header: 'Saldo Atual',
      render: (value: number) => `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
    },
    {
      key: 'ativo' as keyof ContaFinanceira,
      header: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Ativo' : 'Inativo'}
        </span>
      )
    }
  ];

  useEffect(() => {
    loadContas();
  }, []);

  const loadContas = async () => {
    try {
      const data = await contasFinanceirasService.getAll();
      setContas(data);
    } catch (error) {
      console.error('Erro ao carregar contas financeiras:', error);
      showError('Erro ao carregar contas financeiras');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingConta(null);
    setFormData({
      codigo_conta: '',
      nome_conta: '',
      tipo_conta: 'BANCO',
      banco_codigo: '',
      agencia: '',
      conta_numero: '',
      saldo_inicial: '',
      saldo_atual: '',
      ativo: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (conta: ContaFinanceira) => {
    setEditingConta(conta);
    setFormData({
      codigo_conta: conta.codigo_conta || '',
      nome_conta: conta.nome_conta,
      tipo_conta: conta.tipo_conta,
      banco_codigo: conta.banco_codigo || '',
      agencia: conta.agencia || '',
      conta_numero: conta.conta_numero || '',
      saldo_inicial: conta.saldo_inicial.toString(),
      saldo_atual: conta.saldo_atual.toString(),
      ativo: conta.ativo
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (conta: ContaFinanceira) => {
    setConfirmDialog({ isOpen: true, item: conta });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.item) return;
    
    try {
      await contasFinanceirasService.delete(confirmDialog.item.id);
      showSuccess('Conta financeira excluída com sucesso');
      await loadContas();
    } catch (error) {
      console.error('Erro ao excluir conta financeira:', error);
      showError('Erro ao excluir conta financeira');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        saldo_inicial: parseFloat(formData.saldo_inicial) || 0,
        saldo_atual: parseFloat(formData.saldo_atual) || 0,
        codigo_conta: formData.codigo_conta || null,
        banco_codigo: formData.banco_codigo || null,
        agencia: formData.agencia || null,
        conta_numero: formData.conta_numero || null
      };
      
      if (editingConta) {
        await contasFinanceirasService.update(editingConta.id, dataToSubmit);
        showSuccess('Conta financeira atualizada com sucesso');
      } else {
        await contasFinanceirasService.create(dataToSubmit);
        showSuccess('Conta financeira criada com sucesso');
      }
      setIsModalOpen(false);
      await loadContas();
    } catch (error) {
      console.error('Erro ao salvar conta financeira:', error);
      showError('Erro ao salvar conta financeira');
    }
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
        title="Contas Financeiras"
        addButtonText="Adicionar Conta Financeira"
        searchPlaceholder="Buscar contas financeiras..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingConta ? 'Editar Conta Financeira' : 'Adicionar Conta Financeira'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código da Conta"
              value={formData.codigo_conta}
              onChange={(e) => setFormData({ ...formData, codigo_conta: e.target.value })}
              placeholder="001-001"
            />
            
            <Select
              label="Tipo de Conta"
              value={formData.tipo_conta}
              onChange={(e) => setFormData({ ...formData, tipo_conta: e.target.value as 'BANCO' | 'CAIXA' | 'POUPANCA' | 'INVESTIMENTO' })}
              options={[
                { value: 'BANCO', label: 'Banco' },
                { value: 'CAIXA', label: 'Caixa' },
                { value: 'POUPANCA', label: 'Poupança' },
                { value: 'INVESTIMENTO', label: 'Investimento' }
              ]}
              required
            />
            
            <Input
              label="Código do Banco"
              value={formData.banco_codigo}
              onChange={(e) => setFormData({ ...formData, banco_codigo: e.target.value })}
              placeholder="001"
            />
            
            <Input
              label="Agência"
              value={formData.agencia}
              onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
              placeholder="1234-5"
            />
            
            <Input
              label="Número da Conta"
              value={formData.conta_numero}
              onChange={(e) => setFormData({ ...formData, conta_numero: e.target.value })}
              placeholder="12345-6"
            />
            
            <Select
              label="Status"
              value={formData.ativo.toString()}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
              options={[
                { value: 'true', label: 'Ativo' },
                { value: 'false', label: 'Inativo' }
              ]}
            />
            
            <Input
              label="Saldo Inicial"
              type="number"
              value={formData.saldo_inicial}
              onChange={(e) => setFormData({ ...formData, saldo_inicial: e.target.value })}
              step="0.01"
              min="0"
            />
            
            <Input
              label="Saldo Atual"
              type="number"
              value={formData.saldo_atual}
              onChange={(e) => setFormData({ ...formData, saldo_atual: e.target.value })}
              step="0.01"
              min="0"
            />
          </div>
          
          <Input
            label="Nome da Conta"
            value={formData.nome_conta}
            onChange={(e) => setFormData({ ...formData, nome_conta: e.target.value })}
            required
          />
          
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
        message={`Tem certeza que deseja excluir a conta "${confirmDialog.item?.nome_conta}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ContasFinanceirasCRUD;