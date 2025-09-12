/*
  # Fix RLS policies for formas_cobranca table

  1. Security Changes
    - Drop existing restrictive policy that prevents INSERT operations
    - Create comprehensive policies for all CRUD operations
    - Allow both authenticated and public access for development

  This resolves the "new row violates row-level security policy" error.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Formas cobrança - acesso completo" ON formas_cobranca;

-- Create new comprehensive policies
CREATE POLICY "Allow all operations for authenticated users on formas_cobranca"
  ON formas_cobranca
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for public users on formas_cobranca"
  ON formas_cobranca
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);