import React, { useState, useEffect } from 'react';
import DataTable from '../tables/DataTable';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { 
  contasCobrancaServiceExtended, 
  empresasService, 
  participantesService,
  categoriasService,
  departamentosService,
  formasCobrancaService 
} from '../../services/database';
import type { 
  ContaCobranca, 
  Empresa, 
  Participante, 
  Categoria, 
  Departamento, 
  FormaCobranca 
} from '../../types/database';

const ContasCobrancaCRUD: React.FC = () => {
  const [contas, setContas] = useState<ContaCobranca[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [formasCobranca, setFormasCobranca] = useState<FormaCobranca[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaCobranca | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    empresa_id: '',
    participante_id: '',
    categoria_id: '',
    departamento_id: '',
    forma_cobranca_id: '',
    descricao: '',
    valor: '',
    tipo: 'pagar' as 'pagar' | 'receber',
    status: 'pendente' as 'pendente' | 'pago' | 'cancelado',
    data_vencimento: '',
    data_pagamento: '',
    observacoes: ''
  });

  const columns = [
    {
      key: 'descricao' as keyof ContaCobranca,
      header: 'Descrição',
      sortable: true
    },
    {
      key: 'empresas' as keyof ContaCobranca,
      header: 'Empresa',
      render: (value: any) => value?.nome || '-'
    },
    {
      key: 'participantes' as keyof ContaCobranca,
      header: 'Participante',
      render: (value: any) => value?.nome || '-'
    },
    {
      key: 'valor' as keyof ContaCobranca,
      header: 'Valor',
      render: (value: number) => `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
    },
    {
      key: 'tipo' as keyof ContaCobranca,
      header: 'Tipo',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'receber' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value === 'receber' ? 'A Receber' : 'A Pagar'}
        </span>
      )
    },
    {
      key: 'status' as keyof ContaCobranca,
      header: 'Status',
      render: (value: string) => {
        const statusColors = {
          pendente: 'bg-yellow-100 text-yellow-800',
          pago: 'bg-green-100 text-green-800',
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
      key: 'data_vencimento' as keyof ContaCobranca,
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
        formasData
      ] = await Promise.all([
        contasCobrancaServiceExtended.getAllWithRelations(),
        empresasService.getAll(),
        participantesService.getAll(),
        categoriasService.getAll(),
        departamentosService.getAll(),
        formasCobrancaService.getAll()
      ]);
      
      setContas(contasData);
      setEmpresas(empresasData);
      setParticipantes(participantesData);
      setCategorias(categoriasData);
      setDepartamentos(departamentosData);
      setFormasCobranca(formasData);
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
      participante_id: '',
      categoria_id: '',
      departamento_id: '',
      forma_cobranca_id: '',
      descricao: '',
      valor: '',
      tipo: 'pagar',
      status: 'pendente',
      data_vencimento: '',
      data_pagamento: '',
      observacoes: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (conta: ContaCobranca) => {
    setEditingConta(conta);
    setFormData({
      empresa_id: conta.empresa_id,
      participante_id: conta.participante_id,
      categoria_id: conta.categoria_id || '',
      departamento_id: conta.departamento_id || '',
      forma_cobranca_id: conta.forma_cobranca_id || '',
      descricao: conta.descricao,
      valor: conta.valor.toString(),
      tipo: conta.tipo,
      status: conta.status,
      data_vencimento: formatDateForInput(conta.data_vencimento),
      data_pagamento: formatDateForInput(conta.data_pagamento),
      observacoes: conta.observacoes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (conta: ContaCobranca) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await contasCobrancaServiceExtended.delete(conta.id);
        await loadData();
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
      }
    }
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
        data_pagamento: formData.data_pagamento || null
      };
      
      // Filter out properties with empty string values to prevent database errors
      const filteredData = Object.fromEntries(
        Object.entries(dataToSubmit).filter(([key, value]) => value !== '')
      );
      
      if (editingConta) {
        await contasCobrancaServiceExtended.update(editingConta.id, filteredData);
      } else {
        await contasCobrancaServiceExtended.create(filteredData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    }
  };

  const empresasOptions = empresas.map(emp => ({ value: emp.id, label: emp.nome }));
  const participantesOptions = participantes.map(part => ({ value: part.id, label: part.nome }));
  const categoriasOptions = categorias.map(cat => ({ value: cat.id, label: cat.nome }));
  const departamentosOptions = departamentos.map(dep => ({ value: dep.id, label: dep.nome }));
  const formasOptions = formasCobranca.map(forma => ({ value: forma.id, label: forma.nome }));

  return (
    <div>
      <DataTable
        data={contas}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        title="Contas de Cobrança"
        addButtonText="Adicionar Conta"
        searchPlaceholder="Buscar contas..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingConta ? 'Editar Conta' : 'Adicionar Conta'}
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
              label="Participante"
              value={formData.participante_id}
              onChange={(e) => setFormData({ ...formData, participante_id: e.target.value })}
              options={participantesOptions}
              placeholder="Selecione um participante"
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
              label="Tipo"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'pagar' | 'receber' })}
              options={[
                { value: 'pagar', label: 'A Pagar' },
                { value: 'receber', label: 'A Receber' }
              ]}
              required
            />
            
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pendente' | 'pago' | 'cancelado' })}
              options={[
                { value: 'pendente', label: 'Pendente' },
                { value: 'pago', label: 'Pago' },
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
              label="Data de Pagamento"
              type="date"
              value={formData.data_pagamento}
              onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
            />
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
    </div>
  );
};

export default ContasCobrancaCRUD;