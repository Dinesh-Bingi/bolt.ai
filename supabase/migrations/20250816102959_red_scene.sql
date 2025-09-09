/*
  # Create storage buckets for file uploads

  1. Storage Buckets
    - `avatars` - for profile images and avatar photos
    - `audio` - for voice recordings and generated speech
    - `documents` - for any additional documents

  2. Security
    - Set up RLS policies for secure file access
    - Allow authenticated users to upload their own files
    - Allow public read access for active avatars and audio
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('audio', 'audio', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Avatar bucket policies
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Audio bucket policies
CREATE POLICY "Users can upload their own audio"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own audio"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view audio"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'audio');

-- Documents bucket policies
CREATE POLICY "Users can manage their own documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);