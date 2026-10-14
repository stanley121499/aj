import type { TransactionType } from "../types/transaction";

/** Transaction sources shown in the ledger UI (OPENING may land in schema later). */
export type BalanceSourceLabel = "NOTE" | "RESULT" | "PAYOUT" | "OPENING";

/** Balance direction relative to zero. */
export type BalanceDirection = "above" | "below" | "zero";

/**
 * Whose perspective labels use for who-owes-whom copy.
 * - self: customer (or anyone) viewing their own balance
 * - staff: operators viewing another user's balance
 */
export type BalanceAudience = "self" | "staff";

/**
 * Formats a signed balance for display (e.g. "$1,234.56" or "-$40.00").
 * @param balance - Signed balance value
 * @returns Locale-formatted currency string with sign
 */
export function formatSignedBalance(balance: number): string {
  const absolute = Math.abs(balance);
  const formatted = absolute.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (balance < 0) {
    return `-$${formatted}`;
  }
  return `$${formatted}`;
}

/**
 * Formats a money amount without forcing a sign (always absolute dollars).
 * @param amount - Amount to format
 * @returns Locale-formatted currency string
 */
export function formatMoney(amount: number): string {
  const absolute = Math.abs(amount);
  return `$${absolute.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Classifies a signed balance relative to zero.
 * Canonical math: above → user owes house; below → house owes user; zero → settled.
 * @param balance - Signed balance value
 * @returns Direction key used by labels and colors
 */
export function getBalanceDirection(balance: number): BalanceDirection {
  if (balance > 0) {
    return "above";
  }
  if (balance < 0) {
    return "below";
  }
  return "zero";
}

/**
 * Who-owes-whom label for a signed balance.
 * Balance > 0 → user owes house; balance < 0 → house owes user; 0 → settled.
 * @param balance - Signed balance value
 * @param audience - self ("You owe") vs staff ("They owe")
 * @returns Direction label for legends, badges, and cards
 */
export function balanceDirectionLabel(
  balance: number,
  audience: BalanceAudience = "self"
): string {
  const direction = getBalanceDirection(balance);
  if (direction === "above") {
    return audience === "staff" ? "They owe" : "You owe";
  }
  if (direction === "below") {
    return audience === "staff" ? "We owe them" : "We owe you";
  }
  return "Settled";
}

/** Compact legend labels for customer / self-view balance cards. */
export const BALANCE_LEGEND_LABELS = {
  above: "You owe",
  below: "We owe you",
  zero: "Settled",
} as const;

/** Compact legend labels for staff views of other users. */
export const BALANCE_LEGEND_LABELS_STAFF = {
  above: "They owe",
  below: "We owe them",
  zero: "Settled",
} as const;

/**
 * Legend copy for the given audience.
 * @param audience - self vs staff wording
 * @returns Legend label map
 */
export function balanceLegendLabels(
  audience: BalanceAudience = "self"
): typeof BALANCE_LEGEND_LABELS | typeof BALANCE_LEGEND_LABELS_STAFF {
  return audience === "staff"
    ? BALANCE_LEGEND_LABELS_STAFF
    : BALANCE_LEGEND_LABELS;
}

/**
 * Tip for note entry: positive money in moves balance down (credit).
 * Does not share sign convention with results.
 */
export const NOTE_ENTRY_TIP =
  "Positive amount = money in → balance ↓ (toward we owe you). Negative amount = money out → balance ↑ (toward you owe).";

/**
 * Tip for result entry: positive outcome moves balance up (debit).
 * Does not share sign convention with notes.
 */
export const RESULT_ENTRY_TIP =
  "Positive amount = balance ↑ (toward they owe). Negative amount = balance ↓ (toward we owe them).";

/** Side-by-side contrast used in result helpers and onboarding. */
export const NOTE_VS_RESULT_CONTRAST =
  "$100 note → balance ↓ (we owe more / you owe less); $100 result → balance ↑ (they/you owe more)";

/**
 * Runtime balance delta from type + amount.
 * Debit → balance up (+amount); credit → balance down (−amount).
 * @param amount - Positive stored amount
 * @param type - Transaction type
 * @returns Signed balance change
 */
export function balanceChangeFromType(
  amount: number,
  type: TransactionType
): number {
  const absolute = Math.abs(amount);
  return type === "debit" ? absolute : -absolute;
}

/**
 * Arrow + amount label for ledger rows, with who-owes-whom effect hint.
 * Debit = balance up = more owed by the user; credit = balance down = more we owe.
 * @param type - Transaction type (debit = up, credit = down)
 * @param amount - Stored positive amount
 * @param audience - self vs staff wording for the owe hint
 * @returns e.g. "↑ $60.00 (you owe more)" or "↓ $60.00 (we owe them more)"
 */
export function arrowEffectLabel(
  type: TransactionType,
  amount: number,
  audience: BalanceAudience = "self"
): string {
  const money = formatMoney(amount);
  if (type === "debit") {
    const hint =
      audience === "staff" ? "they owe more" : "you owe more";
    return `↑ ${money} (${hint})`;
  }
  const hint =
    audience === "staff" ? "we owe them more" : "we owe you more";
  return `↓ ${money} (${hint})`;
}

/**
 * Maps a signed balance delta to transaction type + positive amount.
 * Increase (delta >= 0) → debit; decrease → credit.
 * @param delta - Target balance minus current balance
 * @returns Type and absolute amount for posting
 */
export function signedDeltaToTransactionType(delta: number): {
  type: TransactionType;
  amount: number;
} {
  return {
    type: delta >= 0 ? "debit" : "credit",
    amount: Math.abs(delta),
  };
}

/**
 * Human-readable target label.
 * @param target - account_balance or baki
 * @returns Display string
 */
export function humanizeTarget(
  target: "account_balance" | "baki"
): string {
  if (target === "account_balance") {
    return "Account balance";
  }
  return "Baki";
}

/**
 * Human-readable transaction source label.
 * @param source - Raw source string (supports OPENING before schema enum lands)
 * @returns Display string
 */
export function humanizeSource(source: string | null | undefined): string {
  if (!source) {
    return "Unknown";
  }
  const normalized = source.toUpperCase();
  switch (normalized) {
    case "NOTE":
      return "Note";
    case "RESULT":
      return "Result";
    case "PAYOUT":
      return "Payout";
    case "OPENING":
      return "Opening";
    default:
      return source;
  }
}

/**
 * Preview string showing balance before and after a change.
 * @param current - Current signed balance
 * @param change - Signed delta (positive = balance up)
 * @returns e.g. "$100.00 → $40.00"
 */
export function previewBalanceChange(
  current: number,
  change: number
): string {
  const next = current + change;
  return `${formatSignedBalance(current)} → ${formatSignedBalance(next)}`;
}

/**
 * Preview from current balance + transaction type/amount using runtime math.
 * @param current - Current signed balance
 * @param amount - Positive stored amount
 * @param type - debit (up) or credit (down)
 * @returns A → B preview string
 */
export function previewBalanceChangeFromType(
  current: number,
  amount: number,
  type: TransactionType
): string {
  return previewBalanceChange(current, balanceChangeFromType(amount, type));
}
