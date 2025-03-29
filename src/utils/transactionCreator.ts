import { ParsedResultLine } from "./resultParser";
import { TransactionInsert } from "../context/TransactionContext";
import { AccountBalance } from "../context/AccountBalanceContext";
import { Baki } from "../context/BakiContext";

/**
 * Creates a transaction from a parsed result line
 * @param parsedLine - The parsed result line
 * @param userId - The ID of the user
 * @param categoryId - The category ID for the transaction
 * @param target - The target type (account_balance or baki)
 * @param resultId - The ID of the result this transaction belongs to
 * @param accountBalance - Optional account balance if target is account_balance
 * @param baki - Optional baki if target is baki
 * @returns TransactionInsert object
 */
export function createTransactionFromResult(
  parsedLine: ParsedResultLine,
  userId: string,
  categoryId: number,
  target: "account_balance" | "baki",
  resultId: number,
  accountBalance?: AccountBalance,
  baki?: Baki
): TransactionInsert {
  const baseTransaction: TransactionInsert = {
    amount: Math.abs(parsedLine.amount),
    type: parsedLine.amount > 0 ? "debit" : "credit",
    user_id: userId,
    category_id: categoryId,
    result_id: resultId,
    source: "RESULT",
    target: target,
  };

  if (target === "account_balance" && accountBalance) {
    return {
      ...baseTransaction,
      target: "account_balance",
      account_balance_id: accountBalance.id,
    };
  }

  if (target === "baki" && baki) {
    return {
      ...baseTransaction,
      target: "baki",
      baki_id: baki.id,
    };
  }

  throw new Error(`Invalid transaction target or missing required data: ${target}`);
} 