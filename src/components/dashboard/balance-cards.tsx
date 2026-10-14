import React from "react";
import { Card } from "flowbite-react";
import { useBakiContext } from "../../context/BakiContext";
import { useAccountBalanceContext } from "../../context/AccountBalanceContext";
import { useAppSettingsContext } from "../../context/AppSettingsContext";
import { useCategoryContext } from "../../context/CategoryContext";
import {
  BALANCE_LEGEND_LABELS,
  balanceDirectionLabel,
  formatSignedBalance,
  getBalanceDirection,
} from "../../utils/balanceLanguage";
import LoadingPage from "../../pages/pages/loading";

/**
 * Returns Tailwind text color for a signed balance (paired with owe labels).
 * Green = you owe (above 0); red = we owe you (below 0); gray = settled.
 * @param balance - Signed balance value
 * @returns CSS class string
 */
function balanceColorClass(balance: number): string {
  const direction = getBalanceDirection(balance);
  if (direction === "above") {
    return "text-green-600 dark:text-green-400";
  }
  if (direction === "below") {
    return "text-red-600 dark:text-red-400";
  }
  return "text-gray-600 dark:text-gray-300";
}

const BalanceCards: React.FC = function () {
  const { currentUserAccountBalance, loading: accountLoading } =
    useAccountBalanceContext();
  const { currentUserBaki, loading: bakiLoading } = useBakiContext();
  const { categories } = useCategoryContext();
  const { isBakiEnabled } = useAppSettingsContext();

  // LoadingPage only while initial fetches run — empty arrays are a valid loaded state.
  if (accountLoading || (isBakiEnabled && bakiLoading)) {
    return <LoadingPage />;
  }

  return (
    <div data-tour="balance-cards">
      <div
        data-tour="balance-legend"
        className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Legend
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
          {BALANCE_LEGEND_LABELS.above}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
          {BALANCE_LEGEND_LABELS.below}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gray-400" aria-hidden="true" />
          {BALANCE_LEGEND_LABELS.zero}
        </span>
      </div>
      {/* Account Balance */}
      <Card className="mb-4 rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
            Account Balance
          </h5>
        </div>
        <div className="flow-root">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentUserAccountBalance.length === 0 ? (
              <li className="py-3 text-sm text-gray-500 dark:text-gray-400 sm:py-4">
                No account balances yet.
              </li>
            ) : (
              currentUserAccountBalance.map((accountBalance) => (
              <li key={accountBalance.id} className="py-3 sm:py-4">
                <div className="flex items-center space-x-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {
                        categories.find(
                          (category) =>
                            category.id === accountBalance.category_id
                        )?.name
                      }
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {balanceDirectionLabel(accountBalance.balance)}
                    </p>
                  </div>
                  <div
                    className={`inline-flex items-center text-base font-semibold ${balanceColorClass(
                      accountBalance.balance
                    )}`}>
                    {formatSignedBalance(accountBalance.balance)}
                  </div>
                </div>
              </li>
              ))
            )}
          </ul>
        </div>
      </Card>
      {/* Baki — hidden while kill-switch is off */}
      {isBakiEnabled && (
        <Card className="mb-4 rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
              Baki
            </h5>
          </div>
          <div className="flow-root">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentUserBaki.length === 0 ? (
                <li className="py-3 text-sm text-gray-500 dark:text-gray-400 sm:py-4">
                  No baki balances yet.
                </li>
              ) : (
                currentUserBaki.map((baki) => (
                  <li key={baki.id} className="py-3 sm:py-4">
                    <div className="flex items-center space-x-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {
                            categories.find(
                              (category) => category.id === baki.category_id
                            )?.name
                          }
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {balanceDirectionLabel(baki.balance)}
                        </p>
                      </div>
                      <div
                        className={`inline-flex items-center text-base font-semibold ${balanceColorClass(
                          baki.balance
                        )}`}>
                        {formatSignedBalance(baki.balance)}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BalanceCards;
