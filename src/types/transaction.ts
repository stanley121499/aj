import { Database } from "../../database.types";

export type TransactionType = "credit" | "debit";
export type TransactionTarget = Database["public"]["Enums"]["transaction_target"];
/** Ledger sources; OPENING is reserved for clean-start CSV imports. */
export type TransactionSource = "PAYOUT" | "RESULT" | "NOTE" | "OPENING";

// Use the base types from database.types.ts
export type BaseTransaction = Database["public"]["Tables"]["transactions"]["Row"];
export type BaseTransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

// Only extend with what's not in the database types
export interface Transaction extends BaseTransaction {
  type: TransactionType;
  source: TransactionSource;
}

export interface TransactionInsert extends BaseTransactionInsert {
  type: TransactionType;
  source: TransactionSource;
}

/**
 * Calculates the balance change for a transaction using runtime math.
 * Debit → balance up (+amount); credit → balance down (−amount).
 * Prefer `calculateBalanceChange` from `src/utils/transactionUtils.ts` at call sites;
 * this export stays aligned so older imports are not inverted.
 * @param amount - The transaction amount (stored positive)
 * @param type - The transaction type (credit/debit)
 * @returns Signed balance change
 */
export const calculateBalanceChange = (
  amount: number,
  type: TransactionType
): number => {
  if (type === "debit") {
    return amount;
  }
  return -amount;
};

/**
 * Validates a transaction before processing
 * @param transaction The transaction to validate
 * @returns True if the transaction is valid, false otherwise
 */
export const validateTransaction = (transaction: TransactionInsert): boolean => {
  // Basic validation
  if (!transaction.amount || !transaction.type || !transaction.target || !transaction.user_id || !transaction.category_id) {
    console.error("Missing required transaction fields");
    return false;
  }

  // Target-specific validation
  if (transaction.target === "account_balance" && !transaction.account_balance_id) {
    console.error("Missing account_balance_id for account_balance transaction");
    return false;
  }

  if (transaction.target === "baki" && !transaction.baki_id) {
    console.error("Missing baki_id for baki transaction");
    return false;
  }

  // Amount validation
  if (isNaN(transaction.amount) || transaction.amount === 0) {
    console.error("Invalid transaction amount");
    return false;
  }

  return true;
};

/**
 * Normalizes a transaction amount and type for result-style posting.
 * Positive amount → debit (balance up); negative → credit (balance down).
 * @param amount The raw amount value
 * @returns Object containing normalized absolute amount and type
 */
export const normalizeTransactionAmount = (amount: number | string): {
  amount: number;
  type: TransactionType;
} => {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const type: TransactionType = numericAmount < 0 ? "credit" : "debit";

  return { amount: Math.abs(numericAmount), type };
};
