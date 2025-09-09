/*
  # Create voice clones table for ElevenLabs integration

  1. New Tables
    - `voice_clones`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `voice_id` (text, ElevenLabs voice ID)
      - `name` (text, voice clone name)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `voice_clones` table
    - Add policies for users to manage their own voice clones
*/

CREATE TABLE IF NOT EXISTS voice_clones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  voice_id text NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE voice_clones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own voice clones"
  ON voice_clones
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice clones"
  ON voice_clones
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice clones"
  ON voice_clones
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice clones"
  ON voice_clones
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);