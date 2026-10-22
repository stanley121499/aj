/**
 * Aggregate platform balance metrics for admin dashboard overview.
 * Uses the same who-owes-whom convention as balanceLanguage:
 * balance > 0 → they owe; balance < 0 → we owe them; 0 → settled.
 */

/** Minimal signed ledger row used for aggregation. */
export type BalanceLike = {
  balance: number;
  category_id: number;
  user_id: string;
};

/** Per-category they-owe / we-owe / net totals. */
export type CategoryPlatformStats = {
  categoryId: number;
  categoryName: string;
  theyOwe: number;
  weOweThem: number;
  /** Signed sum for the category (theyOwe − weOweThem). */
  net: number;
};

/** Platform-wide totals derived from signed balance rows. */
export type PlatformBalanceStats = {
  /** Sum of all positive balances (house is owed). */
  theyOweTotal: number;
  /** Sum of abs(negative balances) (house owes users). */
  weOweThemTotal: number;
  /**
   * Sum of all signed balances (= theyOweTotal − weOweThemTotal).
   * Positive → overall they owe; negative → overall we owe them.
   */
  net: number;
  byCategory: CategoryPlatformStats[];
};

type CategoryAccumulator = {
  categoryId: number;
  theyOwe: number;
  weOweThem: number;
  net: number;
};

/**
 * Aggregates signed ledger rows into they-owe / we-owe / net totals,
 * plus a per-category breakdown.
 * @param rows - Account balances and/or bakis
 * @param categoryNameById - Map of category id → display name
 * @returns Platform balance stats
 */
export function aggregateSignedBalances(
  rows: readonly BalanceLike[],
  categoryNameById: ReadonlyMap<number, string>
): PlatformBalanceStats {
  let theyOweTotal = 0;
  let weOweThemTotal = 0;
  let net = 0;
  const byCategoryId = new Map<number, CategoryAccumulator>();

  for (const row of rows) {
    const balance = row.balance;
    net += balance;

    let theyOwe = 0;
    let weOweThem = 0;
    if (balance > 0) {
      theyOwe = balance;
      theyOweTotal += balance;
    } else if (balance < 0) {
      weOweThem = Math.abs(balance);
      weOweThemTotal += weOweThem;
    }

    const existing = byCategoryId.get(row.category_id);
    if (existing) {
      existing.theyOwe += theyOwe;
      existing.weOweThem += weOweThem;
      existing.net += balance;
    } else {
      byCategoryId.set(row.category_id, {
        categoryId: row.category_id,
        theyOwe,
        weOweThem,
        net: balance,
      });
    }
  }

  const byCategory: CategoryPlatformStats[] = Array.from(byCategoryId.values())
    .map((entry) => {
      const mappedName = categoryNameById.get(entry.categoryId);
      return {
        categoryId: entry.categoryId,
        categoryName:
          typeof mappedName === "string" && mappedName.length > 0
            ? mappedName
            : `Category ${String(entry.categoryId)}`,
        theyOwe: entry.theyOwe,
        weOweThem: entry.weOweThem,
        net: entry.net,
      };
    })
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

  return {
    theyOweTotal,
    weOweThemTotal,
    net,
    byCategory,
  };
}

/**
 * Counts rows with a given status string (exact match).
 * @param items - Collection with a status field
 * @param status - Status to count (e.g. "PENDING")
 * @returns Number of matching items
 */
export function countByStatus(
  items: readonly { status: string }[],
  status: string
): number {
  let count = 0;
  for (const item of items) {
    if (item.status === status) {
      count += 1;
    }
  }
  return count;
}
