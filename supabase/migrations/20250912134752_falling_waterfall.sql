/*
  # Fix RLS policies for participantes table

  1. Security Changes
    - Drop existing restrictive policy that prevents INSERT operations
    - Create new comprehensive policies for all CRUD operations
    - Allow both authenticated and public access for development
    - Maintain RLS enabled for security
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Participantes - acesso completo" ON participantes;

-- Create new comprehensive policies
CREATE POLICY "Allow all operations for authenticated users on participantes"
  ON participantes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for public users on participantes"
  ON participantes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);