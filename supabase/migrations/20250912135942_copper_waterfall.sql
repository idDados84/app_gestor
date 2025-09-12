/*
  # Fix RLS policies for contas_pagar table

  1. Security Changes
    - Drop existing restrictive policy that prevents INSERT operations
    - Create comprehensive policies for all CRUD operations
    - Allow both authenticated and public access for development
*/

-- Drop existing policy that's preventing INSERT operations
DROP POLICY IF EXISTS "Contas a pagar - acesso completo" ON contas_pagar;

-- Create new comprehensive policies for all operations
CREATE POLICY "Allow all operations on contas_pagar for authenticated users"
  ON contas_pagar
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on contas_pagar for public users"
  ON contas_pagar
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);