-- Add COA reference to cashier_transactions and make queue optional
ALTER TABLE public.cashier_transactions
  ADD COLUMN IF NOT EXISTS coa_account_id uuid,
  ADD COLUMN IF NOT EXISTS journal_entry_id uuid,
  ALTER COLUMN queue_id DROP NOT NULL,
  ALTER COLUMN queue_number DROP NOT NULL;

-- Allow nullable queue_number safely (already nullable in inserts? table defined NOT NULL). Set to allow NULL via above.

CREATE INDEX IF NOT EXISTS idx_cashier_tx_coa ON public.cashier_transactions(coa_account_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON public.journal_entry_lines(account_id);