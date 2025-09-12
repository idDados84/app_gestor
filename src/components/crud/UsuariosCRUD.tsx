import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { usuariosService } from '../../services/database';
import type { Usuario } from '../../types/database';

const UsuariosCRUD: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: Usuario | null;
  }>({ isOpen: false, item: null });
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    ativo: true
  });

  const columns = [
    {
      key: 'nome' as keyof Usuario,
      header: 'Nome',
      sortable: true
    },
    {
      key: 'email' as keyof Usuario,
      header: 'Email',
      sortable: true
    },
    {
      key: 'telefone' as keyof Usuario,
      header: 'Telefone'
    },
    {
      key: 'ativo' as keyof Usuario,
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
      key: 'created_at' as keyof Usuario,
      header: 'Criado em',
      render: (value: string) => formatDateForDisplay(value)
    }
  ];

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const data = await usuariosService.getAll();
      setUsuarios(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      ativo: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone || '',
      ativo: usuario.ativo
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (usuario: Usuario) => {
    setConfirmDialog({ isOpen: true, item: usuario });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.item) return;
    
    try {
      await usuariosService.delete(confirmDialog.item.id);
      showSuccess('Usuário excluído com sucesso');
      await loadUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      showError('Erro ao excluir usuário');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await usuariosService.update(editingUser.id, formData);
      } else {
        await usuariosService.create(formData);
      }
      setIsModalOpen(false);
      await loadUsuarios();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  return (
    <div>
      <DataTable
        data={usuarios}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        title="Usuários"
        addButtonText="Adicionar Usuário"
        searchPlaceholder="Buscar usuários..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
          
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          
          <Input
            label="Telefone"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            placeholder="(11) 99999-9999"
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
              {editingUser ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o usuário "${confirmDialog.item?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default UsuariosCRUD;