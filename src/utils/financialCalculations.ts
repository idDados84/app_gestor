// Utilitários para cálculos financeiros

export interface FinancialValues {
  valor_operacao: number;
  valor_juros: number;
  valor_multas: number;
  valor_atualizacao: number;
  valor_descontos: number;
  valor_abto: number;
  valor_pagto: number;
}

/**
 * Calcula o valor financeiro usando a fórmula:
 * valor_financeiro = valor_operacao + valor_juros + valor_multas + valor_atualizacao - valor_descontos - valor_abto - valor_pagto
 */
export function calculateValorFinanceiro(values: FinancialValues): number {
  const {
    valor_operacao = 0,
    valor_juros = 0,
    valor_multas = 0,
    valor_atualizacao = 0,
    valor_descontos = 0,
    valor_abto = 0,
    valor_pagto = 0
  } = values;

  return valor_operacao + valor_juros + valor_multas + valor_atualizacao - valor_descontos - valor_abto - valor_pagto;
}

/**
 * Calcula a distribuição de parcelas com entrada (parcela 0)
 * Implementa a lógica onde as primeiras parcelas recebem valores maiores
 */
export function calculateInstallmentValues(valorFinanceiro: number, totalParcelas: number, hasEntrada: boolean = false): number[] {
  const parcelasParaDistribuir = hasEntrada ? totalParcelas - 1 : totalParcelas;
  if (parcelasParaDistribuir <= 0) return [];
  
  // Calcular valor base por parcela (em centavos para evitar problemas de ponto flutuante)
  const valorEmCentavos = Math.round(valorFinanceiro * 100);
  const valorBaseCentavos = Math.floor(valorEmCentavos / parcelasParaDistribuir);
  const restoCentavos = valorEmCentavos % parcelasParaDistribuir;
  
  const valores = [];
  for (let i = 0; i < parcelasParaDistribuir; i++) {
    // As primeiras parcelas recebem o centavo extra
    const valorParcela = i < restoCentavos ? valorBaseCentavos + 1 : valorBaseCentavos;
    valores.push(valorParcela / 100); // Converter de volta para reais
  }
  
  return valores;
}

/**
 * Valida se a soma das parcelas é igual ao valor financeiro
 */
export function validateInstallmentSum(parcelas: number[], valorFinanceiro: number): boolean {
  const soma = parcelas.reduce((acc, valor) => acc + valor, 0);
  const diferenca = Math.abs(soma - valorFinanceiro);
  return diferenca < 0.01; // Tolerância de 1 centavo para arredondamentos
}

/**
 * Exemplo prático: R$ 1.000,00 parcelado em 5x com entrada R$ 100,00
 */
export function exemploCalculoFinanceiro(): {
  valores: FinancialValues;
  valorFinanceiro: number;
  distribuicao: { parcela: number; valor: number; descricao: string }[];
} {
  const valores: FinancialValues = {
    valor_operacao: 1000.00,
    valor_juros: 1.00,
    valor_multas: 2.00,
    valor_atualizacao: 3.00,
    valor_descontos: 4.00,
    valor_abto: 5.00,
    valor_pagto: 100.00 // entrada
  };

  const valorFinanceiro = calculateValorFinanceiro(valores);
  const parcelasValores = calculateInstallmentValues(valorFinanceiro, 5, true);
  
  const distribuicao = [
    { parcela: 0, valor: 100.00, descricao: 'Entrada' },
    ...parcelasValores.map((valor, index) => ({
      parcela: index + 1,
      valor,
      descricao: `Parcela ${index + 1}/5`
    }))
  ];

  return { valores, valorFinanceiro, distribuicao };
}