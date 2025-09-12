/*
  # Fix RLS policies for usuarios table

  1. Security Changes
    - Update RLS policies for usuarios table to allow proper CRUD operations
    - Allow authenticated users to perform all operations
    - Ensure policies work for both authenticated and public access during development

  2. Changes Made
    - Drop existing restrictive policy
    - Create comprehensive policies for SELECT, INSERT, UPDATE, DELETE operations
    - Allow public access for development purposes
*/

-- Drop existing policy that might be too restrictive
DROP POLICY IF EXISTS "Usuários podem ver todos os dados" ON usuarios;

-- Create comprehensive RLS policies for usuarios table
CREATE POLICY "Allow all operations for authenticated users" ON usuarios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow public access for development (can be removed in production)
CREATE POLICY "Allow all operations for public users" ON usuarios
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;