import { Result, ResultInsert } from "../context/ResultContext";

export const mockResults: Result[] = [
  {
    id: 1,
    created_at: "2024-03-11T00:00:00.000Z",
    result: "1000 user@example.com\n-500 user2@example.com",
    category_id: 1,
    target: "account_balance",
    user_id: "1",
    status: "completed",
  },
  {
    id: 2,
    created_at: "2024-03-11T00:00:00.000Z",
    result: "2000 user3@example.com\n-1000 user4@example.com",
    category_id: 2,
    target: "baki",
    user_id: "1",
    status: "completed",
  },
];

export const mockResultInserts: Record<string, ResultInsert> = {
  accountBalance: {
    result: "1000 user@example.com\n-500 user2@example.com",
    category_id: 1,
    target: "account_balance",
    user_id: "1",
    status: "completed",
  },
  baki: {
    result: "2000 user3@example.com\n-1000 user4@example.com",
    category_id: 2,
    target: "baki",
    user_id: "1",
    status: "completed",
  },
  invalid: {
    result: "invalid amount user@example.com",
    category_id: 1,
    target: "account_balance",
    user_id: "1",
    status: "error",
  },
};

export const mockUsers = [
  {
    id: "1",
    email: "user@example.com",
  },
  {
    id: "2",
    email: "user2@example.com",
  },
  {
    id: "3",
    email: "user3@example.com",
  },
  {
    id: "4",
    email: "user4@example.com",
  },
];

export const mockAccountBalances = [
  {
    id: "1",
    user_id: "1",
    category_id: "1",
    balance: 1000,
  },
  {
    id: "2",
    user_id: "2",
    category_id: "1",
    balance: -500,
  },
];

export const mockBakis = [
  {
    id: "1",
    user_id: "3",
    category_id: "2",
    balance: 2000,
  },
  {
    id: "2",
    user_id: "4",
    category_id: "2",
    balance: -1000,
  },
];

export const mockTransactions = [
  {
    id: "1",
    amount: 1000,
    target: "account_balance" as const,
    account_balance_id: "1",
    type: "credit" as const,
    user_id: "1",
    category_id: "1",
    source: "RESULT" as const,
    result_id: "1",
  },
  {
    id: "2",
    amount: -500,
    target: "account_balance" as const,
    account_balance_id: "2",
    type: "debit" as const,
    user_id: "2",
    category_id: "1",
    source: "RESULT" as const,
    result_id: "1",
  },
]; 