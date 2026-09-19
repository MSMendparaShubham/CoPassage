import { supabase } from '../supabase';
import { RiderWallet, WalletTransaction, WalletTransactionType } from '../types';

function getLocalWalletKey(riderUid: string): string {
  return `copassage_vault_balance_${riderUid}`;
}

function getLocalTxKey(riderUid: string): string {
  return `copassage_vault_txs_${riderUid}`;
}

function getLocalBalance(riderUid: string): number {
  try {
    const raw = localStorage.getItem(getLocalWalletKey(riderUid));
    return raw ? parseFloat(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

function setLocalBalance(riderUid: string, balance: number): void {
  try {
    localStorage.setItem(getLocalWalletKey(riderUid), String(balance));
  } catch {
    // ignore
  }
}

function getLocalTransactions(riderUid: string): WalletTransaction[] {
  try {
    const raw = localStorage.getItem(getLocalTxKey(riderUid));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addLocalTransaction(riderUid: string, tx: WalletTransaction): void {
  try {
    const list = getLocalTransactions(riderUid);
    list.unshift(tx);
    localStorage.setItem(getLocalTxKey(riderUid), JSON.stringify(list.slice(0, 50)));
  } catch {
    // ignore
  }
}

/**
 * Retrieves the current Vault balance for a commuter.
 */
export async function getWalletBalance(riderUid: string): Promise<number> {
  if (!riderUid) return 0;

  try {
    const { data, error } = await supabase
      .from('rider_wallets')
      .select('balance')
      .eq('rider_uid', riderUid)
      .maybeSingle();

    if (!error && data) {
      const balance = parseFloat(data.balance) || 0;
      setLocalBalance(riderUid, balance);
      return balance;
    }
  } catch (err) {
    console.warn('Could not fetch wallet from Supabase, using local fallback:', err);
  }

  return getLocalBalance(riderUid);
}

/**
 * Retrieves transaction audit log for a commuter's Vault.
 */
export async function getWalletTransactions(riderUid: string): Promise<WalletTransaction[]> {
  if (!riderUid) return [];

  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('rider_uid', riderUid)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data && data.length > 0) {
      return data as WalletTransaction[];
    }
  } catch (err) {
    console.warn('Could not fetch wallet transactions, using local fallback:', err);
  }

  return getLocalTransactions(riderUid);
}

/**
 * Atomically debits a fee from the commuter's Vault balance.
 * Returns { success: true, new_balance } if sufficient balance, or { success: false, new_balance } if not.
 */
export async function debitWallet(
  riderUid: string,
  amount: number,
  type: WalletTransactionType,
  postId?: string | null,
  requestId?: string | null
): Promise<{ success: boolean; new_balance: number }> {
  const roundedAmount = Math.round(amount * 100) / 100;

  try {
    const { data, error } = await supabase.rpc('debit_wallet', {
      p_rider_uid: riderUid,
      p_amount: roundedAmount,
      p_type: type,
      p_post_id: postId || null,
      p_request_id: requestId || null,
    });

    if (!error && data && data.length > 0) {
      const res = data[0];
      const newBal = Number(res.new_balance);
      setLocalBalance(riderUid, newBal);
      return {
        success: Boolean(res.success),
        new_balance: newBal,
      };
    }
  } catch (err) {
    console.warn('debit_wallet RPC failed, using local fallback:', err);
  }

  // Local fallback
  const current = getLocalBalance(riderUid);
  if (current < roundedAmount) {
    return { success: false, new_balance: current };
  }

  const updated = Math.round((current - roundedAmount) * 100) / 100;
  setLocalBalance(riderUid, updated);

  addLocalTransaction(riderUid, {
    id: `local_tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    rider_uid: riderUid,
    amount: -roundedAmount,
    type,
    related_post_id: postId || null,
    related_request_id: requestId || null,
    balance_after: updated,
    created_at: new Date().toISOString(),
  });

  return { success: true, new_balance: updated };
}

/**
 * Credits funds into the commuter's Vault balance (top-up or refund).
 */
export async function creditWallet(
  riderUid: string,
  amount: number,
  type: WalletTransactionType,
  postId?: string | null,
  requestId?: string | null,
  razorpayPaymentId?: string | null
): Promise<number> {
  const roundedAmount = Math.round(amount * 100) / 100;

  try {
    const { data, error } = await supabase.rpc('credit_wallet', {
      p_rider_uid: riderUid,
      p_amount: roundedAmount,
      p_type: type,
      p_post_id: postId || null,
      p_request_id: requestId || null,
      p_razorpay_payment_id: razorpayPaymentId || null,
    });

    if (!error && data !== null) {
      const newBal = Number(data);
      setLocalBalance(riderUid, newBal);
      return newBal;
    }
  } catch (err) {
    console.warn('credit_wallet RPC failed, using local fallback:', err);
  }

  // Local fallback
  const current = getLocalBalance(riderUid);
  const updated = Math.round((current + roundedAmount) * 100) / 100;
  setLocalBalance(riderUid, updated);

  addLocalTransaction(riderUid, {
    id: `local_tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    rider_uid: riderUid,
    amount: roundedAmount,
    type,
    related_post_id: postId || null,
    related_request_id: requestId || null,
    razorpay_payment_id: razorpayPaymentId || null,
    balance_after: updated,
    created_at: new Date().toISOString(),
  });

  return updated;
}
