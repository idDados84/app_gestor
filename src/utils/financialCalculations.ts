// Utilitários para cálculos financeiros
import { supabase } from '../lib/supabase';

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

/**
 * Generates SKU for new financial records
 * Format: XX-YYYYYY-Z-AA-BB
 * XX = código do tipo de documento (2 dígitos)
 * YYYYYY = número do documento origem (6 dígitos)
 * Z = quantidade de parcelas/ocorrências (1 dígito)
 * AA = número da parcela/ocorrência (2 dígitos)
 * BB = 2 últimos dígitos do documento do participante
 */
export async function generateSkuForNewRecord(
  tipoDocumentoId: string | null,
  nDoctoOrigem: string | null,
  participantId: string,
  currentInstallmentNum: number,
  totalInstallmentsInSeries: number
): Promise<string> {
  try {
    // Get document type code
    let docTypeCode = 'DOC';
    if (tipoDocumentoId) {
      const { data: tipoDoc } = await supabase
        .from('tipos_documentos')
        .select('codigo_tipo')
        .eq('id', tipoDocumentoId)
        .single();
      
      if (tipoDoc?.codigo_tipo) {
        docTypeCode = tipoDoc.codigo_tipo;
      }
    }
    
    // Get participant document
    let participantDoc = '';
    const { data: participant } = await supabase
      .from('participantes')
      .select('documento')
      .eq('id', participantId)
      .single();
    
    if (participant?.documento) {
      participantDoc = participant.documento;
    }
    
    // Format components
    const docTypeFormatted = docTypeCode.padStart(2, '0');
    const originDocFormatted = (nDoctoOrigem || participantId.substring(0, 6)).padStart(6, '0');
    const totalParcelasFormatted = totalInstallmentsInSeries.toString().padStart(1, '0');
    const numeroParcelaFormatted = currentInstallmentNum.toString().padStart(2, '0');
    
    // Get last 2 digits from participant document
    const numericDoc = participantDoc.replace(/\D/g, '');
    const lastTwoDigits = numericDoc.length >= 2 ? numericDoc.slice(-2) : '00';
    
    // Generate SKU
    return `${docTypeFormatted}-${originDocFormatted}-${totalParcelasFormatted}-${numeroParcelaFormatted}-${lastTwoDigits}`;
  } catch (error) {
    console.error('Error generating SKU:', error);
    // Fallback SKU generation
    const fallbackOrigin = (nDoctoOrigem || participantId.substring(0, 6)).padStart(6, '0');
    const totalFormatted = totalInstallmentsInSeries.toString().padStart(1, '0');
    const currentFormatted = currentInstallmentNum.toString().padStart(2, '0');
    return `DOC-${fallbackOrigin}-${totalFormatted}-${currentFormatted}-00`;
  }
}