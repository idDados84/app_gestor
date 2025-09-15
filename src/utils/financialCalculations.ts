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
 * Garante que a soma das parcelas seja exatamente igual ao valor financeiro
 */
export function calculateInstallmentValues(valorFinanceiro: number, totalParcelas: number, hasEntrada: boolean = false): number[] {
  const parcelasParaDistribuir = hasEntrada ? totalParcelas - 1 : totalParcelas;
  if (parcelasParaDistribuir <= 0) return [];
  
  // Converter para centavos para evitar problemas de ponto flutuante
  const valorEmCentavos = Math.round(valorFinanceiro * 100);
  const valorBaseCentavos = Math.floor(valorEmCentavos / parcelasParaDistribuir);
  const restoCentavos = valorEmCentavos % parcelasParaDistribuir;
  
  const valores = [];
  for (let i = 0; i < parcelasParaDistribuir; i++) {
    // As primeiras parcelas recebem os centavos extras do resto da divisão
    const valorParcela = i < restoCentavos ? valorBaseCentavos + 1 : valorBaseCentavos;
    valores.push(valorParcela / 100); // Converter de volta para reais
  }
  
  // Validação: garantir que a soma seja exatamente igual ao valor financeiro
  const somaCalculada = valores.reduce((acc, valor) => acc + valor, 0);
  const diferenca = Math.abs(somaCalculada - valorFinanceiro);
  
  if (diferenca > 0.01) {
    console.warn(`Diferença na distribuição de parcelas: ${diferenca.toFixed(2)}`);
    // Ajustar a última parcela para corrigir pequenas diferenças de arredondamento
    const ajuste = valorFinanceiro - somaCalculada;
    valores[valores.length - 1] += ajuste;
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
 * Exemplo prático atualizado: R$ 897,00 (valor_financeiro) parcelado em 5x
 * Demonstra a distribuição correta com arredondamento
 */
export function exemploCalculoFinanceiro(): {
  valores: FinancialValues;
  valorFinanceiro: number;
  distribuicao: { parcela: number; valor: number; descricao: string }[];
  validacao: { somaCalculada: number; diferenca: number; isValid: boolean };
} {
  const valores: FinancialValues = {
    valor_operacao: 1000.00,
    valor_juros: 1.00,
    valor_multas: 2.00,
    valor_atualizacao: 3.00,
    valor_descontos: 4.00,
    valor_abto: 5.00,
    valor_pagto: 100.00 // pagamento já realizado (entrada)
  };

  const valorFinanceiro = calculateValorFinanceiro(valores);
  const parcelasValores = calculateInstallmentValues(valorFinanceiro, 5, false);
  
  const distribuicao = [
    ...parcelasValores.map((valor, index) => ({
      parcela: index + 1,
      valor,
      descricao: `Parcela ${index + 1}/5 (valor_financeiro: R$ ${valorFinanceiro.toFixed(2)})`
    }))
  ];

  // Validação da distribuição
  const somaCalculada = parcelasValores.reduce((acc, valor) => acc + valor, 0);
  const diferenca = Math.abs(somaCalculada - valorFinanceiro);
  const isValid = diferenca < 0.01;
  
  const validacao = { somaCalculada, diferenca, isValid };

  return { valores, valorFinanceiro, distribuicao, validacao };
}