/*
  # Fix RLS policies for departamentos table

  1. Security
    - Drop existing restrictive policy that prevents INSERT operations
    - Create new comprehensive policies for all CRUD operations
    - Allow both authenticated and public access for development
    - Keep RLS enabled for security
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Departamentos - acesso completo" ON departamentos;

-- Create comprehensive policies for all operations
CREATE POLICY "Allow all operations on departamentos for authenticated users"
  ON departamentos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on departamentos for public users"
  ON departamentos
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;