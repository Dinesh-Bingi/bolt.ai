/*
  # Add video generation tracking table

  1. New Tables
    - `video_generations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `talk_id` (text, D-ID talk ID)
      - `text` (text, the text being spoken)
      - `avatar_url` (text, avatar image URL)
      - `audio_url` (text, generated audio URL)
      - `video_url` (text, final video URL)
      - `status` (text, processing status)
      - `error_message` (text, error details if failed)
      - `created_at` (timestamp)
      - `completed_at` (timestamp)

  2. Security
    - Enable RLS on `video_generations` table
    - Add policies for users to manage their own video generations
*/

CREATE TABLE IF NOT EXISTS video_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  talk_id text NOT NULL,
  text text NOT NULL,
  avatar_url text NOT NULL,
  audio_url text NOT NULL,
  video_url text,
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own video generations"
  ON video_generations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video generations"
  ON video_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video generations"
  ON video_generations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX video_generations_user_id_idx ON video_generations(user_id);
CREATE INDEX video_generations_status_idx ON video_generations(status);
CREATE INDEX video_generations_created_at_idx ON video_generations(created_at);