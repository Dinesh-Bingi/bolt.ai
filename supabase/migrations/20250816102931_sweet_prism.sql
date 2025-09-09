/*
  # Create avatars table for storing user avatar data

  1. New Tables
    - `avatars`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `image_url` (text, URL to avatar image)
      - `voice_clone_id` (text, optional ElevenLabs voice ID)
      - `did_avatar_id` (text, optional D-ID avatar ID)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `avatars` table
    - Add policies for users to manage their own avatars
*/

CREATE TABLE IF NOT EXISTS avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  voice_clone_id text,
  did_avatar_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own avatars"
  ON avatars
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatars"
  ON avatars
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatars"
  ON avatars
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own avatars"
  ON avatars
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);