import React, { useCallback, useMemo, useState } from "react";
import { Button, Card, FileInput, Label, Table } from "flowbite-react";
import { useAlertContext } from "../../context/AlertContext";
import { useAccountBalanceContext } from "../../context/AccountBalanceContext";
import { useAppSettingsContext } from "../../context/AppSettingsContext";
import { useAuthContext } from "../../context/AuthContext";
import { useCategoryContext } from "../../context/CategoryContext";
import { useTransactionContext } from "../../context/TransactionContext";
import { useUserContext } from "../../context/UserContext";
import {
  formatSignedBalance,
  previewBalanceChange,
  signedDeltaToTransactionType,
} from "../../utils/balanceLanguage";
import { supabase } from "../../utils/supabaseClient";
import type { Transaction } from "../../types/transaction";

/** One preview row after CSV parse and lookup. */
interface OpeningPreviewRow {
  username: string;
  categoryName: string;
  categoryId: number;
  userId: string;
  current: number;
  target: number;
  delta: number;
  error: string | null;
}

interface ParsedCsvRow {
  username: string;
  category: string;
  balance: number;
}

/**
 * Downloads a CSV template for opening-balance import.
 * Columns: username, category, balance (signed target; + = they owe).
 */
function downloadOpeningBalancesTemplate(): void {
  const header = "username,category,balance\n";
  const example = "alice,Default,100\nbob,Default,-50\n";
  const blob = new Blob([header + example], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "opening-balances-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Normalizes a username for matching against email local-part.
 * @param value - Raw username from CSV
 * @returns Lowercased trimmed username
 */
function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Splits a single CSV line on commas (supports simple quoted fields).
 * @param line - One CSV line
 * @returns Field values
 */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Parses a CSV string into opening-balance rows.
 * @param csvText - Raw CSV file contents
 * @returns Parsed rows
 */
function parseOpeningCsv(csvText: string): ParsedCsvRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("CSV has no data rows");
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const usernameIdx = headers.indexOf("username");
  const categoryIdx = headers.indexOf("category");
  const balanceIdx = headers.indexOf("balance");

  if (usernameIdx < 0 || categoryIdx < 0 || balanceIdx < 0) {
    throw new Error("CSV must include username, category, balance columns");
  }

  const rows: ParsedCsvRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const fields = splitCsvLine(lines[i]);
    const username = (fields[usernameIdx] ?? "").trim();
    const category = (fields[categoryIdx] ?? "").trim();
    const balanceRaw = (fields[balanceIdx] ?? "").trim();

    if (!username && !category && !balanceRaw) {
      continue;
    }

    const balance = Number(balanceRaw.replace(/,/g, ""));
    if (!username || !category || isNaN(balance)) {
      throw new Error(
        `Invalid row (need username, category, numeric balance): ${lines[i]}`
      );
    }

    rows.push({ username, category, balance });
  }

  if (rows.length === 0) {
    throw new Error("CSV has no data rows");
  }

  return rows;
}

/**
 * Admin UI: download template, upload CSV, preview diffs, confirm OPENING txs.
 * Replace semantics: prior OPENING txs for the same user×category are reversed first.
 */
