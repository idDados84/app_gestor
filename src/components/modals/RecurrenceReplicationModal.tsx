import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { CheckSquare, Square, Info, Calendar, DollarSign, FileText, Tag } from 'lucide-react';
import type { ContaPagar, ContaReceber } from '../../types/database';

interface FieldChange {
  field: string;
  label: string;
  icon: React.ComponentType<any>;
  oldValue: any;
  newValue: any;
  selected: boolean;
  description: string;
}

interface RecurrenceReplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedChanges: FieldChange[]) => void;
  originalRecord: ContaPagar | ContaReceber;
  updatedRecord: ContaPagar | ContaReceber;
  futureRecords: (ContaPagar | ContaReceber)[];
  type: 'pagar' | 'receber';
  loading?: boolean;
}

const RecurrenceReplicationModal: React.FC<RecurrenceReplicationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  originalRecord,
  updatedRecord,
  futureRecords,
  type,
  loading = false
}) => {
  const [fieldChanges, setFieldChanges] = useState<FieldChange[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Detect changes between original and updated records
  useEffect(() => {
    if (isOpen && originalRecord && updatedRecord) {
      const changes: FieldChange[] = [];

      // Check data_vencimento
      if (originalRecord.data_vencimento !== updatedRecord.data_vencimento) {
        const oldDate = new Date(originalRecord.data_vencimento);
        const newDate = new Date(updatedRecord.data_vencimento);
        const oldDay = oldDate.getDate();
        const newDay = newDate.getDate();
        
        changes.push({
          field: 'data_vencimento',
          label: 'Data de Vencimento',
          icon: Calendar,
          oldValue: originalRecord.data_vencimento,
          newValue: updatedRecord.data_vencimento,
          selected: true,
          description: `Atualizar a data de vencimento dos próximos registros para o dia "${newDay}" de cada período? (anterior: dia ${oldDay})`
        });
      }

      // Check valor
      if (originalRecord.valor !== updatedRecord.valor) {
        changes.push({
          field: 'valor',
          label: 'Valor',
          icon: DollarSign,
          oldValue: originalRecord.valor,
          newValue: updatedRecord.valor,
          selected: true,
          description: `Atualizar o valor dos próximos registros para R$ ${updatedRecord.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}? (anterior: R$ ${originalRecord.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
        });
      }

      // Check descricao
      if (originalRecord.descricao !== updatedRecord.descricao) {
        changes.push({
          field: 'descricao',
          label: 'Descrição',
          icon: FileText,
          oldValue: originalRecord.descricao,
          newValue: updatedRecord.descricao,
          selected: true,
          description: `Atualizar a descrição dos próximos registros para "${updatedRecord.descricao}"? (anterior: "${originalRecord.descricao}")`
        });
      }

      // Check categoria_id
      if (originalRecord.categoria_id !== updatedRecord.categoria_id) {
        changes.push({
          field: 'categoria_id',
          label: 'Categoria',
          icon: Tag,
          oldValue: originalRecord.categoria_id,
          newValue: updatedRecord.categoria_id,
          selected: true,
          description: `Atualizar a categoria dos próximos registros? (categoria alterada)`
        });
      }

      // Check observacoes
      if (originalRecord.observacoes !== updatedRecord.observacoes) {
        changes.push({
          field: 'observacoes',
          label: 'Observações',
          icon: FileText,
          oldValue: originalRecord.observacoes,
          newValue: updatedRecord.observacoes,
          selected: false, // Default to false for observations
          description: `Atualizar as observações dos próximos registros?`
        });
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
  const futureOpenRecords = futureRecords.filter(record => 
    record.status.toLowerCase() !== 'pago' && 
    record.status.toLowerCase() !== 'recebido' && 
    record.status.toLowerCase() !== 'cancelado'
  );

  if (fieldChanges.length === 0) {
    return null; // Don't show modal if no changes detected
  }

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

        {/* Changes List */}
        <div className="space-y-3">
          {fieldChanges.map((change, index) => {
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
                    onClick={() => handleFieldToggle(index)}
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
                    
                    {/* Value comparison for specific fields */}
                    {change.field === 'valor' && (
                      <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                        <span className="line-through text-red-600">
                          R$ {change.oldValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {' → '}
                        <span className="text-green-600 font-medium">
                          R$ {change.newValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    
                    {change.field === 'data_vencimento' && (
                      <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                        <span className="line-through text-red-600">
                          {new Date(change.oldValue).toLocaleDateString('pt-BR')}
                        </span>
                        {' → '}
                        <span className="text-green-600 font-medium">
                          {new Date(change.newValue).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Resumo da Operação
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                {selectedCount > 0 ? (
                  <>
                    {selectedCount} alteração(ões) será(ão) aplicada(s) a {futureOpenRecords.length} registro(s) 
                    recorrente(s) futuro(s). Registros já processados (pagos/recebidos) não serão afetados.
                  </>
                ) : (
                  'Nenhuma alteração selecionada para aplicar.'
                )}
              </p>
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