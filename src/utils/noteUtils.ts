import { TransactionInsert } from "../context/TransactionContext";
import { User } from "../context/UserContext";
import { AccountBalance } from "../context/AccountBalanceContext";
import { Baki } from "../context/BakiContext";
import { Note } from "../context/NoteContext";


/**
 * Creates a transaction for an account balance note
 * @param user - The user who created the note
 * @param note - The note to create a transaction for
 * @param accountBalance - The account balance to update
 * @returns A transaction insert object
 */
export const createBalanceTransaction = (
  user: User,
  note: Note,
  accountBalance: AccountBalance
): TransactionInsert => ({
  user_id: user.id,
  account_balance_id: accountBalance.id,
  amount: note.amount,
  type: "credit", // Notes always mean user pays boss, so always credit (reduce balance)
  target: "account_balance",
  category_id: note.category_id,
  source: "NOTE",
});

/**
 * Creates a transaction for a baki note
 * @param user - The user who created the note
 * @param note - The note to create a transaction for
 * @param baki - The baki to update
 * @returns A transaction insert object
 */
export const createBakiTransaction = (
  user: User,
  note: Note,
  baki: Baki
): TransactionInsert => ({
  user_id: user.id,
  baki_id: baki.id,
  amount: note.amount,
  type: "credit", // Notes always mean user pays boss, so always credit (reduce balance)
  target: "baki",
  category_id: note.category_id,
  source: "NOTE",
});

/**
 * Validates a note before approval
 * @param note - The note to validate
 * @throws Error if the note is invalid
 */
export const validateNote = (note: Note): void => {
  if (typeof note.amount !== "number" || note.amount <= 0) {
    throw new Error("Invalid amount");
  }
  if (!note.category_id) {
    throw new Error("Category is required");
  }
  if (!note.user_id) {
    throw new Error("User is required");
  }
  if (!note.target || !["account_balance", "baki"].includes(note.target)) {
    throw new Error("Invalid target");
  }
}; 