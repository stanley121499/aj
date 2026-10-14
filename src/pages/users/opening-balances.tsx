import React, { useCallback, useMemo, useState } from "react";
import { Button, Card, FileInput, Label, Table } from "flowbite-react";
import { useAlertContext } from "../../context/AlertContext";
import { useAccountBalanceContext } from "../../context/AccountBalanceContext";
import { useAppSettingsContext } from "../../context/AppSettingsContext";
import { useAuthContext } from "../../context/AuthContext";
import { useBakiContext } from "../../context/BakiContext";
import { useCategoryContext } from "../../context/CategoryContext";
import { useTransactionContext } from "../../context/TransactionContext";
import { useUserContext } from "../../context/UserContext";
import {
  formatSignedBalance,
  previewBalanceChange,
  signedDeltaToTransactionType,
} from "../../utils/balanceLanguage";
import { supabase } from "../../utils/supabaseClient";
import type { Transaction, TransactionTarget } from "../../types/transaction";

/** Ledger targets supported by the opening-balances CSV. */
type OpeningLedgerTarget = Extract<TransactionTarget, "account_balance" | "baki">;

/** One preview row after CSV parse and lookup. */
interface OpeningPreviewRow {
  username: string;
  categoryName: string;
  categoryId: number;
  userId: string;
  /** Which balance the row sets (account_balance or baki). */
  ledgerTarget: OpeningLedgerTarget;
  current: number;
  /** Signed balance the operator wants after import. */
  targetBalance: number;
  delta: number;
  error: string | null;
}

interface ParsedCsvRow {
  username: string;
  category: string;
  balance: number;
  ledgerTarget: OpeningLedgerTarget;
}

/**
 * Human label for a ledger target column value.
 * @param ledgerTarget - account_balance or baki
 * @returns Short label for UI
 */
function formatLedgerTargetLabel(ledgerTarget: OpeningLedgerTarget): string {
  return ledgerTarget === "baki" ? "Baki" : "Account";
}

/**
 * Parses and validates the optional CSV `target` cell.
 * @param raw - Raw target field (may be empty when column omitted)
 * @returns Normalized ledger target, or null when invalid
 */
function parseLedgerTarget(raw: string): OpeningLedgerTarget | null {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "" || normalized === "account_balance") {
    return "account_balance";
  }
  if (normalized === "baki") {
    return "baki";
  }
  return null;
}

/**
 * Downloads a CSV template for opening-balance import.
 * Baki off: username, category, balance.
 * Baki on: username, category, balance, target (account_balance|baki).
 * @param isBakiEnabled - Whether Baki feature is on
 */
function downloadOpeningBalancesTemplate(isBakiEnabled: boolean): void {
  const header = isBakiEnabled
    ? "username,category,balance,target\n"
    : "username,category,balance\n";
  const example = isBakiEnabled
    ? "alice,Default,100,account_balance\nbob,Default,-50,baki\n"
    : "alice,Default,100\nbob,Default,-50\n";
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
 * Required columns: username, category, balance.
 * Optional column: target (account_balance|baki). Defaults to account_balance.
 * When Baki is off, rows with target=baki throw a clear error.
 * @param csvText - Raw CSV file contents
 * @param isBakiEnabled - Whether Baki feature is on
 * @returns Parsed rows
 */
function parseOpeningCsv(csvText: string, isBakiEnabled: boolean): ParsedCsvRow[] {
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
  const targetIdx = headers.indexOf("target");

  if (usernameIdx < 0 || categoryIdx < 0 || balanceIdx < 0) {
    throw new Error("CSV must include username, category, balance columns");
  }

  const rows: ParsedCsvRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const fields = splitCsvLine(lines[i]);
    const username = (fields[usernameIdx] ?? "").trim();
    const category = (fields[categoryIdx] ?? "").trim();
    const balanceRaw = (fields[balanceIdx] ?? "").trim();
    const targetRaw = targetIdx >= 0 ? (fields[targetIdx] ?? "").trim() : "";

    if (!username && !category && !balanceRaw && !targetRaw) {
      continue;
    }

    const balance = Number(balanceRaw.replace(/,/g, ""));
    if (!username || !category || isNaN(balance)) {
      throw new Error(
        `Invalid row (need username, category, numeric balance): ${lines[i]}`
      );
    }

    const ledgerTarget = parseLedgerTarget(targetRaw);
    if (ledgerTarget === null) {
      throw new Error(
        `Invalid target (use account_balance or baki): ${lines[i]}`
      );
    }

    if (ledgerTarget === "baki" && !isBakiEnabled) {
      throw new Error(
        `Baki is disabled — cannot import baki rows (line: ${lines[i]})`
      );
    }

    rows.push({ username, category, balance, ledgerTarget });
  }

  if (rows.length === 0) {
    throw new Error("CSV has no data rows");
  }

  return rows;
}

/**
 * Admin UI: download template, upload CSV, preview diffs, confirm OPENING txs.
 * Replace semantics: prior OPENING txs for the same user×category×target are reversed first.
 */
