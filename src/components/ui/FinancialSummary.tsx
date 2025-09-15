import React from 'react';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { calculateValorFinanceiro, type FinancialValues } from '../../utils/financialCalculations';

interface FinancialSummaryProps {
  values: FinancialValues;
  className?: string;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ values, className = '' }) => {
  const valorFinanceiro = calculateValorFinanceiro(values);
  
  const acrescimos = values.valor_juros + values.valor_multas + values.valor_atualizacao;
  const reducoes = values.valor_descontos + values.valor_abto + values.valor_pagto;

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
    </div>
  );
};

export default FinancialSummary;