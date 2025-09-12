import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { participantesService } from '../../services/database';
import type { Participante } from '../../types/database';

const ParticipantesCRUD: React.FC = () => {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipante, setEditingParticipante] = useState<Participante | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: Participante | null;
  }>({ isOpen: false, item: null });
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'cliente' as 'cliente' | 'fornecedor' | 'ambos',
    documento: '',
    endereco: '',
    telefone: '',
    email: '',
    observacoes: '',
    ativo: true
  });

  const columns = [
    {
      key: 'nome' as keyof Participante,
      header: 'Nome',
      sortable: true
    },
    {
      key: 'tipo' as keyof Participante,
      header: 'Tipo',
      render: (value: string) => {
        const tipoColors = {
          cliente: 'bg-blue-100 text-blue-800',
          fornecedor: 'bg-green-100 text-green-800',
          ambos: 'bg-purple-100 text-purple-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${tipoColors[value as keyof typeof tipoColors]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'documento' as keyof Participante,
      header: 'Documento'
    },
    {
      key: 'telefone' as keyof Participante,
      header: 'Telefone'
    },
    {
      key: 'email' as keyof Participante,
      header: 'Email'
    },
    {
      key: 'ativo' as keyof Participante,
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
    loadParticipantes();
  }, []);

  const loadParticipantes = async () => {
    try {
      const data = await participantesService.getAll();
      setParticipantes(data);
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingParticipante(null);
    setFormData({
      nome: '',
      tipo: 'cliente',
      documento: '',
      endereco: '',
      telefone: '',
      email: '',
      observacoes: '',
      ativo: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (participante: Participante) => {
    setEditingParticipante(participante);
    setFormData({
      nome: participante.nome,
      tipo: participante.tipo,
      documento: participante.documento || '',
      endereco: participante.endereco || '',
      telefone: participante.telefone || '',
      email: participante.email || '',
      observacoes: participante.observacoes || '',
      ativo: participante.ativo
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (participante: Participante) => {
    setConfirmDialog({ isOpen: true, item: participante });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.item) return;
    
    try {
      await participantesService.delete(confirmDialog.item.id);
      showSuccess('Participante excluído com sucesso');
      await loadParticipantes();
    } catch (error) {
      console.error('Erro ao excluir participante:', error);
      showError('Erro ao excluir participante');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingParticipante) {
        await participantesService.update(editingParticipante.id, formData);
      } else {
        await participantesService.create(formData);
      }
      setIsModalOpen(false);
      await loadParticipantes();
    } catch (error) {
      console.error('Erro ao salvar participante:', error);
    }
  };

  return (
    <div>
      <DataTable
        data={participantes}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        title="Participantes (Clientes/Fornecedores)"
        addButtonText="Adicionar Participante"
        searchPlaceholder="Buscar participantes..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingParticipante ? 'Editar Participante' : 'Adicionar Participante'}
        size="lg"
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
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'cliente' | 'fornecedor' | 'ambos' })}
              options={[
                { value: 'cliente', label: 'Cliente' },
                { value: 'fornecedor', label: 'Fornecedor' },
                { value: 'ambos', label: 'Ambos' }
              ]}
              required
            />
            
            <Input
              label="Documento (CPF/CNPJ)"
              value={formData.documento}
              onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
            
            <Input
              label="Telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
            
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
          </div>
          
          <Input
            label="Endereço"
            value={formData.endereco}
            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
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
              {editingParticipante ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o participante "${confirmDialog.item?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ParticipantesCRUD;