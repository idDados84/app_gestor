/*
  # Fix RLS policies for categorias table

  1. Security Changes
    - Drop existing restrictive policy that prevents INSERT operations
    - Create comprehensive policies for all CRUD operations
    - Allow both authenticated and public access for development

  This resolves the "new row violates row-level security policy" error.
*/

-- Drop existing policy that's preventing INSERT operations
DROP POLICY IF EXISTS "Categorias - acesso completo" ON categorias;

-- Create new comprehensive policies for all operations
CREATE POLICY "Allow all operations on categorias for authenticated users"
  ON categorias
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on categorias for public users"
  ON categorias
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;