/**
 * Utility functions for financial calculations in the system
 */

/**
 * Calculates the financial value using the standard formula
 * valor_financeiro = valor_operacao + valor_juros + valor_multas + valor_atualizacao - valor_descontos - valor_abto - valor_pagto
 */
export function calculateValorFinanceiro(
  valorOperacao: number,
  valorJuros: number = 0,
  valorMultas: number = 0,
  valorAtualizacao: number = 0,
  valorDescontos: number = 0,
  valorAbto: number = 0,
  valorPagto: number = 0
): number {
  const result = valorOperacao + valorJuros + valorMultas + valorAtualizacao - valorDescontos - valorAbto - valorPagto;
  return Math.max(0, Number(result.toFixed(2)));
}

/**
 * Distributes a total amount across installments with proper rounding
 * First installments receive higher values when there's remainder
 */
export function distributeInstallmentValues(
  valorFinanceiro: number,
  totalParcelas: number,
  hasEntrada: boolean = false
): number[] {
  const parcelasParaDistribuir = hasEntrada ? totalParcelas - 1 : totalParcelas;
  
  if (parcelasParaDistribuir <= 0) {
    return [];
  }
  
  // Calculate base value per installment (rounded down to cents)
  const valorBase = Math.floor((valorFinanceiro * 100) / parcelasParaDistribuir) / 100;
  
  // Calculate remainder in cents
  const resto = valorFinanceiro - (valorBase * parcelasParaDistribuir);
  const centavosResto = Math.round(resto * 100);
  
  // Distribute values
  const valores: number[] = [];
  for (let i = 0; i < parcelasParaDistribuir; i++) {
    const valorParcela = i < centavosResto ? valorBase + 0.01 : valorBase;
    valores.push(Number(valorParcela.toFixed(2)));
  }
  
  return valores;
}

/**
 * Validates that installment values sum exactly to the financial value
 */
export function validateInstallmentSum(
  valoresParcelas: number[],
  valorFinanceiro: number,
  tolerance: number = 0.01
): { isValid: boolean; difference: number } {
  const soma = valoresParcelas.reduce((acc, valor) => acc + valor, 0);
  const difference = Math.abs(soma - valorFinanceiro);
  
  return {
    isValid: difference <= tolerance,
    difference: Number(difference.toFixed(2))
  };
}

/**
 * Generates installment breakdown for display
 */
export function generateInstallmentBreakdown(
  valorOperacao: number,
  valorJuros: number = 0,
  valorMultas: number = 0,
  valorAtualizacao: number = 0,
  valorDescontos: number = 0,
  valorAbto: number = 0,
  valorPagto: number = 0,
  totalParcelas: number = 1,
  hasEntrada: boolean = false
): {
  valorFinanceiro: number;
  entrada: number;
  parcelas: number[];
  resumo: string;
} {
  const valorFinanceiro = calculateValorFinanceiro(
    valorOperacao, valorJuros, valorMultas, valorAtualizacao, 
    valorDescontos, valorAbto, valorPagto
  );
  
  const entrada = hasEntrada ? valorPagto : 0;
  const parcelas = distributeInstallmentValues(valorFinanceiro, totalParcelas, hasEntrada);
  
  const resumo = hasEntrada 
    ? `Entrada: R$ ${entrada.toFixed(2)} + ${parcelas.length} parcelas`
    : `${parcelas.length} parcelas de R$ ${parcelas[0]?.toFixed(2) || '0,00'}`;
  
  return {
    valorFinanceiro,
    entrada,
    parcelas,
    resumo
  };
}

/**
 * Example calculation based on the provided scenario
 */
export function exampleCalculation(): {
  scenario: string;
  breakdown: ReturnType<typeof generateInstallmentBreakdown>;
} {
  const scenario = "Operação R$ 1.000 parcelada em 5x com entrada R$ 100";
  
  const breakdown = generateInstallmentBreakdown(
    1000.00, // valor_operacao
    1.00,    // valor_juros
    2.00,    // valor_multas
    3.00,    // valor_atualizacao
    4.00,    // valor_descontos
    5.00,    // valor_abto
    100.00,  // valor_pagto (entrada)
    5,       // total_parcelas
    true     // hasEntrada
  );
  
  return { scenario, breakdown };
}