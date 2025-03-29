import { TransactionInsert } from "../context/TransactionContext";
import { TransactionSource } from "../types/transaction";

/**
 * Validates a transaction has all required fields
 * @param transaction - The transaction to validate
 * @returns boolean indicating if transaction is valid
 */
export function validateTransaction(transaction: TransactionInsert): boolean {
  if (!transaction.amount || !transaction.type || !transaction.target || !transaction.user_id || !transaction.category_id) {
    return false;
  }

  // Validate target-specific fields
  if (transaction.target === "account_balance" && !transaction.account_balance_id) {
    return false;
  }
  if (transaction.target === "baki" && !transaction.baki_id) {
    return false;
  }

  return true;
}

/**
 * Calculates the balance change based on amount and transaction type
 * For positive amounts: User owes boss (DEBIT)
 * For negative amounts: Boss owes user (CREDIT)
 * @param amount - The transaction amount
 * @param type - The transaction type (debit/credit)
 * @returns The balance change amount
 */
export function calculateBalanceChange(amount: number, type: "debit" | "credit"): number {
  // For positive amounts: User owes boss (DEBIT)
  // For negative amounts: Boss owes user (CREDIT)
  if (type === "debit") {
    return amount; // Positive amount means user owes boss
  } else {
    return -amount; // Negative amount means boss owes user
  }
}

/**
 * Creates a transaction with the correct type based on amount
 * @param amount - The transaction amount
 * @param userId - The user ID
 * @param categoryId - The category ID
 * @param target - The target type (account_balance or baki)
 * @param targetId - The ID of the target (account_balance_id or baki_id)
 * @param source - The source of the transaction
 * @param resultId - Optional result ID if transaction is from a result
 * @returns TransactionInsert object
 */
export function createTransaction(
  amount: number,
  userId: string,
  categoryId: number,
  target: "account_balance" | "baki",
  targetId: string,
  source: TransactionSource,
  resultId?: number
): TransactionInsert {
  const baseTransaction: TransactionInsert = {
    amount,
    type: amount > 0 ? "debit" : "credit", // Positive = user owes boss (DEBIT), Negative = boss owes user (CREDIT)
    user_id: userId,
    category_id: categoryId,
    source,
    target,
  };

  if (resultId) {
    baseTransaction.result_id = resultId;
  }

  if (target === "account_balance") {
    return {
      ...baseTransaction,
      account_balance_id: targetId,
    };
  }

  return {
    ...baseTransaction,
    baki_id: targetId,
  };
} 