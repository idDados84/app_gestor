import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { CheckSquare, Square, Info, Calendar, DollarSign, FileText, Tag, AlertTriangle } from 'lucide-react';
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

interface InstallmentReplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedChanges: FieldChange[]) => void;
  originalRecord: ContaPagar | ContaReceber;
  updatedRecord: ContaPagar | ContaReceber;
  futureInstallments: (ContaPagar | ContaReceber)[];
  type: 'pagar' | 'receber';
  loading?: boolean;
}

const InstallmentReplicationModal: React.FC<InstallmentReplicationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  originalRecord,
  updatedRecord,
  futureInstallments,
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
        const dayDifference = newDay - oldDay;
        
        changes.push({
          field: 'data_vencimento',
          label: 'Data de Vencimento',
          icon: Calendar,
          oldValue: originalRecord.data_vencimento,
          newValue: updatedRecord.data_vencimento,
          selected: true,
          description: `Ajustar as datas de vencimento das próximas parcelas em ${dayDifference > 0 ? '+' : ''}${dayDifference} dia(s)? (anterior: dia ${oldDay}, novo: dia ${newDay})`
        });
      }

      // Check valor
      if (originalRecord.valor_parcela !== updatedRecord.valor_parcela || originalRecord.valor_operacao !== updatedRecord.valor_operacao) {
        const valorAnterior = originalRecord.valor_parcela;
        const valorNovo = updatedRecord.valor_parcela;
        const valorDifference = valorNovo - valorAnterior;
        const isIncrease = valorDifference > 0;
        
        changes.push({
          field: 'valor_parcela',
          label: 'Valor',
          icon: DollarSign,
          oldValue: valorAnterior,
          newValue: valorNovo,
          selected: true,
          description: `${isIncrease ? 'Aumentar' : 'Diminuir'} o valor das próximas parcelas em R$ ${Math.abs(valorDifference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}? (de R$ ${valorAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para R$ ${valorNovo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
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
          description: `Atualizar a descrição das próximas parcelas para "${updatedRecord.descricao}"? (anterior: "${originalRecord.descricao}")`
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
          description: `Atualizar a categoria das próximas parcelas? (categoria alterada)`
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
          description: `Atualizar as observações das próximas parcelas?`
        });
      }

      // Check forma_cobranca_id
      if (originalRecord.forma_cobranca_id !== updatedRecord.forma_cobranca_id) {
        changes.push({
          field: 'forma_cobranca_id',
          label: 'Forma de Cobrança',
          icon: FileText,
          oldValue: originalRecord.forma_cobranca_id,
          newValue: updatedRecord.forma_cobranca_id,
          selected: true,
          description: `Atualizar a forma de cobrança das próximas parcelas?`
        });
      }

      // Check conta_cobranca_id
      if (originalRecord.conta_cobranca_id !== updatedRecord.conta_cobranca_id) {
        changes.push({
          field: 'conta_cobranca_id',
          label: 'Conta de Cobrança',
          icon: FileText,
          oldValue: originalRecord.conta_cobranca_id,
          newValue: updatedRecord.conta_cobranca_id,
          selected: true,
          description: `Atualizar a conta de cobrança das próximas parcelas?`
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
  const futureOpenInstallments = futureInstallments.filter(record => {
    const status = record.status.toLowerCase();
    return status !== 'pago' && status !== 'recebido' && status !== 'cancelado';
  });

  if (fieldChanges.length === 0) {
    return null; // Don't show modal if no changes detected
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Replicar Alterações - Parcelas ${type === 'pagar' ? 'a Pagar' : 'a Receber'}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Info Header */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Alterações Detectadas em Parcela
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Foram detectadas {fieldChanges.length} alteração(ões) na parcela atual. 
                Selecione quais alterações deseja aplicar às {futureOpenInstallments.length} parcela(s) 
                futura(s) em aberto desta série.
              </p>
            </div>
          </div>
        </div>

        {/* Warning for installment-specific considerations */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Atenção: Alterações em Parcelas
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                • <strong>Datas:</strong> Serão ajustadas mantendo o intervalo mensal entre parcelas<br/>
                • <strong>Valores:</strong> Serão aplicados igualmente a todas as parcelas selecionadas<br/>
                • <strong>Outros campos:</strong> Serão replicados exatamente como alterado
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
                    
                    {(change.field === 'descricao' || change.field === 'observacoes') && (
                      <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                        <span className="line-through text-red-600">
                          "{change.oldValue || 'Vazio'}"
                        </span>
                        {' → '}
                        <span className="text-green-600 font-medium">
                          "{change.newValue || 'Vazio'}"
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Resumo da Operação - Parcelas
              </h4>
              <p className="text-sm text-green-700 mt-1">
                {selectedCount > 0 ? (
                  <>
                    {selectedCount} alteração(ões) será(ão) aplicada(s) a {futureOpenInstallments.length} parcela(s) 
                    futura(s). Parcelas já processadas (pagas/recebidas) não serão afetadas.
                  </>
                ) : (
                  'Nenhuma alteração selecionada para aplicar às próximas parcelas.'
                )}
              </p>
              {futureOpenInstallments.length > 0 && (
                <p className="text-xs text-green-600 mt-2">
                  Parcelas afetadas: {futureOpenInstallments.map(p => `#${p.numero_parcela}`).join(', ')}
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
            {loading ? 'Aplicando...' : `Aplicar ${selectedCount} Alteração(ões) às Parcelas`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InstallmentReplicationModal;