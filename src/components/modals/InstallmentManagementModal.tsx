import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Edit3, Save, X, AlertTriangle, Calculator } from 'lucide-react';
import type { ContaPagar, ContaReceber, ContaFinanceira, FormaCobranca } from '../../types/database';
import { formatDateToYYYYMMDD, parseDateFromYYYYMMDD } from '../../utils/dateUtils';

interface InstallmentData {
  id: string;
  installmentNumber: number;
  skuParcela: string;
  dueDate: string;
  collectionMethodId: string;
  collectionAccountId: string;
  amount: number;
  isEditing: boolean;
}

interface InstallmentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (installments: InstallmentData[]) => void;
  records: (ContaPagar | ContaReceber)[];
  type: 'pagar' | 'receber';
  contasFinanceiras: ContaFinanceira[];
  formasCobranca: FormaCobranca[];
  loading?: boolean;
}

const InstallmentManagementModal: React.FC<InstallmentManagementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  records,
  type,
  contasFinanceiras,
  formasCobranca,
  loading = false
}) => {
  const [installments, setInstallments] = useState<InstallmentData[]>([]);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize installments when modal opens or records change
  useEffect(() => {
    if (isOpen && records.length > 0) {
      const sortedRecords = [...records].sort((a, b) => {
        const aNum = a.numero_parcela || 1;
        const bNum = b.numero_parcela || 1;
        return aNum - bNum;
      });

      const installmentData: InstallmentData[] = sortedRecords.map((record, index) => ({
        id: record.id,
        installmentNumber: record.numero_parcela || (index + 1),
        skuParcela: record.sku_parcela || generateSKU(record, index + 1, sortedRecords.length),
        dueDate: record.data_vencimento,
        collectionMethodId: record.forma_cobranca_id || '',
        collectionAccountId: record.conta_cobranca_id || '',
        amount: record.valor_parcela || 0,
        isEditing: false
      }));

      setInstallments(installmentData);
      
      const total = installmentData.reduce((sum, inst) => sum + inst.amount, 0);
      setOriginalTotal(total);
      setCurrentTotal(total);
    }
  }, [isOpen, records]);

  // Update current total when installments change
  useEffect(() => {
    const total = installments.reduce((sum, inst) => sum + inst.amount, 0);
    setCurrentTotal(total);
  }, [installments]);

  const generateSKU = (record: ContaPagar | ContaReceber, installmentNum: number, totalInstallments: number): string => {
    // Get document type code (first 3 digits) - fallback to 'DOC' if not available
    const docTypeCode = record.tipo_documento_id?.substring(0, 3) || 'DOC';
    
    // Get origin document number - fallback to record ID substring
    const originDoc = record.n_docto_origem || record.id.substring(0, 8);
    
    // Get participant document last 2 digits - fallback to '00'
    const participantDoc = record.participantes?.documento || '';
    const lastTwoDigits = participantDoc.length >= 2 ? participantDoc.slice(-2) : '00';
    
    return `${docTypeCode}_${originDoc}-${installmentNum}-${totalInstallments}_${lastTwoDigits}`;
  };

  const handleEditToggle = (index: number) => {
    setInstallments(prev => prev.map((inst, i) => 
      i === index ? { ...inst, isEditing: !inst.isEditing } : inst
    ));
  };

  const handleFieldChange = (index: number, field: keyof InstallmentData, value: any) => {
    setInstallments(prev => prev.map((inst, i) => 
      i === index ? { ...inst, [field]: value } : inst
    ));
    
    // Clear error for this field
    const errorKey = `${index}-${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleAmountChange = (index: number, newAmount: number) => {
    const oldAmount = installments[index].amount;
    const difference = newAmount - oldAmount;
    
    // Update the current installment
    const updatedInstallments = [...installments];
    updatedInstallments[index].amount = newAmount;
    
    // Distribute the difference among subsequent installments
    if (difference !== 0 && index < updatedInstallments.length - 1) {
      const remainingInstallments = updatedInstallments.length - index - 1;
      const adjustmentPerInstallment = difference / remainingInstallments;
      
      for (let i = index + 1; i < updatedInstallments.length; i++) {
        updatedInstallments[i].amount = Math.max(0, updatedInstallments[i].amount - adjustmentPerInstallment);
      }
    }
    
    setInstallments(updatedInstallments);
  };

  const handleAutoDistribute = () => {
    if (installments.length === 0) return;
    
    const totalAmount = originalTotal;
    const numInstallments = installments.length;
    
    if (numInstallments === 0) return;
    
    const updatedInstallments = [...installments];
    let valorRestante = totalAmount;
    
    // Para as primeiras N-1 parcelas: arredondar para cima para números inteiros
    for (let i = 0; i < numInstallments - 1; i++) {
      const parcelasRestantes = numInstallments - i;
      const valorMedio = valorRestante / parcelasRestantes;
      const valorParcela = Math.ceil(valorMedio); // Arredonda para cima para número inteiro
      
      updatedInstallments[i].amount = valorParcela;
      valorRestante -= valorParcela;
    }
    
    // A última parcela recebe o valor restante exato (pode ter centavos)
    updatedInstallments[numInstallments - 1].amount = Math.round(valorRestante * 100) / 100;
    
    setInstallments(updatedInstallments);
  };

  const validateInstallments = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // Check total amount
    const totalDifference = Math.abs(currentTotal - originalTotal);
    if (totalDifference > 0.01) {
      newErrors.total = `Total das parcelas (R$ ${currentTotal.toFixed(2)}) deve ser igual ao valor original (R$ ${originalTotal.toFixed(2)})`;
      isValid = false;
    }
    
    // Check individual installments
    installments.forEach((inst, index) => {
      if (inst.amount <= 0) {
        newErrors[`${index}-amount`] = 'Valor deve ser maior que zero';
        isValid = false;
      }
      
      if (!inst.dueDate) {
        newErrors[`${index}-dueDate`] = 'Data de vencimento é obrigatória';
        isValid = false;
      }
      
      if (!inst.skuParcela.trim()) {
        newErrors[`${index}-sku`] = 'SKU da parcela é obrigatório';
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSave = () => {
    if (!validateInstallments()) {
      return;
    }
    
    onSave(installments);
  };

  const contasOptions = contasFinanceiras.map(conta => ({
    value: conta.id,
    label: `${conta.codigo_conta} - ${conta.nome_conta}`
  }));

  const formasOptions = formasCobranca.map(forma => ({
    value: forma.id,
    label: forma.nome
  }));

  const totalDifference = currentTotal - originalTotal;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gerenciamento de Parcelas - ${type === 'pagar' ? 'Contas a Pagar' : 'Contas a Receber'}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Summary Header */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Resumo das Parcelas
              </h3>
              <p className="text-sm text-gray-600">
                {installments.length} parcela(s) • Valor Original: R$ {originalTotal.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Atual:</p>
              <p className={`text-lg font-semibold ${
                Math.abs(totalDifference) > 0.01 ? 'text-red-600' : 'text-green-600'
              }`}>
                R$ {currentTotal.toFixed(2)}
              </p>
              {Math.abs(totalDifference) > 0.01 && (
                <p className="text-xs text-red-600">
                  Diferença: R$ {totalDifference.toFixed(2)}
                </p>
              )}
            </div>
          </div>
          
          {/* Auto Distribute Button */}
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAutoDistribute}
              icon={Calculator}
              disabled={loading}
            >
              Distribuir Automaticamente
            </Button>
          </div>
        </div>

        {/* Error Summary */}
        {hasErrors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  Corrija os seguintes erros:
                </h4>
                <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Installments Table */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parcela
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forma Cobrança
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conta Cobrança
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {installments.map((installment, index) => (
                <tr key={installment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {installment.installmentNumber}
                  </td>
                  
                  <td className="px-4 py-3">
                    {installment.isEditing ? (
                      <Input
                        value={installment.skuParcela}
                        onChange={(e) => handleFieldChange(index, 'skuParcela', e.target.value)}
                        className="text-xs"
                        error={errors[`${index}-sku`]}
                      />
                    ) : (
                      <span className="text-xs text-gray-900 font-mono">
                        {installment.skuParcela}
                      </span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3">
                    {installment.isEditing ? (
                      <Input
                        type="date"
                        value={installment.dueDate}
                        onChange={(e) => handleFieldChange(index, 'dueDate', e.target.value)}
                        className="text-xs"
                        error={errors[`${index}-dueDate`]}
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {installment.dueDate ? (() => {
                          const [year, month, day] = installment.dueDate.split('-').map(Number);
                          const date = new Date(year, month - 1, day);
                          return date.toLocaleDateString('pt-BR');
                        })() : '-'}
                      </span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3">
                    {installment.isEditing ? (
                      <Select
                        value={installment.collectionMethodId}
                        onChange={(e) => handleFieldChange(index, 'collectionMethodId', e.target.value)}
                        options={formasOptions}
                        placeholder="Selecione"
                        className="text-xs"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {formasCobranca.find(f => f.id === installment.collectionMethodId)?.nome || '-'}
                      </span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3">
                    {installment.isEditing ? (
                      <Select
                        value={installment.collectionAccountId}
                        onChange={(e) => handleFieldChange(index, 'collectionAccountId', e.target.value)}
                        options={contasOptions}
                        placeholder="Selecione"
                        className="text-xs"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {contasFinanceiras.find(c => c.id === installment.collectionAccountId)?.nome_conta || '-'}
                      </span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3">
                    {installment.isEditing ? (
                      <Input
                        type="number"
                        value={installment.amount.toString()}
                        onChange={(e) => handleAmountChange(index, parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        className="text-xs"
                        error={errors[`${index}-amount`]}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        R$ {installment.amount.toFixed(2)}
                      </span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEditToggle(index)}
                      className={`p-1 rounded ${
                        installment.isEditing 
                          ? 'text-green-600 hover:text-green-800' 
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                      disabled={loading}
                    >
                      {installment.isEditing ? (
                        <Save className="h-4 w-4" />
                      ) : (
                        <Edit3 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            onClick={handleSave}
            disabled={hasErrors || loading}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InstallmentManagementModal;