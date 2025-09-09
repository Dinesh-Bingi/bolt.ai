/*
  # Create memorials table for public memorial pages

  1. New Tables
    - `memorials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `slug` (text, unique URL slug)
      - `title` (text, memorial title)
      - `description` (text, memorial description)
      - `is_public` (boolean, default true)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `memorials` table
    - Add policies for users to manage their own memorials
    - Allow public read access for public memorials
*/

CREATE TABLE IF NOT EXISTS memorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE memorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memorials"
  ON memorials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read public memorials"
  ON memorials
  FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY "Users can insert own memorials"
  ON memorials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memorials"
  ON memorials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memorials"
  ON memorials
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);