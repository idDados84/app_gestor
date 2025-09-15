import React from 'react';
import { Calculator, TrendingUp, TrendingDown, Calendar, Hash, DollarSign } from 'lucide-react';
import { calculateValorFinanceiro, type FinancialValues } from '../../utils/financialCalculations';
import { calculateInstallmentValues } from '../../utils/financialCalculations';
import { formatDateToYYYYMMDD, parseDateFromYYYYMMDD } from '../../utils/dateUtils';

interface FinancialSummaryProps {
  values: FinancialValues;
  isInstallment?: boolean;
  totalInstallments?: number;
  startDate?: string;
  className?: string;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ 
  values, 
  isInstallment = false,
  totalInstallments = 1,
  startDate = '',
  className = '' 
}) => {
  const valorFinanceiro = calculateValorFinanceiro(values);
  
  const acrescimos = values.valor_juros + values.valor_multas + values.valor_atualizacao;
  const reducoes = values.valor_descontos + values.valor_abto + values.valor_pagto;
  
  // Calculate installment preview if applicable
  const installmentPreview = React.useMemo(() => {
    if (!isInstallment || totalInstallments <= 1 || valorFinanceiro <= 0 || !startDate) {
      return null;
    }
    
    const installmentValues = calculateInstallmentValues(valorFinanceiro, totalInstallments, false);
    const baseDate = parseDateFromYYYYMMDD(startDate);
    
    return installmentValues.map((value, index) => {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(installmentDate.getMonth() + index);
      
      return {
        number: index + 1,
        value,
        dueDate: formatDateToYYYYMMDD(installmentDate),
        displayDate: installmentDate.toLocaleDateString('pt-BR')
      };
    });
  }, [isInstallment, totalInstallments, valorFinanceiro, startDate]);

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center mb-3">
        <Calculator className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-sm font-medium text-gray-900">Resumo Financeiro</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        {/* Valor base */}
        <div className="flex justify-between">
          <span className="text-gray-600">Valor da Operação:</span>
          <span className="font-medium">R$ {values.valor_operacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        
        {/* Acréscimos */}
        {acrescimos > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Acréscimos:
            </span>
            <span>+ R$ {acrescimos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        
        {/* Reduções */}
        {reducoes > 0 && (
          <div className="flex justify-between text-red-600">
            <span className="flex items-center">
              <TrendingDown className="h-3 w-3 mr-1" />
              Reduções:
            </span>
            <span>- R$ {reducoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        
        {/* Linha divisória */}
        <hr className="border-gray-300" />
        
        {/* Valor final */}
        <div className="flex justify-between font-semibold text-lg">
          <span className="text-gray-900">Valor Financeiro:</span>
          <span className={`${valorFinanceiro >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            R$ {valorFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      
      {/* Fórmula */}
      <div className="mt-3 pt-3 border-t border-gray-300">
        <p className="text-xs text-gray-500 font-mono">
          Fórmula: Operação + Juros + Multas + Atualização - Descontos - Abatimentos - Pagamentos
        </p>
      </div>
      
      {/* Installment Preview */}
      {installmentPreview && installmentPreview.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="flex items-center mb-3">
            <Calendar className="h-4 w-4 text-purple-600 mr-2" />
            <h4 className="text-sm font-medium text-gray-900">
              Simulação de Parcelas ({totalInstallments}x)
            </h4>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 mb-2 px-2">
              <div className="flex items-center">
                <Hash className="h-3 w-3 mr-1" />
                Parcela
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Vencimento
              </div>
              <div className="flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />
                Valor
              </div>
            </div>
            
            <div className="space-y-1">
              {installmentPreview.map((installment, index) => (
                <div 
                  key={index}
                  className={`grid grid-cols-3 gap-2 text-xs py-2 px-2 rounded ${
                    index === installmentPreview.length - 1 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-white border border-gray-100'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {installment.number}/{totalInstallments}
                  </div>
                  <div className="text-gray-700">
                    {installment.displayDate}
                  </div>
                  <div className={`font-medium ${
                    index === installmentPreview.length - 1 
                      ? 'text-blue-600' 
                      : 'text-gray-900'
                  }`}>
                    R$ {installment.value.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total verification */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                <div className="text-gray-600">TOTAL:</div>
                <div></div>
                <div className="text-blue-600">
                  R$ {installmentPreview.reduce((sum, inst) => sum + inst.value, 0).toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-3 text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-white border border-gray-100 rounded mr-1"></div>
                <span>Parcelas intermediárias (valores inteiros)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded mr-1"></div>
                <span>Última parcela (ajuste exato)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialSummary;