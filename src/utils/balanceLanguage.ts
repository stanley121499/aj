import type { TransactionType } from "../types/transaction";

/** Transaction sources shown in the ledger UI (OPENING may land in schema later). */
export type BalanceSourceLabel = "NOTE" | "RESULT" | "PAYOUT" | "OPENING";

/** Balance direction relative to zero. */
export type BalanceDirection = "above" | "below" | "zero";

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
 * Short direction label for legends and badges.
 * @param balance - Signed balance value
 * @returns "Above 0", "Below 0", or "Zero"
 */
export function balanceDirectionLabel(balance: number): string {
  const direction = getBalanceDirection(balance);
  if (direction === "above") {
    return "Above 0";
  }
  if (direction === "below") {
    return "Below 0";
  }
  return "Zero";
}

/** Compact legend labels shared by balance cards and onboarding. */
export const BALANCE_LEGEND_LABELS = {
  above: "Above 0",
  below: "Below 0",
  zero: "Zero",
} as const;

/** Tip for note entry: positive money in moves balance down. */
export const NOTE_ENTRY_TIP =
  "Positive amount = money in → balance goes down. Negative amount = money out → balance goes up.";

/** Tip for result entry: positive outcome moves balance up. */
export const RESULT_ENTRY_TIP =
  "Positive amount = balance goes up. Negative amount = balance goes down.";

/** Side-by-side contrast used in result helpers and onboarding. */
export const NOTE_VS_RESULT_CONTRAST =
  "$100 note → balance ↓; $100 result → balance ↑";

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
 * Arrow + amount label for ledger rows.
 * @param type - Transaction type (debit = up, credit = down)
 * @param amount - Stored positive amount
 * @returns e.g. "↑ $60.00" or "↓ $60.00"
 */
export function arrowEffectLabel(
  type: TransactionType,
  amount: number
): string {
  const money = formatMoney(amount);
  if (type === "debit") {
    return `↑ ${money}`;
  }
  return `↓ ${money}`;
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
