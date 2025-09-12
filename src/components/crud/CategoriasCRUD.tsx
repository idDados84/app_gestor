import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { categoriasService } from '../../services/database';
import type { Categoria } from '../../types/database';

const CategoriasCRUD: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: Categoria | null;
  }>({ isOpen: false, item: null });
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'ambos' as 'receita' | 'despesa' | 'ambos',
    cor: '#3B82F6',
    ativo: true
  });

  const columns = [
    {
      key: 'nome' as keyof Categoria,
      header: 'Nome',
      sortable: true
    },
    {
      key: 'tipo' as keyof Categoria,
      header: 'Tipo',
      render: (value: string) => {
        const tipoColors = {
          receita: 'bg-green-100 text-green-800',
          despesa: 'bg-red-100 text-red-800',
          ambos: 'bg-blue-100 text-blue-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${tipoColors[value as keyof typeof tipoColors]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'cor' as keyof Categoria,
      header: 'Cor',
      render: (value: string) => (
        <div className="flex items-center">
          <div 
            className="w-4 h-4 rounded-full mr-2 border border-gray-300"
            style={{ backgroundColor: value }}
          />
          {value}
        </div>
      )
    },
    {
      key: 'descricao' as keyof Categoria,
      header: 'Descrição'
    },
    {
      key: 'ativo' as keyof Categoria,
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
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const data = await categoriasService.getAll();
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategoria(null);
    setFormData({
      nome: '',
      descricao: '',
      tipo: 'ambos',
      cor: '#3B82F6',
      ativo: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      tipo: categoria.tipo,
      cor: categoria.cor,
      ativo: categoria.ativo
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (categoria: Categoria) => {
    setConfirmDialog({ isOpen: true, item: categoria });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.item) return;
    
    try {
      await categoriasService.delete(confirmDialog.item.id);
      showSuccess('Categoria excluída com sucesso');
      await loadCategorias();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      showError('Erro ao excluir categoria');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategoria) {
        await categoriasService.update(editingCategoria.id, formData);
      } else {
        await categoriasService.create(formData);
      }
      setIsModalOpen(false);
      await loadCategorias();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    }
  };

  const coresPreDefinidas = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  return (
    <div>
      <DataTable
        data={categorias}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        title="Categorias"
        addButtonText="Adicionar Categoria"
        searchPlaceholder="Buscar categorias..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategoria ? 'Editar Categoria' : 'Adicionar Categoria'}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
            
            <Select
              label="Tipo"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'receita' | 'despesa' | 'ambos' })}
              options={[
                { value: 'receita', label: 'Receita' },
                { value: 'despesa', label: 'Despesa' },
                { value: 'ambos', label: 'Ambos' }
              ]}
              required
            />
          </div>
          
          <Input
            label="Descrição"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cor
            </label>
            <div className="flex items-center space-x-2 mb-2">
              {coresPreDefinidas.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setFormData({ ...formData, cor })}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.cor === cor ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
            <input
              type="color"
              value={formData.cor}
              onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          
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
              {editingCategoria ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a categoria "${confirmDialog.item?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default CategoriasCRUD;