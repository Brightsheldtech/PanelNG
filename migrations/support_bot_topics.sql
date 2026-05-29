-- Support bot topics — editable FAQ entries for the in-app chat bot
CREATE TABLE IF NOT EXISTS public.support_bot_topics (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  icon        TEXT        NOT NULL DEFAULT 'ti-help-circle',
  label       TEXT        NOT NULL,
  reply       TEXT,                        -- NULL means escalate straight to human
  escalate    BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order  INT         NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the default topics (mirrors what was hardcoded before)
INSERT INTO public.support_bot_topics (icon, label, reply, escalate, sort_order) VALUES
  ('ti-wallet',         'Wallet & Funding',       'To fund your wallet: Add Funds → Bank Transfer → enter amount → get unique reference code → send exact amount to our bank account → click "I Have Made This Transfer". Wallet is credited within minutes during business hours (8am–9pm WAT).', FALSE, 1),
  ('ti-package',        'Order Not Delivered',    'Orders usually process within seconds. If your order shows "pending" after 5 minutes, check Order History for status updates. If it''s been over 30 minutes and still pending, tap "I still need help" so a support agent can investigate.', FALSE, 2),
  ('ti-clock',          'Payment Not Confirmed',  'Bank transfers are confirmed manually. If you submitted a request during business hours (8am–9pm WAT) and haven''t been credited after 2 hours, please escalate. Make sure you used the exact reference code as the transfer narration.', FALSE, 3),
  ('ti-receipt-refund', 'Refund / Dispute',       'Refunds are handled case-by-case. Accounts suspended due to third-party policy violations are not eligible. For valid delivery issues, escalate below and include your Order ID.', FALSE, 4),
  ('ti-help-circle',    'Something Else',         NULL, TRUE, 5)
ON CONFLICT DO NOTHING;
