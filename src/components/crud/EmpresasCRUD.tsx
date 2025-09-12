import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { empresasServiceExtended, gruposEmpresasService } from '../../services/database';
import type { Empresa, GrupoEmpresa } from '../../types/database';

const EmpresasCRUD: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [grupos, setGrupos] = useState<GrupoEmpresa[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: Empresa | null;
  }>({ isOpen: false, item: null });
  const [formData, setFormData] = useState({
    grupo_empresa_id: '',
    nome: '',
    razao_social: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
    ativo: true
  });

  const columns = [
    {
      key: 'nome' as keyof Empresa,
      header: 'Nome',
      sortable: true
    },
    {
      key: 'grupos_empresas' as keyof Empresa,
      header: 'Grupo',
      render: (value: any) => value?.nome || '-'
    },
    {
      key: 'cnpj' as keyof Empresa,
      header: 'CNPJ'
    },
    {
      key: 'telefone' as keyof Empresa,
      header: 'Telefone'
    },
    {
      key: 'ativo' as keyof Empresa,
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [empresasData, gruposData] = await Promise.all([
        empresasServiceExtended.getAllWithGroup(),
        gruposEmpresasService.getAll()
      ]);
      setEmpresas(empresasData);
      setGrupos(gruposData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingEmpresa(null);
    setFormData({
      grupo_empresa_id: '',
      nome: '',
      razao_social: '',
      cnpj: '',
      endereco: '',
      telefone: '',
      email: '',
      ativo: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setFormData({
      grupo_empresa_id: empresa.grupo_empresa_id || '',
      nome: empresa.nome,
      razao_social: empresa.razao_social || '',
      cnpj: empresa.cnpj || '',
      endereco: empresa.endereco || '',
      telefone: empresa.telefone || '',
      email: empresa.email || '',
      ativo: empresa.ativo
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (empresa: Empresa) => {
    setConfirmDialog({ isOpen: true, item: empresa });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.item) return;
    
    try {
      await empresasServiceExtended.delete(confirmDialog.item.id);
      showSuccess('Empresa excluída com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      showError('Erro ao excluir empresa');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        grupo_empresa_id: formData.grupo_empresa_id || null
      };
      
      if (editingEmpresa) {
        await empresasServiceExtended.update(editingEmpresa.id, dataToSubmit);
      } else {
        await empresasServiceExtended.create(dataToSubmit);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
    }
  };

  const gruposOptions = grupos.map(grupo => ({
    value: grupo.id,
    label: grupo.nome
  }));

  return (
    <div>
      <DataTable
        data={empresas}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        title="Empresas"
        addButtonText="Adicionar Empresa"
        searchPlaceholder="Buscar empresas..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmpresa ? 'Editar Empresa' : 'Adicionar Empresa'}
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
              label="Grupo de Empresa"
              value={formData.grupo_empresa_id}
              onChange={(e) => setFormData({ ...formData, grupo_empresa_id: e.target.value })}
              options={gruposOptions}
              placeholder="Selecione um grupo"
            />
            
            <Input
              label="Razão Social"
              value={formData.razao_social}
              onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
            />
            
            <Input
              label="CNPJ"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
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
          </div>
          
          <Input
            label="Endereço"
            value={formData.endereco}
            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
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
              {editingEmpresa ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a empresa "${confirmDialog.item?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default EmpresasCRUD;