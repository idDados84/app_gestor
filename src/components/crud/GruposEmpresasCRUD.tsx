import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { gruposEmpresasService } from '../../services/database';
import type { GrupoEmpresa } from '../../types/database';
import { formatDateForDisplay } from '../../utils/dateUtils';

const GruposEmpresasCRUD: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoEmpresa[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GrupoEmpresa | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: GrupoEmpresa | null;
  }>({ isOpen: false, item: null });
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true
  });

  const columns = [
    {
      key: 'nome' as keyof GrupoEmpresa,
      header: 'Nome',
      sortable: true
    },
    {
      key: 'descricao' as keyof GrupoEmpresa,
      header: 'Descrição'
    },
    {
      key: 'ativo' as keyof GrupoEmpresa,
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
      key: 'created_at' as keyof GrupoEmpresa,
      header: 'Criado em',
      render: (value: string) => formatDateForDisplay(value)
    }
  ];

  useEffect(() => {
    loadGrupos();
  }, []);

  const loadGrupos = async () => {
    try {
      const data = await gruposEmpresasService.getAll();
      setGrupos(data);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingGroup(null);
    setFormData({
      nome: '',
      descricao: '',
      ativo: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (grupo: GrupoEmpresa) => {
    setEditingGroup(grupo);
    setFormData({
      nome: grupo.nome,
      descricao: grupo.descricao || '',
      ativo: grupo.ativo
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (grupo: GrupoEmpresa) => {
    setConfirmDialog({ isOpen: true, item: grupo });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.item) return;
    
    try {
      await gruposEmpresasService.delete(confirmDialog.item.id);
      showSuccess('Grupo excluído com sucesso');
      await loadGrupos();
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      showError('Erro ao excluir grupo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await gruposEmpresasService.update(editingGroup.id, formData);
      } else {
        await gruposEmpresasService.create(formData);
      }
      setIsModalOpen(false);
      await loadGrupos();
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
    }
  };

  return (
    <div>
      <DataTable
        data={grupos}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        title="Grupos de Empresas"
        addButtonText="Adicionar Grupo"
        searchPlaceholder="Buscar grupos..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? 'Editar Grupo' : 'Adicionar Grupo'}
      >
        <form onSubmit={handleSubmit}>
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
              {editingGroup ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o grupo "${confirmDialog.item?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default GruposEmpresasCRUD;