const OpeningBalancesCard: React.FC = function () {
  const { user_detail } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { users } = useUserContext();
  const { categories } = useCategoryContext();
  const { accountBalances, getOrCreateAccountBalance } = useAccountBalanceContext();
  const { isBakiEnabled } = useAppSettingsContext();
  const { transactions, addTransaction, deleteTransaction } = useTransactionContext();
  const [previewRows, setPreviewRows] = useState<OpeningPreviewRow[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const isAdmin = user_detail?.role === "admin";

  const summary = useMemo(() => {
    const valid = previewRows.filter((row) => row.error === null);
    const netChange = valid.reduce((acc, row) => acc + row.delta, 0);
    return {
      rowCount: previewRows.length,
      validCount: valid.length,
      errorCount: previewRows.length - valid.length,
      netChange,
    };
  }, [previewRows]);

  /**
   * Builds preview rows from parsed CSV against live users/categories/balances.
   */
  const buildPreview = useCallback(
    (parsedRows: ParsedCsvRow[]): OpeningPreviewRow[] => {
      return parsedRows.map((row) => {
        const usernameKey = normalizeUsername(row.username);
        const user = users.find(
          (u) => normalizeUsername(u.email.split("@")[0] ?? "") === usernameKey
        );
        const category = categories.find(
          (c) => c.name.trim().toLowerCase() === row.category.trim().toLowerCase()
        );

        if (!user) {
          return {
            username: row.username,
            categoryName: row.category,
            categoryId: 0,
            userId: "",
            current: 0,
            target: row.balance,
            delta: 0,
            error: `User not found: ${row.username}`,
          };
        }

        if (!category) {
          return {
            username: row.username,
            categoryName: row.category,
            categoryId: 0,
            userId: user.id,
            current: 0,
            target: row.balance,
            delta: 0,
            error: `Category not found: ${row.category}`,
          };
        }

        const balanceRow = accountBalances.find(
          (ab) => ab.user_id === user.id && ab.category_id === category.id
        );

        const current = balanceRow?.balance ?? 0;
        const target = row.balance;
        const delta = target - current;

        return {
          username: row.username,
          categoryName: category.name,
          categoryId: category.id,
          userId: user.id,
          current,
          target,
          delta,
          error: null,
        };
      });
    },
    [users, categories, accountBalances]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        const parsed = parseOpeningCsv(text);
        setPreviewRows(buildPreview(parsed));
      } catch (error) {
        setPreviewRows([]);
        showAlert(
          error instanceof Error ? error.message : "Failed to read CSV",
          "error"
        );
      }
    };
    reader.onerror = () => {
      showAlert("Failed to read CSV file", "error");
    };
    reader.readAsText(file);
  };

  /**
   * Finds prior OPENING transactions for a user × category on account_balance.
   */
  const findPriorOpenings = useCallback(
    (userId: string, categoryId: number): Transaction[] => {
      return transactions.filter(
        (tx) =>
          tx.source === "OPENING" &&
          tx.user_id === userId &&
          tx.category_id === categoryId &&
          tx.target === "account_balance"
      );
    },
    [transactions]
  );

  /**
   * Confirms import: reverse prior OPENING for each row, then post new OPENING deltas.
   */
  const handleConfirm = async () => {
    if (!isAdmin || isConfirming) {
      return;
    }

    const validRows = previewRows.filter((row) => row.error === null);
    if (validRows.length === 0) {
      showAlert("No valid rows to import", "error");
      return;
    }

    setIsConfirming(true);
    try {
      for (const row of validRows) {
        const prior = findPriorOpenings(row.userId, row.categoryId);
        for (const tx of prior) {
          await deleteTransaction(tx);
        }

        const accountBalance = await getOrCreateAccountBalance(
          row.userId,
          row.categoryId
        );

        const { data: fresh, error: freshError } = await supabase
          .from("account_balances")
          .select("balance,id")
          .eq("id", accountBalance.id)
          .single();

        if (freshError || !fresh) {
          throw new Error(
            `Failed to refresh balance for ${row.username} / ${row.categoryName}`
          );
        }

        const delta = row.target - fresh.balance;
        if (delta === 0) {
          continue;
        }

        const { type, amount } = signedDeltaToTransactionType(delta);
        await addTransaction({
          user_id: row.userId,
          category_id: row.categoryId,
          amount,
          type,
          target: "account_balance",
          source: "OPENING",
          account_balance_id: fresh.id,
        });
      }

      showAlert("Opening balances applied", "success");
      setPreviewRows([]);
    } catch (error) {
      console.error("Opening balances import failed:", error);
      showAlert(
        error instanceof Error ? error.message : "Opening balances import failed",
        "error"
      );
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card data-tour="opening-balances">
      <div className="flow-root">
        <h3 className="text-xl font-bold dark:text-white">
          Set opening balances
        </h3>
        <p className="mb-4 text-sm font-normal text-gray-500 dark:text-gray-400">
          Import a CSV of signed targets (positive = they owe, negative = we owe them).
          Each row posts an audit-friendly OPENING transaction. Re-import replaces prior
          OPENING rows for the same user and category.
          {isBakiEnabled
            ? " Baki is on; this import still sets Account balance only."
            : " Baki is off — Account balance only."}
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button color="gray" onClick={downloadOpeningBalancesTemplate}>
            Download CSV template
          </Button>
          <div>
            <Label htmlFor="opening-balances-csv" className="mb-1 block">
              Upload CSV
            </Label>
            <FileInput
              id="opening-balances-csv"
              accept=".csv,text/csv"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {previewRows.length > 0 && (
          <>
            <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
              Preview: {summary.validCount} valid / {summary.rowCount} rows
              {summary.errorCount > 0
                ? ` (${summary.errorCount} errors)`
                : ""}
              {" · "}
              Net change {formatSignedBalance(summary.netChange)}
            </p>
            <div className="mb-4 max-h-80 overflow-auto">
              <Table>
                <Table.Head>
                  <Table.HeadCell>User</Table.HeadCell>
                  <Table.HeadCell>Category</Table.HeadCell>
                  <Table.HeadCell>Current → Target</Table.HeadCell>
                  <Table.HeadCell>Status</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  {previewRows.map((row) => (
                    <Table.Row
                      key={`${row.username}-${row.categoryName}-${row.target}`}>
                      <Table.Cell>{row.username}</Table.Cell>
                      <Table.Cell>{row.categoryName}</Table.Cell>
                      <Table.Cell>
                        {row.error
                          ? "—"
                          : previewBalanceChange(row.current, row.delta)}
                      </Table.Cell>
                      <Table.Cell>
                        {row.error ? (
                          <span className="text-red-600 dark:text-red-400">
                            {row.error}
                          </span>
                        ) : row.delta === 0 ? (
                          <span className="text-gray-500">No change</span>
                        ) : (
                          <span className="text-green-700 dark:text-green-400">
                            Ready
                          </span>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
            <Button
              color="primary"
              disabled={isConfirming || summary.validCount === 0}
              onClick={handleConfirm}>
              {isConfirming ? "Applying..." : "Confirm opening balances"}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default OpeningBalancesCard;
