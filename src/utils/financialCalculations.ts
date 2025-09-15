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
 * Implementa a lógica de arredondamento para cima nas parcelas intermediárias
 * e ajuste exato na última parcela para totalizar o valor_financeiro
 * Garante que a soma das parcelas seja exatamente igual ao valor financeiro
 */
export function calculateInstallmentValues(valorFinanceiro: number, totalParcelas: number, hasEntrada: boolean = false): number[] {
  const parcelasParaDistribuir = hasEntrada ? totalParcelas - 1 : totalParcelas;
  if (parcelasParaDistribuir <= 0) return [];
  
  const valores = [];
  let valorRestante = valorFinanceiro;
  
  // Para as primeiras N-1 parcelas: arredondar para cima para números inteiros
  for (let i = 0; i < parcelasParaDistribuir - 1; i++) {
    const parcelasRestantes = parcelasParaDistribuir - i;
    const valorMedio = valorRestante / parcelasRestantes;
    const valorParcela = Math.ceil(valorMedio); // Arredonda para cima para número inteiro
    
    valores.push(valorParcela);
    valorRestante -= valorParcela;
  }
  
  // A última parcela recebe o valor restante exato (pode ter centavos)
  valores.push(Math.round(valorRestante * 100) / 100); // Arredonda para 2 casas decimais
  
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
 * Exemplo prático: R$ 897,00 (valor_financeiro) parcelado em 5x
 * Demonstra a nova lógica de arredondamento para cima e ajuste na última parcela
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
      descricao: `Parcela ${index + 1}/5 - ${index < 4 ? 'Arredondada para cima' : 'Valor exato restante'}`
    }))
  ];

  // Validação da distribuição
  const somaCalculada = parcelasValores.reduce((acc, valor) => acc + valor, 0);
  const diferenca = Math.abs(somaCalculada - valorFinanceiro);
  const isValid = diferenca < 0.01;
  
  const validacao = { somaCalculada, diferenca, isValid };

  return { valores, valorFinanceiro, distribuicao, validacao };
}