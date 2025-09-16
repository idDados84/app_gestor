import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { CheckSquare, Square, Info, Calendar, DollarSign, FileText, Tag, User, Building, CreditCard, Hash, Clock, MapPin } from 'lucide-react';
import { parseDateFromYYYYMMDD, formatDateToYYYYMMDD } from '../../utils/dateUtils';
import type { ContaPagar, ContaReceber, Empresa, Participante, Categoria, Departamento, FormaCobranca, ContaFinanceira, TipoDocumento } from '../../types/database';

interface FieldChange {
  field: string;
  label: string;
  icon: React.ComponentType<any>;
  oldValue: any;
  newValue: any;
  selected: boolean;
  description: string;
  newDayOfMonth?: number; // For date fields - the new day to apply
}

interface RecurrenceReplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedChanges: FieldChange[]) => void;
  originalRecord: ContaPagar | ContaReceber | null;
  updatedRecord: ContaPagar | ContaReceber | null;
  futureRecords: (ContaPagar | ContaReceber)[];
  type: 'pagar' | 'receber';
  loading?: boolean;
  // Add reference data for resolving relationship names
  empresas?: Empresa[];
  participantes?: Participante[];
  categorias?: Categoria[];
  departamentos?: Departamento[];
  formasCobranca?: FormaCobranca[];
  contasFinanceiras?: ContaFinanceira[];
  tiposDocumentos?: TipoDocumento[];
}

