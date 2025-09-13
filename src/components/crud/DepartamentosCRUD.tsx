import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { departamentosServiceExtended, empresasService } from '../../services/database';
import { formatDateForDisplay } from '../../utils/dateUtils';
import type { Departamento, Empresa } from '../../types/database';

const DepartamentosCRUD: React.FC = () => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartamento, setEditingDepartamento] = useState<Departamento | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: Departamento | null;
  }>({ isOpen: false, item: null });
  const [formData, setFormData] = useState({
    empresa_id: '',
    nome: '',
    descricao: '',
    ativo: true
  });

  const columns = [
    {
      key: 'nome' as keyof Departamento,
      header: 'Nome',
      sortable: true
    },
    {
      key: 'empresas' as keyof Departamento,
      header: 'Empresa',
      render: (value: any) => value?.nome || '-'
    },
    {
      key: 'descricao' as keyof Departamento,
      header: 'Descrição'
    },
    {
      key: 'ativo' as keyof Departamento,
      header: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Ativo' : 'Inativo'}
        </span>
      )
    },
    {
      key: 'created_at' as keyof Departamento,
      header: 'Criado em',
      render: (value: string) => formatDateForDisplay(value)
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [departamentosData, empresasData] = await Promise.all([
        departamentosServiceExtended.getAllWithEmpresa(),
        empresasService.getAll()
      ]);
      setDepartamentos(departamentosData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingDepartamento(null);
    setFormData({
      empresa_id: '',
      nome: '',
      descricao: '',
      ativo: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (departamento: Departamento) => {
    setEditingDepartamento(departamento);
    setFormData({
      empresa_id: departamento.empresa_id,
      nome: departamento.nome,
      descricao: departamento.descricao || '',
      ativo: departamento.ativo
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (departamento: Departamento) => {
    setConfirmDialog({ isOpen: true, item: departamento });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.item) return;
    
    try {
      await departamentosServiceExtended.delete(confirmDialog.item.id);
      showSuccess('Departamento excluído com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir departamento:', error);
      showError('Erro ao excluir departamento');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDepartamento) {
        await departamentosServiceExtended.update(editingDepartamento.id, formData);
      } else {
        await departamentosServiceExtended.create(formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar departamento:', error);
    }
  };

  const empresasOptions = empresas.map(emp => ({ value: emp.id, label: emp.nome }));

  return (
    <div>
      <DataTable
        data={departamentos}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        title="Departamentos"
        addButtonText="Adicionar Departamento"
        searchPlaceholder="Buscar departamentos..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDepartamento ? 'Editar Departamento' : 'Adicionar Departamento'}
      >
        <form onSubmit={handleSubmit}>
          <Select
            label="Empresa"
            value={formData.empresa_id}
            onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
            options={empresasOptions}
            placeholder="Selecione uma empresa"
            required
          />
          
          <Input
            label="Nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
          
          <Input
            label="Descrição"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingDepartamento ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o departamento "${confirmDialog.item?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default DepartamentosCRUD;