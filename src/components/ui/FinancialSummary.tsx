import React from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface FinancialSummaryProps {
  valorOperacao: number;
  valorJuros?: number;
  valorMultas?: number;
  valorAtualizacao?: number;
  valorDescontos?: number;
  valorAbto?: number;
  valorPagto?: number;
  valorFinanceiro: number;
  className?: string;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  valorOperacao,
  valorJuros = 0,
  valorMultas = 0,
  valorAtualizacao = 0,
  valorDescontos = 0,
  valorAbto = 0,
  valorPagto = 0,
  valorFinanceiro,
  className = ''
}) => {
  const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const totalAcrescimos = valorJuros + valorMultas + valorAtualizacao;
  const totalReducoes = valorDescontos + valorAbto + valorPagto;

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center mb-3">
        <Calculator className="h-5 w-5 text-blue-600 mr-2" />
        <h4 className="text-sm font-semibold text-blue-900">Resumo Financeiro</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {/* Valor Base */}
        <div className="space-y-2">
          <div className="flex items-center text-gray-700">
            <DollarSign className="h-4 w-4 mr-1" />
            <span className="font-medium">Valor Base:</span>
          </div>
          <div className="pl-5 text-gray-900 font-mono">
            {formatCurrency(valorOperacao)}
          </div>
        </div>

        {/* Acréscimos */}
        <div className="space-y-2">
          <div className="flex items-center text-green-700">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="font-medium">Acréscimos:</span>
          </div>
          <div className="pl-5 space-y-1 text-xs">
            {valorJuros > 0 && (
              <div className="flex justify-between">
                <span>Juros:</span>
                <span className="font-mono">+{formatCurrency(valorJuros)}</span>
              </div>
            )}
            {valorMultas > 0 && (
              <div className="flex justify-between">
                <span>Multas:</span>
                <span className="font-mono">+{formatCurrency(valorMultas)}</span>
              </div>
            )}
            {valorAtualizacao > 0 && (
              <div className="flex justify-between">
                <span>Atualização:</span>
                <span className="font-mono">+{formatCurrency(valorAtualizacao)}</span>
              </div>
            )}
            {totalAcrescimos > 0 && (
              <div className="flex justify-between font-medium text-green-700 border-t pt-1">
                <span>Total:</span>
                <span className="font-mono">+{formatCurrency(totalAcrescimos)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reduções */}
        <div className="space-y-2">
          <div className="flex items-center text-red-700">
            <TrendingDown className="h-4 w-4 mr-1" />
            <span className="font-medium">Reduções:</span>
          </div>
          <div className="pl-5 space-y-1 text-xs">
            {valorDescontos > 0 && (
              <div className="flex justify-between">
                <span>Descontos:</span>
                <span className="font-mono">-{formatCurrency(valorDescontos)}</span>
              </div>
            )}
            {valorAbto > 0 && (
              <div className="flex justify-between">
                <span>Abatimentos:</span>
                <span className="font-mono">-{formatCurrency(valorAbto)}</span>
              </div>
            )}
            {valorPagto > 0 && (
              <div className="flex justify-between">
                <span>Pagamentos:</span>
                <span className="font-mono">-{formatCurrency(valorPagto)}</span>
              </div>
            )}
            {totalReducoes > 0 && (
              <div className="flex justify-between font-medium text-red-700 border-t pt-1">
                <span>Total:</span>
                <span className="font-mono">-{formatCurrency(totalReducoes)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Valor Final */}
      <div className="mt-4 pt-3 border-t border-blue-300">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-blue-900">Valor Financeiro Final:</span>
          <span className="text-lg font-bold text-blue-900 font-mono">
            {formatCurrency(valorFinanceiro)}
          </span>
        </div>
        <p className="text-xs text-blue-700 mt-1">
          Fórmula: Base + Acréscimos - Reduções = Saldo a Pagar/Receber
        </p>
      </div>
    </div>
  );
};

export default FinancialSummary;