import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { AlertTriangle, CheckSquare, Square, Info } from 'lucide-react';
import type { ContaPagar, ContaReceber } from '../../types/database';

interface MassCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  records: (ContaPagar | ContaReceber)[];
  type: 'pagar' | 'receber';
  loading?: boolean;
}

const MassCancellationModal: React.FC<MassCancellationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  records,
  type,
  loading = false
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Reset selections when modal opens/closes or records change
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setSelectAll(false);
    }
  }, [isOpen, records]);

  // Get cancellable records (not already paid/received/cancelled)
  const cancellableRecords = records.filter(record => {
    const status = record.status.toLowerCase();
    return status !== 'pago' && status !== 'recebido' && status !== 'cancelado';
  });

  // Get non-cancellable records for display
  const nonCancellableRecords = records.filter(record => {
    const status = record.status.toLowerCase();
    return status === 'pago' || status === 'recebido' || status === 'cancelado';
  });

  const handleSelectRecord = (recordId: string, canSelect: boolean) => {
    if (!canSelect) return;

    const newSelected = new Set(selectedIds);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedIds(newSelected);
    
    // Update select all state
    setSelectAll(newSelected.size === cancellableRecords.length && cancellableRecords.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      // Select all cancellable records
      const allCancellableIds = new Set(cancellableRecords.map(r => r.id));
      setSelectedIds(allCancellableIds);
      setSelectAll(true);
    }
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pago':
        return 'Já Pago';
      case 'recebido':
        return 'Já Recebido';
      case 'cancelado':
        return 'Já Cancelado';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pago':
      case 'recebido':
        return 'text-green-600 bg-green-50';
      case 'cancelado':
        return 'text-gray-600 bg-gray-50';
      case 'pendente':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const canSelectRecord = (record: ContaPagar | ContaReceber) => {
    const status = record.status.toLowerCase();
    return status !== 'pago' && status !== 'recebido' && status !== 'cancelado';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancelamento em Massa - Contas a ${type === 'pagar' ? 'Pagar' : 'Receber'}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Warning Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Atenção: Cancelamento de Registros Parcelados/Recorrentes
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Você está prestes a cancelar registros que fazem parte de uma série. 
                Selecione abaixo quais registros deseja cancelar. Registros já processados 
                não podem ser cancelados.
              </p>
            </div>
          </div>
        </div>

        {/* Select All Controls */}
        {cancellableRecords.length > 0 && (
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
              {selectAll ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
            <span className="text-sm text-gray-600">
              {selectedIds.size} de {cancellableRecords.length} selecionados
            </span>
          </div>
        )}

        {/* Records List */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selecionar
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parcela
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => {
                const canSelect = canSelectRecord(record);
                const isSelected = selectedIds.has(record.id);
                
                return (
                  <tr 
                    key={record.id} 
                    className={`${canSelect ? 'hover:bg-gray-50' : 'bg-gray-25'} ${
                      !canSelect ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleSelectRecord(record.id, canSelect)}
                        disabled={!canSelect || loading}
                        className={`${
                          canSelect 
                            ? 'text-blue-600 hover:text-blue-800' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.descricao}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      R$ {record.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.data_vencimento ? (() => {
                        const [year, month, day] = record.data_vencimento.split('-').map(Number);
                        const date = new Date(year, month - 1, day);
                        return date.toLocaleDateString('pt-BR');
                      })() : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {record.numero_parcela && record.total_parcelas 
                        ? `${record.numero_parcela}/${record.total_parcelas}`
                        : record.eh_recorrente 
                        ? 'Recorrente' 
                        : '-'
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Info about non-cancellable records */}
        {nonCancellableRecords.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  Registros não canceláveis
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  {nonCancellableRecords.length} registro(s) não podem ser cancelados pois já foram 
                  processados (pagos/recebidos) ou já estão cancelados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No cancellable records message */}
        {cancellableRecords.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Info className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Nenhum registro pode ser cancelado
            </h3>
            <p className="text-sm text-gray-600">
              Todos os registros desta série já foram processados ou cancelados.
            </p>
          </div>
        )}

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
            variant="danger"
            onClick={handleConfirm}
            disabled={selectedIds.size === 0 || loading}
          >
            {loading ? 'Cancelando...' : `Cancelar ${selectedIds.size} Registro(s)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MassCancellationModal;