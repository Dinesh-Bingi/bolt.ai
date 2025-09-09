/*
  # Create subscriptions table for payment tracking

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `plan_id` (text, subscription plan identifier)
      - `stripe_session_id` (text, Stripe checkout session ID)
      - `stripe_subscription_id` (text, optional Stripe subscription ID)
      - `amount` (integer, amount paid in cents)
      - `status` (text, subscription status)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `subscriptions` table
    - Add policies for users to read their own subscriptions
*/

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plan_id text NOT NULL,
  stripe_session_id text,
  stripe_subscription_id text,
  amount integer NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions
  FOR ALL
  TO service_role
  USING (true);