/*
  # Adicionar coluna tipo_registro à tabela tbl_parcelas

  1. Alterações
    - Adiciona coluna `tipo_registro` à tabela `tbl_parcelas`
    - Define valores padrão e constraints apropriados
    - Adiciona índice para otimização de consultas
*/

-- Adicionar coluna tipo_registro à tabela tbl_parcelas
ALTER TABLE public.tbl_parcelas 
ADD COLUMN tipo_registro TEXT DEFAULT 'pagar' CHECK (tipo_registro IN ('pagar', 'receber'));

-- Criar índice para otimização de consultas por tipo_registro
CREATE INDEX idx_tbl_parcelas_tipo_registro ON public.tbl_parcelas (tipo_registro);

-- Comentário para documentação
COMMENT ON COLUMN public.tbl_parcelas.tipo_registro IS 'Tipo do registro financeiro: pagar ou receber';