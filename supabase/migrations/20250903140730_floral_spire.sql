/*
  # Payment and Order Management Tables

  1. New Tables
    - `payment_orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `order_id` (text, Razorpay order ID)
      - `payment_id` (text, Razorpay payment ID)
      - `plan_id` (text, subscription plan)
      - `amount` (integer, amount in paise)
      - `currency` (text, default INR)
      - `status` (text, order status)
      - `verified_at` (timestamp)
      - `created_at` (timestamp)

    - `payment_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `event_type` (text, webhook event type)
      - `razorpay_data` (jsonb, full webhook payload)
      - `processed` (boolean, processing status)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for user access and service role management

  3. Indexes
    - Add indexes for order_id and payment_id lookups
    - Add index for user_id queries
*/

-- Payment Orders Table
CREATE TABLE IF NOT EXISTS payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id text UNIQUE NOT NULL,
  payment_id text,
  plan_id text NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'INR',
  status text DEFAULT 'created' CHECK (status IN ('created', 'attempted', 'paid', 'failed', 'cancelled')),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Payment Logs Table
CREATE TABLE IF NOT EXISTS payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  razorpay_data jsonb NOT NULL,
  processed boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Payment Orders Policies
CREATE POLICY "Users can read own payment orders"
  ON payment_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment orders"
  ON payment_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Payment Logs Policies
CREATE POLICY "Service role can manage payment logs"
  ON payment_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read own payment logs"
  ON payment_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS payment_orders_order_id_idx ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS payment_orders_payment_id_idx ON payment_orders(payment_id);
CREATE INDEX IF NOT EXISTS payment_orders_user_id_idx ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS payment_logs_event_type_idx ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS payment_logs_processed_idx ON payment_logs(processed);

-- Add Razorpay customer ID to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'razorpay_customer_id'
  ) THEN
    ALTER TABLE users ADD COLUMN razorpay_customer_id text;
  END IF;
END $$;

-- Update subscriptions table for Razorpay
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'razorpay_order_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN razorpay_order_id text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'razorpay_payment_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN razorpay_payment_id text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'razorpay_subscription_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN razorpay_subscription_id text;
  END IF;
END $$;