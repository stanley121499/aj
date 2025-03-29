/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Label,
  Table,
  TextInput, Badge
} from "flowbite-react";
import type { FC } from "react";
import React from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { useTransactionContext, Transaction } from "../../context/TransactionContext";
import { useUserContext } from "../../context/UserContext";
import { useCategoryContext } from "../../context/CategoryContext";
import { useAuthContext } from "../../context/AuthContext";
import { useAccountBalanceContext, AccountBalance } from "../../context/AccountBalanceContext";
import { useBakiContext, Baki } from "../../context/BakiContext";

/**
 * Transaction List Page Component
 * 
 * Displays a list of transactions with filtering capabilities based on user role.
 * 
 * Context Usage:
 * - TransactionContext: Provides transactions data and loading state
 * - UserContext: Provides user data for customer name display
 * - CategoryContext: Provides category data for transaction categorization
 * - AuthContext: Provides user role and authentication details
 * 
 * Role-based behavior:
 * - For customers: Shows only their own transactions
 * - For admin/staff: Shows all transactions with search functionality
 * 
 * Edge Cases:
 * - Loading state: Shows LoadingPage while data is being fetched
 * - No transactions: Displays "No transactions found" message
 * - No user_detail: Returns to loading state
 * - Empty search: Shows all transactions for admin/staff
 * 
 * @example
 * // Example of transactions data structure:
 * const transactions = [
 *   {
 *     id: "1",
 *     amount: 1000,
 *     type: "credit",
 *     source: "RESULT",
 *     target: "account_balance",
 *     user_id: "user123",
 *     category_id: "cat123"
 *   }
 * ];
 * 
 * @returns {JSX.Element} The rendered transaction list page
 */
const TransactionListPage: FC = function () {
  const { transactions, loading } = useTransactionContext();
  const { users } = useUserContext();
  const [searchValue, setSearchValue] = React.useState("");
  const { user_detail, user } = useAuthContext();
  const { accountBalances } = useAccountBalanceContext();
  const { bakis } = useBakiContext();

  if (loading || !user_detail) {
    return <LoadingPage />;
  }
  
  const renderTransactionTable = () => {
    if (transactions.length === 0) {
      return <div className="p-4 text-center">No transactions found</div>;
    }

    const filteredTransactions = user_detail.role === "customer" 
      ? transactions.filter((transaction) => transaction.user_id === user.id)
      : transactions.filter((transaction) => 
          users.find((user) => user.id === transaction.user_id)?.email.includes(searchValue)
        );

    return <TransactionsTable transactions={filteredTransactions} />;
  };

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="mb-1 w-full">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              All Transactions
            </h1>
          </div>
          <div className="sm:flex">
            <div className="mb-3 hidden items-center dark:divide-gray-700 sm:mb-0 sm:flex sm:divide-x sm:divide-gray-100">
              {user.role !== "customer" && (
                <form className="lg:pr-3">
                  <Label htmlFor="transactions-search" className="sr-only">
                    Search
                  </Label>
                  <div className="relative mt-1 lg:w-64 xl:w-96">
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
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

/**
 * Props interface for the TransactionsTable component
 * 
 * @interface TransactionsTableProps
 * @property {Transaction[]} transactions - Array of transactions to display in the table
 * 
 * @example
 * // Example of expected transactions prop:
 * const transactions: Transaction[] = [
 *   {
 *     id: "1",
 *     amount: 1000,
 *     type: "credit",
 *     source: "RESULT",
 *     target: "account_balance",
 *     user_id: "user123",
 *     category_id: "cat123",
 *     account_balance_id: "bal123"
 *   }
 * ];
 */
interface TransactionsTableProps {
  transactions: Transaction[];
}

/**
 * Transactions Table Component
 * 
 * Renders a table of transactions with filtering and formatting capabilities.
 * 
 * Context Usage:
 * - UserContext: Used to display customer names from user IDs
 * - CategoryContext: Used to display category names from category IDs
 * 
 * Columns:
 * - Customer: The username (email without domain) of the transaction owner
 * - Type: Credit/Debit badge with appropriate color
 * - Source: Origin of the transaction (e.g., "RESULT", "MANUAL")
 * - Amount: Transaction amount (positive for credit, negative for debit)
 * - Target: Target account type ("account_balance" or "baki")
 * - Category: Transaction category name from CategoryContext
 * 
 * Edge Cases:
 * - User not found: Shows empty customer cell
 * - Category not found: Shows empty category cell
 * - Missing email domain: Handles emails without @ symbol
 * - Zero amount: Displayed as is
 * - Unknown transaction type: Defaults to debit badge
 * 
 * @param {TransactionsTableProps} props - Component props
 * @param {Transaction[]} props.transactions - Array of transactions to display
 * 
 * @example
 * // Basic usage:
 * <TransactionsTable transactions={transactions} />
 * 
 * // With filtered transactions:
 * <TransactionsTable 
 *   transactions={transactions.filter(t => t.type === "credit")} 
 * />
 * 
 * @returns {JSX.Element} The rendered transactions table
 */
const TransactionsTable: React.FC<TransactionsTableProps> = function ({ transactions }) {
  const { users } = useUserContext();
  const { categories } = useCategoryContext();
  const { accountBalances } = useAccountBalanceContext();
  const { bakis } = useBakiContext();

  const getTransactionTarget = (transaction: Transaction, accountBalances: AccountBalance[], bakis: Baki[]) => {
    if (transaction.target === "account_balance") {
      const accountBalance = accountBalances.find(ab => ab.id === transaction.account_balance_id);
      return accountBalance ? `Account Balance - ${accountBalance.category_id}` : "Unknown Account Balance";
    } else if (transaction.target === "baki") {
      const baki = bakis.find(b => b.id === transaction.baki_id);
      return baki ? `Baki - ${baki.category_id}` : "Unknown Baki";
    }
    return "Unknown Target";
  };

  return (
    <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
      <Table.Head className="bg-gray-100 dark:bg-gray-700">
        <Table.HeadCell>Customer</Table.HeadCell>
        <Table.HeadCell>Type</Table.HeadCell>
        <Table.HeadCell>Source</Table.HeadCell>
        <Table.HeadCell>Amount</Table.HeadCell>
        <Table.HeadCell>Target</Table.HeadCell>
        <Table.HeadCell>Category</Table.HeadCell>
      </Table.Head>
      <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
        {transactions.map((transaction: Transaction) => (
          <Table.Row key={transaction.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <Table.Cell> {users.find((user) => user.id === transaction.user_id)?.email.split("@")[0]}</Table.Cell>
            <Table.Cell>
              {transaction.type === "credit" ? (
                <Badge color="success" className="w-fit">Credit</Badge>
              ) : (
                <Badge color="failure" className="w-fit">Debit</Badge>
              )}
            </Table.Cell>
            <Table.Cell>{transaction.source}</Table.Cell>
            <Table.Cell>{transaction.amount}</Table.Cell>
            <Table.Cell>{getTransactionTarget(transaction, accountBalances, bakis)}</Table.Cell>
            <Table.Cell>{categories.find((category) => category.id === transaction.category_id)?.name}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};


export default TransactionListPage;
