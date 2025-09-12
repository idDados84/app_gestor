import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { formasCobrancaService } from '../../services/database';
import type { FormaCobranca } from '../../types/database';

const FormasCobrancaCRUD: React.FC = () => {
  const [formas, setFormas] = useState<FormaCobranca[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingForma, setEditingForma] = useState<FormaCobranca | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: FormaCobranca | null;
  }>({ isOpen: false, item: null });
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    prazo_dias: 0,
    taxa_juros: 0,
    ativo: true
  });

  const columns = [
    {
      key: 'nome' as keyof FormaCobranca,
      header: 'Nome',
      sortable: true
    },
    {
      key: 'descricao' as keyof FormaCobranca,
      header: 'Descrição'
    },
    {
      key: 'prazo_dias' as keyof FormaCobranca,
      header: 'Prazo (dias)',
      render: (value: number) => `${value} dias`
    },
    {
      key: 'taxa_juros' as keyof FormaCobranca,
      header: 'Taxa de Juros',
      render: (value: number) => `${value}%`
    },
    {
      key: 'ativo' as keyof FormaCobranca,
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
    loadFormas();
  }, []);

  const loadFormas = async () => {
    try {
      const data = await formasCobrancaService.getAll();
      setFormas(data);
    } catch (error) {
      console.error('Erro ao carregar formas de cobrança:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingForma(null);
    setFormData({
      nome: '',
      descricao: '',
      prazo_dias: 0,
      taxa_juros: 0,
      ativo: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (forma: FormaCobranca) => {
    setEditingForma(forma);
    setFormData({
      nome: forma.nome,
      descricao: forma.descricao || '',
      prazo_dias: forma.prazo_dias,
      taxa_juros: forma.taxa_juros,
      ativo: forma.ativo
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (forma: FormaCobranca) => {
    setConfirmDialog({ isOpen: true, item: forma });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.item) return;
    
    try {
      await formasCobrancaService.delete(confirmDialog.item.id);
      showSuccess('Forma de cobrança excluída com sucesso');
      await loadFormas();
    } catch (error) {
      console.error('Erro ao excluir forma de cobrança:', error);
      showError('Erro ao excluir forma de cobrança');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingForma) {
        await formasCobrancaService.update(editingForma.id, formData);
      } else {
        await formasCobrancaService.create(formData);
      }
      setIsModalOpen(false);
      await loadFormas();
    } catch (error) {
      console.error('Erro ao salvar forma de cobrança:', error);
    }
  };

  return (
    <div>
      <DataTable
        data={formas}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        title="Formas de Cobrança"
        addButtonText="Adicionar Forma de Cobrança"
        searchPlaceholder="Buscar formas de cobrança..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingForma ? 'Editar Forma de Cobrança' : 'Adicionar Forma de Cobrança'}
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
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prazo (dias)"
              type="number"
              value={formData.prazo_dias.toString()}
              onChange={(e) => setFormData({ ...formData, prazo_dias: parseInt(e.target.value) || 0 })}
              min="0"
            />
            
            <Input
              label="Taxa de Juros (%)"
              type="number"
              value={formData.taxa_juros.toString()}
              onChange={(e) => setFormData({ ...formData, taxa_juros: parseFloat(e.target.value) || 0 })}
              step="0.01"
              min="0"
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
              {editingForma ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a forma de cobrança "${confirmDialog.item?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default FormasCobrancaCRUD;