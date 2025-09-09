/*
  # Create guestbook table for memorial tributes

  1. New Tables
    - `guestbook`
      - `id` (uuid, primary key)
      - `memorial_id` (uuid, foreign key to memorials)
      - `author_name` (text, name of person leaving tribute)
      - `message` (text, tribute message)
      - `type` (text, type of tribute: message, candle, flower)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `guestbook` table
    - Allow public read and insert for guestbook entries
    - Allow memorial owners to delete entries
*/

CREATE TABLE IF NOT EXISTS guestbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid REFERENCES memorials(id) ON DELETE CASCADE NOT NULL,
  author_name text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'message' CHECK (type IN ('message', 'candle', 'flower')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read guestbook entries"
  ON guestbook
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert guestbook entries"
  ON guestbook
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Memorial owners can delete guestbook entries"
  ON guestbook
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials 
      WHERE memorials.id = guestbook.memorial_id 
      AND memorials.user_id = auth.uid()
    )
  );