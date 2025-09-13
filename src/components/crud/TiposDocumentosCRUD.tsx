import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { tiposDocumentosService } from '../../services/database';
import type { TipoDocumento } from '../../types/database';

interface TiposDocumentosCRUDProps {
  showError?: (message: string) => void;
  showSuccess?: (message: string) => void;
}

const TiposDocumentosCRUD: React.FC<TiposDocumentosCRUDProps> = ({ 
  showError: externalShowError, 
  showSuccess: externalShowSuccess 
}) => {
  const [tipos, setTipos] = useState<TipoDocumento[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoDocumento | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: TipoDocumento | null;
  }>({ isOpen: false, item: null });
  const { showError: internalShowError, showSuccess: internalShowSuccess } = useToast();
  
  // Use external toast functions if provided, otherwise use internal ones
  const showError = externalShowError || internalShowError;
  const showSuccess = externalShowSuccess || internalShowSuccess;
  
  const [formData, setFormData] = useState({
    codigo_tipo: '',
    nome_tipo: '',
    sigla_tipo: '',
    descricao: '',
    ativo: true
  });

  const columns = [
    {
      key: 'codigo_tipo' as keyof TipoDocumento,
      header: 'Código',
      sortable: true
    },
    {
      key: 'sigla_tipo' as keyof TipoDocumento,
      header: 'Sigla',
      sortable: true
    },
    {
      key: 'nome_tipo' as keyof TipoDocumento,
      header: 'Nome do Documento',
      sortable: true
    },
    {
      key: 'descricao' as keyof TipoDocumento,
      header: 'Descrição'
    },
    {
      key: 'ativo' as keyof TipoDocumento,
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
    loadTipos();
  }, []);

  const loadTipos = async () => {
    try {
      const data = await tiposDocumentosService.getAll();
      setTipos(data);
    } catch (error) {
      console.error('Erro ao carregar tipos de documentos:', error);
      showError('Erro ao carregar tipos de documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTipo(null);
    setFormData({
      codigo_tipo: '',
      nome_tipo: '',
      sigla_tipo: '',
      descricao: '',
      ativo: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (tipo: TipoDocumento) => {
    setEditingTipo(tipo);
    setFormData({
      codigo_tipo: tipo.codigo_tipo,
      nome_tipo: tipo.nome_tipo,
      sigla_tipo: tipo.sigla_tipo,
      descricao: tipo.descricao || '',
      ativo: tipo.ativo
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (tipo: TipoDocumento) => {
    setConfirmDialog({ isOpen: true, item: tipo });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.item) return;
    
    try {
      await tiposDocumentosService.delete(confirmDialog.item.id);
      showSuccess('Tipo de documento excluído com sucesso');
      await loadTipos();
    } catch (error) {
      console.error('Erro ao excluir tipo de documento:', error);
      showError('Erro ao excluir tipo de documento');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        descricao: formData.descricao || null
      };
      
      if (editingTipo) {
        await tiposDocumentosService.update(editingTipo.id, dataToSubmit);
        showSuccess('Tipo de documento atualizado com sucesso');
      } else {
        await tiposDocumentosService.create(dataToSubmit);
        showSuccess('Tipo de documento criado com sucesso');
      }
      setIsModalOpen(false);
      await loadTipos();
    } catch (error) {
      console.error('Erro ao salvar tipo de documento:', error);
      showError('Erro ao salvar tipo de documento');
    }
  };

  return (
    <div>
      <DataTable
        data={tipos}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        title="Tipos de Documentos"
        addButtonText="Adicionar Tipo de Documento"
        searchPlaceholder="Buscar tipos de documentos..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTipo ? 'Editar Tipo de Documento' : 'Adicionar Tipo de Documento'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código do Tipo"
              value={formData.codigo_tipo}
              onChange={(e) => setFormData({ ...formData, codigo_tipo: e.target.value })}
              required
              placeholder="55"
            />
            
            <Input
              label="Sigla"
              value={formData.sigla_tipo}
              onChange={(e) => setFormData({ ...formData, sigla_tipo: e.target.value })}
              required
              placeholder="NFe"
            />
            
            <div className="col-span-2">
              <Input
                label="Nome do Documento"
                value={formData.nome_tipo}
                onChange={(e) => setFormData({ ...formData, nome_tipo: e.target.value })}
                required
                placeholder="Nota Fiscal Eletrônica"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Descrição detalhada do tipo de documento"
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
              {editingTipo ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o tipo de documento "${confirmDialog.item?.nome_tipo}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default TiposDocumentosCRUD;