const RecurrenceReplicationModal: React.FC<RecurrenceReplicationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  originalRecord,
  updatedRecord,
  futureRecords,
  type,
  loading = false,
  empresas = [],
  participantes = [],
  categorias = [],
  departamentos = [],
  formasCobranca = [],
  contasFinanceiras = [],
  tiposDocumentos = []
}) => {
  const [fieldChanges, setFieldChanges] = useState<FieldChange[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Define all replicable fields with their metadata
  const replicableFieldsConfig = [
    // Basic info fields
    { field: 'descricao', label: 'Descrição', icon: FileText, defaultSelected: true, category: 'basic' },
    
    // Financial fields
    { field: 'valor_operacao', label: 'Valor da Operação', icon: DollarSign, defaultSelected: true, category: 'financial' },
    { field: 'valor_parcela', label: 'Valor da Parcela', icon: DollarSign, defaultSelected: true, category: 'financial' },
    { field: 'valor_juros', label: 'Juros', icon: DollarSign, defaultSelected: true, category: 'financial' },
    { field: 'valor_multas', label: 'Multas', icon: DollarSign, defaultSelected: true, category: 'financial' },
    { field: 'valor_atualizacao', label: 'Atualização Monetária', icon: DollarSign, defaultSelected: true, category: 'financial' },
    { field: 'valor_descontos', label: 'Descontos', icon: DollarSign, defaultSelected: true, category: 'financial' },
    { field: 'valor_abto', label: 'Abatimentos', icon: DollarSign, defaultSelected: true, category: 'financial' },
    { field: 'valor_pagto', label: 'Pagamentos Realizados', icon: DollarSign, defaultSelected: true, category: 'financial' },
    
    // Date fields
    { field: 'data_vencimento', label: 'Data de Vencimento', icon: Calendar, defaultSelected: true, category: 'date' },
    { field: 'data_pagamento', label: 'Data de Pagamento', icon: Calendar, defaultSelected: false, category: 'date' },
    { field: 'data_recebimento', label: 'Data de Recebimento', icon: Calendar, defaultSelected: false, category: 'date' },
    { field: 'data_inicio_recorrencia', label: 'Data Início Recorrência', icon: Calendar, defaultSelected: false, category: 'date' },
    
    // Relationship fields
    { field: 'categoria_id', label: 'Categoria', icon: Tag, defaultSelected: true, category: 'relationship' },
    { field: 'departamento_id', label: 'Departamento', icon: Building, defaultSelected: true, category: 'relationship' },
    { field: 'forma_cobranca_id', label: 'Forma de Cobrança', icon: CreditCard, defaultSelected: true, category: 'relationship' },
    { field: 'conta_cobranca_id', label: 'Conta de Cobrança', icon: CreditCard, defaultSelected: true, category: 'relationship' },
    { field: 'tipo_documento_id', label: 'Tipo de Documento', icon: FileText, defaultSelected: true, category: 'relationship' },
    { field: 'empresa_id', label: 'Empresa', icon: Building, defaultSelected: false, category: 'relationship' },
    { field: 'fornecedor_id', label: 'Fornecedor', icon: User, defaultSelected: false, category: 'relationship' },
    { field: 'cliente_id', label: 'Cliente', icon: User, defaultSelected: false, category: 'relationship' },
    
    // Document fields
    { field: 'n_docto_origem', label: 'Nº Documento Origem', icon: Hash, defaultSelected: true, category: 'document' },
    { field: 'sku_parcela', label: 'SKU da Parcela', icon: Hash, defaultSelected: true, category: 'document' },
    { field: 'n_doctos_ref', label: 'Documentos de Referência', icon: FileText, defaultSelected: false, category: 'document' },
    { field: 'projetos', label: 'Projetos', icon: MapPin, defaultSelected: false, category: 'document' },
    
    // Configuration fields
    { field: 'periodicidade', label: 'Periodicidade', icon: Clock, defaultSelected: false, category: 'config' },
    { field: 'frequencia_recorrencia', label: 'Frequência de Recorrência', icon: Clock, defaultSelected: false, category: 'config' },
    { field: 'termino_apos_ocorrencias', label: 'Término Após Ocorrências', icon: Clock, defaultSelected: false, category: 'config' },
    { field: 'intervalo_ini', label: 'Intervalo Inicial', icon: Clock, defaultSelected: false, category: 'config' },
    { field: 'intervalo_rec', label: 'Intervalo Recorrente', icon: Clock, defaultSelected: false, category: 'config' },
    { field: 'eh_vencto_fixo', label: 'Vencimento Fixo', icon: Calendar, defaultSelected: false, category: 'config' },
    
    // Text fields
    { field: 'observacoes', label: 'Observações', icon: FileText, defaultSelected: false, category: 'text' },
    { field: 'id_autorizacao', label: 'ID Autorização', icon: Hash, defaultSelected: false, category: 'text' }
  ];

  // Helper function to normalize values for comparison
  const normalizeValue = (value: any): any => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (Array.isArray(value) && value.length === 0) {
      return null;
    }
    return value;
  };

  // Helper function to check if two values are different
  const areValuesDifferent = (oldValue: any, newValue: any): boolean => {
    const normalizedOld = normalizeValue(oldValue);
    const normalizedNew = normalizeValue(newValue);
    
    // Handle arrays specially
    if (Array.isArray(normalizedOld) && Array.isArray(normalizedNew)) {
      return JSON.stringify(normalizedOld.sort()) !== JSON.stringify(normalizedNew.sort());
    }
    
    return normalizedOld !== normalizedNew;
  };

  // Helper function to resolve relationship names
  const resolveRelationshipName = (field: string, value: any): string => {
    if (!value) return 'Não selecionado';
    
    switch (field) {
      case 'empresa_id':
        const empresa = empresas.find(e => e.id === value);
        return empresa ? empresa.nome : `ID: ${value}`;
      
      case 'fornecedor_id':
      case 'cliente_id':
        const participante = participantes.find(p => p.id === value);
        return participante ? participante.nome : `ID: ${value}`;
      
      case 'categoria_id':
        const categoria = categorias.find(c => c.id === value);
        return categoria ? categoria.nome : `ID: ${value}`;
      
      case 'departamento_id':
        const departamento = departamentos.find(d => d.id === value);
        return departamento ? departamento.nome : `ID: ${value}`;
      
      case 'forma_cobranca_id':
        const forma = formasCobranca.find(f => f.id === value);
        return forma ? forma.nome : `ID: ${value}`;
      
      case 'conta_cobranca_id':
        const conta = contasFinanceiras.find(c => c.id === value);
        return conta ? `${conta.codigo_conta} - ${conta.nome_conta}` : `ID: ${value}`;
      
      case 'tipo_documento_id':
        const tipo = tiposDocumentos.find(t => t.id === value);
        return tipo ? `${tipo.sigla_tipo} - ${tipo.nome_tipo}` : `ID: ${value}`;
      
      default:
        return String(value);
    }
  };

  // Helper function to format value for display
  const formatValueForDisplay = (value: any, field: string): string => {
    if (value === null || value === undefined) return 'Vazio';
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'Vazio';
    
    // Handle relationship fields
    if (field.includes('_id') && typeof value === 'string') {
      return resolveRelationshipName(field, value);
    }
    
    if (field.includes('valor_') && typeof value === 'number') {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    if (field.includes('data_') && typeof value === 'string') {
      try {
        const date = parseDateFromYYYYMMDD(value);
        return date.toLocaleDateString('pt-BR');
      } catch {
        return value;
      }
    }
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    return String(value);
  };

  // Helper function to get appropriate icon for field
  const getFieldIcon = (field: string, category: string) => {
    const fieldConfig = replicableFieldsConfig.find(config => config.field === field);
    return fieldConfig?.icon || FileText;
  };

  // Helper function to create description for field changes
  const createFieldDescription = (field: string, label: string, oldValue: any, newValue: any, newDayOfMonth?: number): string => {
    switch (field) {
      case 'data_vencimento':
        if (newDayOfMonth !== undefined) {
          const oldDate = parseDateFromYYYYMMDD(oldValue);
          const newDate = parseDateFromYYYYMMDD(newValue);
          const oldDay = oldDate.getDate();
          const newDay = newDate.getDate();
          return `Atualizar o dia de vencimento dos próximos registros para o dia "${newDay}" de cada período? (anterior: dia ${oldDay})`;
        }
        return `Atualizar a data de vencimento dos próximos registros?`;
      case 'valor_parcela':
      case 'valor_operacao':
        const valorAnterior = Number(oldValue) || 0;
        const valorNovo = Number(newValue) || 0;
        const valorDifference = valorNovo - valorAnterior;
        return `Atualizar o ${label.toLowerCase()} dos próximos registros? ${valorDifference > 0 ? 'Aumento' : 'Redução'} de R$ ${Math.abs(valorDifference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (de R$ ${valorAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para R$ ${valorNovo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
      case 'empresa_id':
      case 'fornecedor_id':
      case 'cliente_id':
      case 'categoria_id':
      case 'departamento_id':
      case 'forma_cobranca_id':
      case 'conta_cobranca_id':
      case 'tipo_documento_id':
        const oldName = resolveRelationshipName(field, oldValue);
        const newName = resolveRelationshipName(field, newValue);
        return `Atualizar ${label.toLowerCase()} dos próximos registros para "${newName}"? (anterior: "${oldName}")`;
      default:
        return `Atualizar ${label.toLowerCase()} dos próximos registros para "${formatValueForDisplay(newValue, field)}"? (anterior: "${formatValueForDisplay(oldValue, field)}")`;
    }
  };

  // Detect changes between original and updated records
  useEffect(() => {
    if (isOpen && originalRecord && updatedRecord) {
      const changes: FieldChange[] = [];

      // Iterate through all replicable fields dynamically
      for (const fieldConfig of replicableFieldsConfig) {
        const { field, label, defaultSelected, category } = fieldConfig;
        const oldValue = originalRecord[field as keyof typeof originalRecord];
        const newValue = updatedRecord[field as keyof typeof updatedRecord];

        // Check if values are different
        if (areValuesDifferent(oldValue, newValue)) {
          let newDayOfMonth: number | undefined;
          
          // Special handling for date fields - extract day of month for replication
          if (field === 'data_vencimento' && typeof newValue === 'string') {
            const newDate = parseDateFromYYYYMMDD(newValue);
            newDayOfMonth = newDate.getDate();
          }

          const icon = getFieldIcon(field, category);

          changes.push({
            field,
            label,
            icon,
            oldValue,
            newValue,
            selected: defaultSelected,
            description: createFieldDescription(field, label, oldValue, newValue, newDayOfMonth),
            newDayOfMonth
          });
        }
      }

      setFieldChanges(changes);
      setSelectAll(changes.length > 0 && changes.every(c => c.selected));
    }
  }, [isOpen, originalRecord, updatedRecord]);

  const handleFieldToggle = (index: number) => {
    const newChanges = [...fieldChanges];
    newChanges[index].selected = !newChanges[index].selected;
    setFieldChanges(newChanges);
    
    // Update select all state
    setSelectAll(newChanges.length > 0 && newChanges.every(c => c.selected));
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    const newChanges = fieldChanges.map(change => ({
      ...change,
      selected: newSelectAll
    }));
    setFieldChanges(newChanges);
    setSelectAll(newSelectAll);
  };

  const handleConfirm = () => {
    const selectedChanges = fieldChanges.filter(change => change.selected);
    onConfirm(selectedChanges);
  };

  const selectedCount = fieldChanges.filter(c => c.selected).length;
  const futureOpenRecords = futureRecords.filter(record => {
    const status = record.status.toLowerCase();
    return status !== 'pago' && status !== 'recebido' && status !== 'cancelado';
  });

  if (fieldChanges.length === 0) {
    return null; // Don't show modal if no changes detected
  }

  // Group changes by category for better organization
  const groupedChanges = fieldChanges.reduce((groups, change) => {
    const fieldConfig = replicableFieldsConfig.find(config => config.field === change.field);
    const category = fieldConfig?.category || 'other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(change);
    return groups;
  }, {} as Record<string, FieldChange[]>);

  const categoryLabels = {
    basic: 'Informações Básicas',
    financial: 'Valores Financeiros',
    date: 'Datas',
    relationship: 'Relacionamentos',
    document: 'Documentos',
    config: 'Configurações',
    text: 'Textos',
    other: 'Outros'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Replicar Alterações - Registros Recorrentes`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Info Header */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Alterações Detectadas
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Foram detectadas {fieldChanges.length} alteração(ões) no registro atual. 
                Selecione quais alterações deseja aplicar aos {futureOpenRecords.length} registro(s) 
                recorrente(s) futuro(s) em aberto.
              </p>
            </div>
          </div>
        </div>

        {/* Special note for date changes */}
        {fieldChanges.some(change => change.field === 'data_vencimento') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  Atenção: Alteração de Data de Vencimento
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  A data de vencimento será alterada aplicando o <strong>novo dia do mês</strong> a todos os registros futuros, 
                  preservando o mês e ano originais de cada registro. Para meses com menos dias, será usado o último dia disponível.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Select All Controls */}
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <button
            onClick={handleSelectAll}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            disabled={loading}
          >
            {selectAll ? (
              <CheckSquare className="h-4 w-4 mr-2 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 mr-2 text-gray-400" />
            )}
            {selectAll ? 'Desmarcar Todas' : 'Selecionar Todas'}
          </button>
          <span className="text-sm text-gray-600">
            {selectedCount} de {fieldChanges.length} alterações selecionadas
          </span>
        </div>

        {/* Changes List - Grouped by Category */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(groupedChanges).map(([category, changes]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
                {categoryLabels[category as keyof typeof categoryLabels] || category}
              </h4>
              
              {changes.map((change, index) => {
                const globalIndex = fieldChanges.findIndex(fc => fc.field === change.field);
                const Icon = change.icon;
                return (
                  <div
                    key={change.field}
                    className={`border rounded-lg p-4 transition-colors ${
                      change.selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start">
                      <button
                        onClick={() => handleFieldToggle(globalIndex)}
                        className="mt-1 mr-3 flex-shrink-0"
                        disabled={loading}
                      >
                        {change.selected ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Icon className="h-4 w-4 mr-2 text-gray-500" />
                          <h4 className="text-sm font-medium text-gray-900">
                            {change.label}
                          </h4>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2">
                          {change.description}
                        </p>
                        
                        {/* Value comparison */}
                        <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                          <span className="line-through text-red-600">
                            {formatValueForDisplay(change.oldValue, change.field)}
                          </span>
                          {' → '}
                          <span className="text-green-600 font-medium">
                            {formatValueForDisplay(change.newValue, change.field)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Resumo da Operação
              </h4>
              <p className="text-sm text-green-700 mt-1">
                {selectedCount > 0 ? (
                  <>
                    {selectedCount} alteração(ões) será(ão) aplicada(s) a {futureOpenRecords.length} registro(s) 
                    recorrente(s) futuro(s). Registros já processados (pagos/recebidos) não serão afetados.
                  </>
                ) : (
                  'Nenhuma alteração selecionada para aplicar.'
                )}
              </p>
              {futureOpenRecords.length > 0 && selectedCount > 0 && (
                <p className="text-xs text-green-600 mt-2">
                  Registros que serão afetados: {futureOpenRecords.length} de {futureRecords.length} total
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={selectedCount === 0 || loading}
          >
            {loading ? 'Aplicando...' : `Aplicar ${selectedCount} Alteração(ões)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RecurrenceReplicationModal;