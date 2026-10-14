import type { TransactionInsert } from "../types/transaction";
import { signedDeltaToTransactionType } from "./balanceLanguage";
import { supabase } from "./supabaseClient";

/** One balance row keyed by id (account_balance or baki). */
export interface BalanceEditLine {
  id: string;
  category_id: number;
  /** Target signed balance the operator wants. */
  balance: number;
}

/**
 * Posts PAYOUT delta transactions so each balance moves from live current to the given target.
 * Math: delta = target - current; type/amount from signedDeltaToTransactionType (do not invert).
 * @param params - User, draft targets, and addTransaction from TransactionContext
 * @returns Count of transactions posted
 */
export async function postBalanceEdits(params: {
  userId: string;
  accountBalances: BalanceEditLine[];
  bakis: BalanceEditLine[];
  includeBaki: boolean;
  addTransaction: (transaction: TransactionInsert) => Promise<void>;
}): Promise<number> {
  const { userId, accountBalances, bakis, includeBaki, addTransaction } = params;
  let posted = 0;

  if (includeBaki) {
    for (const baki of bakis) {
      const { data: freshBaki, error: bakiError } = await supabase
        .from("bakis")
        .select("id,balance,category_id")
        .eq("id", baki.id)
        .single();

      if (bakiError) {
        throw new Error(`Failed to fetch fresh baki data: ${bakiError.message}`);
      }

      if (!freshBaki) {
        throw new Error(`Baki not found: ${baki.id}`);
      }

      const delta = baki.balance - freshBaki.balance;
      if (delta === 0) {
        continue;
      }

      const { type, amount } = signedDeltaToTransactionType(delta);
      await addTransaction({
        user_id: userId,
        category_id: baki.category_id,
        amount,
        target: "baki",
        source: "PAYOUT",
        type,
        baki_id: baki.id,
      });
      posted += 1;
    }
  }

  for (const accountBalance of accountBalances) {
    const { data: freshBalance, error: balanceError } = await supabase
      .from("account_balances")
      .select("id,balance,category_id")
      .eq("id", accountBalance.id)
      .single();

    if (balanceError) {
      throw new Error(
        `Failed to fetch fresh account balance data: ${balanceError.message}`
      );
    }

    if (!freshBalance) {
      throw new Error(`Account balance not found: ${accountBalance.id}`);
    }

    const delta = accountBalance.balance - freshBalance.balance;
    if (delta === 0) {
      continue;
    }

    const { type, amount } = signedDeltaToTransactionType(delta);
    await addTransaction({
      user_id: userId,
      category_id: accountBalance.category_id,
      amount,
      target: "account_balance",
      source: "PAYOUT",
      type,
      account_balance_id: accountBalance.id,
    });
    posted += 1;
  }

  return posted;
}

/**
 * Parses a number input string into a finite balance target.
 * @param raw - Input value from a number field
 * @returns Parsed number, or null when invalid / empty
 */
export function parseBalanceInput(raw: string): number | null {
  if (raw.trim() === "") {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}