const OpeningBalancesCard: React.FC = function () {
  const { user_detail } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { users } = useUserContext();
  const { categories } = useCategoryContext();
  const { accountBalances, getOrCreateAccountBalance } = useAccountBalanceContext();
  const { bakis, getOrCreateBaki } = useBakiContext();
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

  const showLedgerTargetColumn = useMemo(
    () =>
      isBakiEnabled ||
      previewRows.some((row) => row.ledgerTarget === "baki"),
    [isBakiEnabled, previewRows]
  );

  /**
   * Builds preview rows from parsed CSV against live users/categories/balances.
   * @param parsedRows - Rows from parseOpeningCsv
   * @returns Preview rows with current/target/delta or row errors
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
            ledgerTarget: row.ledgerTarget,
            current: 0,
            targetBalance: row.balance,
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
            ledgerTarget: row.ledgerTarget,
            current: 0,
            targetBalance: row.balance,
            delta: 0,
            error: `Category not found: ${row.category}`,
          };
        }

        if (row.ledgerTarget === "baki" && !isBakiEnabled) {
          return {
            username: row.username,
            categoryName: category.name,
            categoryId: category.id,
            userId: user.id,
            ledgerTarget: row.ledgerTarget,
            current: 0,
            targetBalance: row.balance,
            delta: 0,
            error: "Baki is disabled — cannot import baki rows",
          };
        }

        const current =
          row.ledgerTarget === "baki"
            ? (bakis.find(
                (b) => b.user_id === user.id && b.category_id === category.id
              )?.balance ?? 0)
            : (accountBalances.find(
                (ab) => ab.user_id === user.id && ab.category_id === category.id
              )?.balance ?? 0);

        const targetBalance = row.balance;
        const delta = targetBalance - current;

        return {
          username: row.username,
          categoryName: category.name,
          categoryId: category.id,
          userId: user.id,
          ledgerTarget: row.ledgerTarget,
          current,
          targetBalance,
          delta,
          error: null,
        };
      });
    },
    [users, categories, accountBalances, bakis, isBakiEnabled]
  );

  /**
   * Reads an uploaded CSV and builds the preview table.
   * @param event - File input change event
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        const parsed = parseOpeningCsv(text, isBakiEnabled);
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
   * Finds prior OPENING transactions for a user × category × ledger target.
   * @param userId - User id
   * @param categoryId - Category id
   * @param ledgerTarget - account_balance or baki
   * @returns Matching OPENING transactions
   */
  const findPriorOpenings = useCallback(
    (
      userId: string,
      categoryId: number,
      ledgerTarget: OpeningLedgerTarget
    ): Transaction[] => {
      return transactions.filter(
        (tx) =>
          tx.source === "OPENING" &&
          tx.user_id === userId &&
          tx.category_id === categoryId &&
          tx.target === ledgerTarget
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
        if (row.ledgerTarget === "baki" && !isBakiEnabled) {
          throw new Error("Baki is disabled — cannot import baki rows");
        }

        const prior = findPriorOpenings(
          row.userId,
          row.categoryId,
          row.ledgerTarget
        );
        for (const tx of prior) {
          await deleteTransaction(tx);
        }

        if (row.ledgerTarget === "baki") {
          const baki = await getOrCreateBaki(row.userId, row.categoryId);

          const { data: fresh, error: freshError } = await supabase
            .from("bakis")
            .select("balance,id")
            .eq("id", baki.id)
            .single();

          if (freshError || !fresh) {
            throw new Error(
              `Failed to refresh Baki for ${row.username} / ${row.categoryName}`
            );
          }

          const delta = row.targetBalance - fresh.balance;
          if (delta === 0) {
            continue;
          }

          const { type, amount } = signedDeltaToTransactionType(delta);
          await addTransaction({
            user_id: row.userId,
            category_id: row.categoryId,
            amount,
            type,
            target: "baki",
            source: "OPENING",
            baki_id: fresh.id,
          });
          continue;
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

        const delta = row.targetBalance - fresh.balance;
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
          OPENING rows for the same user, category, and target.
          {isBakiEnabled
            ? " Columns: username, category, balance, target — where target is account_balance or baki."
            : " Columns: username, category, balance (Account balance only; Baki rows are rejected while Baki is off)."}
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button
            color="gray"
            onClick={() => downloadOpeningBalancesTemplate(isBakiEnabled)}>
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
                  {showLedgerTargetColumn && (
                    <Table.HeadCell>Target</Table.HeadCell>
                  )}
                  <Table.HeadCell>Current → Target</Table.HeadCell>
                  <Table.HeadCell>Status</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  {previewRows.map((row) => (
                    <Table.Row
                      key={`${row.username}-${row.categoryName}-${row.ledgerTarget}-${row.targetBalance}`}>
                      <Table.Cell>{row.username}</Table.Cell>
                      <Table.Cell>{row.categoryName}</Table.Cell>
                      {showLedgerTargetColumn && (
                        <Table.Cell>
                          {formatLedgerTargetLabel(row.ledgerTarget)}
                        </Table.Cell>
                      )}
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
