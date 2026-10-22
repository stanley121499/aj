import React, { useMemo } from "react";
import { Card } from "flowbite-react";
import { useAccountBalanceContext } from "../../context/AccountBalanceContext";
import { useAppSettingsContext } from "../../context/AppSettingsContext";
import { useBakiContext } from "../../context/BakiContext";
import { useCategoryContext } from "../../context/CategoryContext";
import { useNoteContext } from "../../context/NoteContext";
import { useResultContext } from "../../context/ResultContext";
import { useUserContext } from "../../context/UserContext";
import {
  BALANCE_LEGEND_LABELS_STAFF,
  balanceDirectionLabel,
  formatMoney,
  formatSignedBalance,
  getBalanceDirection,
} from "../../utils/balanceLanguage";
import {
  aggregateSignedBalances,
  countByStatus,
  type BalanceLike,
} from "../../utils/platformStats";

/**
 * Tailwind text color for a signed aggregate (staff / platform view).
 * Green = they owe; red = we owe them; gray = settled.
 * @param balance - Signed balance or net
 * @returns CSS class string
 */
function aggregateColorClass(balance: number): string {
  const direction = getBalanceDirection(balance);
  if (direction === "above") {
    return "text-green-600 dark:text-green-400";
  }
  if (direction === "below") {
    return "text-red-600 dark:text-red-400";
  }
  return "text-gray-600 dark:text-gray-300";
}

/**
 * Admin-only platform overview: aggregate they-owe / we-owe / net,
 * counts, and per-category breakdown. Baki rows included when enabled.
 */
const PlatformOverview: React.FC = function () {
  const { accountBalances, loading: accountLoading } =
    useAccountBalanceContext();
  const { bakis, loading: bakiLoading } = useBakiContext();
  const { categories, loading: categoryLoading } = useCategoryContext();
  const { users, loading: usersLoading } = useUserContext();
  const { notes, loading: notesLoading } = useNoteContext();
  const { results, loading: resultsLoading } = useResultContext();
  const { isBakiEnabled } = useAppSettingsContext();

  const isLoading =
    accountLoading ||
    categoryLoading ||
    usersLoading ||
    notesLoading ||
    resultsLoading ||
    (isBakiEnabled && bakiLoading);

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const category of categories) {
      map.set(category.id, category.name);
    }
    return map;
  }, [categories]);

  const ledgerRows = useMemo((): BalanceLike[] => {
    const accountRows: BalanceLike[] = accountBalances.map((row) => ({
      balance: row.balance,
      category_id: row.category_id,
      user_id: row.user_id,
    }));
    if (!isBakiEnabled) {
      return accountRows;
    }
    const bakiRows: BalanceLike[] = bakis.map((row) => ({
      balance: row.balance,
      category_id: row.category_id,
      user_id: row.user_id,
    }));
    return accountRows.concat(bakiRows);
  }, [accountBalances, bakis, isBakiEnabled]);

  const stats = useMemo(
    () => aggregateSignedBalances(ledgerRows, categoryNameById),
    [ledgerRows, categoryNameById]
  );

  const pendingNotesCount = useMemo(
    () => countByStatus(notes, "PENDING"),
    [notes]
  );

  const pendingResultsCount = useMemo(
    () => countByStatus(results, "PENDING"),
    [results]
  );

  if (isLoading) {
    return (
      <div
        data-tour="platform-overview"
        className="mb-4 rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading platform overview…
        </p>
      </div>
    );
  }

  return (
    <div data-tour="platform-overview" className="mb-4">
      <Card className="rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
              Platform overview
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Aggregate across all account balances
              {isBakiEnabled ? " and Baki" : ""}. Net = they owe − we owe them.
            </p>
          </div>
          <div
            className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400"
            aria-label="Platform balance legend">
            <span className="inline-flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full bg-green-500"
                aria-hidden="true"
              />
              {BALANCE_LEGEND_LABELS_STAFF.above}
            </span>
            <span className="inline-flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full bg-red-500"
                aria-hidden="true"
              />
              {BALANCE_LEGEND_LABELS_STAFF.below}
            </span>
            <span className="inline-flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full bg-gray-400"
                aria-hidden="true"
              />
              {BALANCE_LEGEND_LABELS_STAFF.zero}
            </span>
          </div>
        </div>

        {/* Primary money metrics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              They owe (total)
            </p>
            <p
              className={`mt-1 text-lg font-semibold sm:text-xl ${aggregateColorClass(
                stats.theyOweTotal > 0 ? stats.theyOweTotal : 0
              )}`}>
              {formatMoney(stats.theyOweTotal)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              We owe them (total)
            </p>
            <p
              className={`mt-1 text-lg font-semibold sm:text-xl ${
                stats.weOweThemTotal > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-300"
              }`}>
              {formatMoney(stats.weOweThemTotal)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Net
            </p>
            <p
              className={`mt-1 text-lg font-semibold sm:text-xl ${aggregateColorClass(
                stats.net
              )}`}>
              {formatSignedBalance(stats.net)}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {balanceDirectionLabel(stats.net, "staff")}
            </p>
          </div>
        </div>

        {/* Counts */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/40 sm:px-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Users</p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {users.length}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/40 sm:px-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pending notes
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {pendingNotesCount}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/40 sm:px-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pending results
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {pendingResultsCount}
            </p>
          </div>
        </div>

        {/* Per-category breakdown */}
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
            By category
          </h3>
          {stats.byCategory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No balances yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                      They owe
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                      We owe them
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.byCategory.map((row) => (
                    <tr key={row.categoryId}>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-white">
                        {row.categoryName}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-2 text-right ${
                          row.theyOwe > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-600 dark:text-gray-300"
                        }`}>
                        {formatMoney(row.theyOwe)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-2 text-right ${
                          row.weOweThem > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-300"
                        }`}>
                        {formatMoney(row.weOweThem)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-2 text-right font-medium ${aggregateColorClass(
                          row.net
                        )}`}>
                        {formatSignedBalance(row.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PlatformOverview;
