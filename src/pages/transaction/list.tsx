/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Label,
  Table,
  TextInput,
  Badge,
} from "flowbite-react";
import type { FC } from "react";
import React from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { useTransactionContext, Transaction } from "../../context/TransactionContext";
import { useUserContext } from "../../context/UserContext";
import { useCategoryContext } from "../../context/CategoryContext";
import { useAuthContext } from "../../context/AuthContext";
import {
  arrowEffectLabel,
  formatMoney,
  humanizeSource,
  humanizeTarget,
} from "../../utils/balanceLanguage";
import type { TransactionType } from "../../types/transaction";

/**
 * Transaction List Page — ↑/↓ effect + Source as primary display.
 */
const TransactionListPage: FC = function () {
  const { transactions, loading } = useTransactionContext();
  const { users } = useUserContext();
  const [searchValue, setSearchValue] = React.useState("");
  const { user_detail, user } = useAuthContext();

  if (loading || !user_detail) {
    return <LoadingPage />;
  }

  const isStaff =
    user_detail.role === "admin" || user_detail.role === "employee";

  const renderTransactionTable = () => {
    if (transactions.length === 0) {
      return <div className="p-4 text-center">No transactions found</div>;
    }

    const filteredTransactions =
      user_detail.role === "customer"
        ? transactions.filter(
            (transaction) =>
              Boolean(user?.id) && transaction.user_id === user?.id
          )
        : transactions.filter((transaction) =>
            users
              .find((u) => u.id === transaction.user_id)
              ?.email.includes(searchValue)
          );

    return (
      <TransactionsTable
        transactions={filteredTransactions}
        showDebitCredit={isStaff}
      />
    );
  };

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="mb-1 w-full">
          <div className="mb-4">
            <h1
              data-tour="transactions-page"
              className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              All Transactions
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ↑ means balance up; ↓ means balance down.
            </p>
          </div>
          <div className="sm:flex">
            <div className="mb-3 flex items-center dark:divide-gray-700 sm:mb-0 sm:divide-x sm:divide-gray-100">
              {user_detail.role !== "customer" && (
                <form className="w-full lg:pr-3">
                  <Label htmlFor="transactions-search" className="sr-only">
                    Search
                  </Label>
                  <div className="relative mt-1 w-full lg:w-64 xl:w-96">
                    <TextInput
                      id="transactions-search"
                      name="transactions-search"
                      placeholder="Search for Transactions"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                    />
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              {renderTransactionTable()}
            </div>
          </div>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

interface TransactionsTableProps {
  transactions: Transaction[];
  /** When true (admin/employee), show muted Debit/Credit secondary text. */
  showDebitCredit: boolean;
}

/**
 * Resolves a safe transaction type for display helpers.
 * @param type - Raw type string from the row
 * @returns debit or credit
 */
function resolveTransactionType(type: string): TransactionType {
  return type === "credit" ? "credit" : "debit";
}

const TransactionsTable: React.FC<TransactionsTableProps> = function ({
  transactions,
  showDebitCredit,
}) {
  const { users } = useUserContext();
  const { categories } = useCategoryContext();

  return (
    <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
      <Table.Head className="bg-gray-100 dark:bg-gray-700">
        <Table.HeadCell>Customer</Table.HeadCell>
        <Table.HeadCell>Effect</Table.HeadCell>
        <Table.HeadCell>Source</Table.HeadCell>
        <Table.HeadCell>Amount</Table.HeadCell>
        <Table.HeadCell>Target</Table.HeadCell>
        <Table.HeadCell>Category</Table.HeadCell>
      </Table.Head>
      <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
        {transactions.map((transaction: Transaction) => {
          const txType = resolveTransactionType(transaction.type);
          const categoryName =
            categories.find(
              (category) => category.id === transaction.category_id
            )?.name ?? "—";
          const targetLabel =
            transaction.target === "account_balance" ||
            transaction.target === "baki"
              ? humanizeTarget(transaction.target)
              : "Unknown";

          return (
            <Table.Row
              key={transaction.id}
              className="hover:bg-gray-100 dark:hover:bg-gray-700">
              <Table.Cell>
                {
                  users
                    .find((u) => u.id === transaction.user_id)
                    ?.email.split("@")[0]
                }
              </Table.Cell>
              <Table.Cell>
                <div className="flex flex-col gap-1">
                  <span
                    className={
                      txType === "debit"
                        ? "font-semibold text-green-600 dark:text-green-400"
                        : "font-semibold text-red-600 dark:text-red-400"
                    }>
                    {arrowEffectLabel(txType, transaction.amount)}
                  </span>
                  {showDebitCredit && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {txType === "credit" ? "Credit" : "Debit"}
                    </span>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <Badge color="info" className="w-fit">
                  {humanizeSource(transaction.source)}
                </Badge>
              </Table.Cell>
              <Table.Cell>{formatMoney(transaction.amount)}</Table.Cell>
              <Table.Cell>{targetLabel}</Table.Cell>
              <Table.Cell>{categoryName}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
};

export default TransactionListPage;
