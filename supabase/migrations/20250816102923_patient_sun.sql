/*
  # Create memories table for storing life stories

  1. New Tables
    - `memories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `question` (text, the question asked)
      - `answer` (text, the user's response)
      - `category` (text, category of memory)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `memories` table
    - Add policies for users to manage their own memories
*/

CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL CHECK (category IN ('childhood', 'career', 'love', 'struggles', 'values', 'advice')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memories"
  ON memories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories"
  ON memories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories"
  ON memories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
  ON memories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);