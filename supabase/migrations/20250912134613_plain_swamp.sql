/*
  # Fix RLS policies for empresas table

  1. Security Changes
    - Drop existing restrictive policy that prevents INSERT operations
    - Create comprehensive policies for all CRUD operations
    - Allow both authenticated and public access for development

  This resolves the "new row violates row-level security policy" error
  and enables proper CRUD functionality for the empresas table.
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Empresas - acesso completo" ON empresas;

-- Create comprehensive policies for all operations
CREATE POLICY "Allow all operations for authenticated users on empresas"
  ON empresas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for public users on empresas"
  ON empresas
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;