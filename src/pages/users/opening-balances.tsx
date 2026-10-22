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
import {
  buildFruitCalculatorEmail,
  createUserAccount,
  DEFAULT_NEW_USER_PASSWORD,
} from "../../utils/createUserAccount";
import { supabase } from "../../utils/supabaseClient";
import type { Transaction, TransactionTarget } from "../../types/transaction";

/** Ledger targets supported by the opening-balances CSV. */
type OpeningLedgerTarget = Extract<TransactionTarget, "account_balance" | "baki">;

/** Safe optional profile fields the CSV may update (role is intentionally excluded). */
type ProfileFieldKey = "contact_number" | "birthday";

/** One profile field change shown in preview / applied on confirm. */
interface ProfileFieldChange {
  field: ProfileFieldKey;
  from: string | null;
  to: string;
}

/** Whether confirm will create a new auth user or update an existing one. */
type OpeningUserAction = "create" | "update";

/** One preview row after CSV parse and lookup. */
interface OpeningPreviewRow {
  username: string;
  categoryName: string;
  categoryId: number;
  /** Empty when the row will create a user that does not exist yet. */
  userId: string;
  /** create = username has no account yet; update = match existing user. */
  userAction: OpeningUserAction;
  /** Which balance the row sets; null when the row has no balance update. */
  ledgerTarget: OpeningLedgerTarget | null;
  current: number;
  /** Signed balance the operator wants after import; 0 when no balance update. */
  targetBalance: number;
  delta: number;
  hasBalanceUpdate: boolean;
  profileChanges: ProfileFieldChange[];
  error: string | null;
}

interface ParsedCsvRow {
  username: string;
  /** Null when the row does not update a ledger balance. */
  category: string | null;
  /** Null when the row does not update a ledger balance. */
  balance: number | null;
  /** Null when the row does not update a ledger balance. */
  ledgerTarget: OpeningLedgerTarget | null;
  /** Null means leave unchanged (empty CSV cell). */
  contactNumber: string | null;
  /** Null means leave unchanged (empty CSV cell). */
  birthday: string | null;
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
 * Human label for a profile field key.
 * @param field - Profile field key
 * @returns Short label for UI
 */
function formatProfileFieldLabel(field: ProfileFieldKey): string {
  if (field === "contact_number") {
    return "Phone";
  }
  return "Birthday";
}

/**
 * Formats a profile change for the preview table.
 * @param change - From/to values for one field
 * @returns Display string
 */
function formatProfileChange(change: ProfileFieldChange): string {
  const fromLabel = change.from === null || change.from === "" ? "—" : change.from;
  return `${formatProfileFieldLabel(change.field)}: ${fromLabel} → ${change.to}`;
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
 * Finds the first matching header index among aliases (case already lowercased).
 * @param headers - Lowercased CSV header names
 * @param aliases - Accepted names for one logical column
 * @returns Index or -1 when missing
 */
function findHeaderIndex(headers: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const idx = headers.indexOf(alias);
    if (idx >= 0) {
      return idx;
    }
  }
  return -1;
}

/**
 * Reads an optional string cell; empty means "leave unchanged".
 * @param fields - Split CSV fields for one row
 * @param index - Column index, or -1 when column absent
 * @returns Trimmed value, or null when empty/absent
 */
function readOptionalString(fields: string[], index: number): string | null {
  if (index < 0) {
    return null;
  }
  const value = (fields[index] ?? "").trim();
  if (value === "") {
    return null;
  }
  return value;
}

/**
 * Downloads a CSV template for opening-balance + optional profile import.
 * Always includes contact_number and birthday. Target column only when Baki is on.
 * @param isBakiEnabled - Whether Baki feature is on
 */
function downloadOpeningBalancesTemplate(isBakiEnabled: boolean): void {
  const header = isBakiEnabled
    ? "username,category,balance,target,contact_number,birthday\n"
    : "username,category,balance,contact_number,birthday\n";
  const example = isBakiEnabled
    ? [
        "alice,Default,100,account_balance,09123456789,1/15/1990",
        "bob,Default,-50,baki,,",
        "charlie,,,,09998887777,",
        "",
      ].join("\n")
    : [
        "alice,Default,100,09123456789,1/15/1990",
        "bob,Default,-50,,",
        "charlie,,,09998887777,",
        "",
      ].join("\n");
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
 * Parses a CSV string into opening-balance / profile rows.
 * Required column: username.
 * Balance columns (category, balance, optional target): when present on a row, set OPENING.
 * Optional profile columns: contact_number (or phone), birthday — empty cells leave unchanged.
 * Role is never imported from CSV.
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
  const usernameIdx = findHeaderIndex(headers, ["username"]);
  const categoryIdx = findHeaderIndex(headers, ["category"]);
  const balanceIdx = findHeaderIndex(headers, ["balance"]);
  const targetIdx = findHeaderIndex(headers, ["target"]);
  const contactIdx = findHeaderIndex(headers, ["contact_number", "phone"]);
  const birthdayIdx = findHeaderIndex(headers, ["birthday"]);

  if (usernameIdx < 0) {
    throw new Error("CSV must include a username column");
  }

  const hasBalanceColumns = categoryIdx >= 0 && balanceIdx >= 0;
  const hasProfileColumns = contactIdx >= 0 || birthdayIdx >= 0;

  if (!hasBalanceColumns && !hasProfileColumns) {
    throw new Error(
      "CSV must include category+balance and/or contact_number/phone/birthday columns"
    );
  }

  if ((categoryIdx >= 0) !== (balanceIdx >= 0)) {
    throw new Error("CSV must include both category and balance columns together");
  }

  const rows: ParsedCsvRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const fields = splitCsvLine(lines[i]);
    const username = (fields[usernameIdx] ?? "").trim();
    const categoryRaw =
      categoryIdx >= 0 ? (fields[categoryIdx] ?? "").trim() : "";
    const balanceRaw =
      balanceIdx >= 0 ? (fields[balanceIdx] ?? "").trim() : "";
    const targetRaw = targetIdx >= 0 ? (fields[targetIdx] ?? "").trim() : "";
    const contactNumber = readOptionalString(fields, contactIdx);
    const birthday = readOptionalString(fields, birthdayIdx);

    if (
      !username &&
      !categoryRaw &&
      !balanceRaw &&
      !targetRaw &&
      contactNumber === null &&
      birthday === null
    ) {
      continue;
    }

    if (!username) {
      throw new Error(`Invalid row (username required): ${lines[i]}`);
    }

    const hasBalanceCell = categoryRaw !== "" || balanceRaw !== "";
    let category: string | null = null;
    let balance: number | null = null;
    let ledgerTarget: OpeningLedgerTarget | null = null;

    if (hasBalanceCell) {
      if (!hasBalanceColumns) {
        throw new Error(
          `Balance values require category and balance columns: ${lines[i]}`
        );
      }
      if (!categoryRaw || balanceRaw === "") {
        throw new Error(
          `Invalid balance row (need category and numeric balance): ${lines[i]}`
        );
      }
      const parsedBalance = Number(balanceRaw.replace(/,/g, ""));
      if (isNaN(parsedBalance)) {
        throw new Error(
          `Invalid row (need username, category, numeric balance): ${lines[i]}`
        );
      }

      const parsedTarget = parseLedgerTarget(targetRaw);
      if (parsedTarget === null) {
        throw new Error(
          `Invalid target (use account_balance or baki): ${lines[i]}`
        );
      }
      if (parsedTarget === "baki" && !isBakiEnabled) {
        throw new Error(
          `Baki is disabled — cannot import baki rows (line: ${lines[i]})`
        );
      }

      category = categoryRaw;
      balance = parsedBalance;
      ledgerTarget = parsedTarget;
    } else if (targetRaw !== "") {
      throw new Error(
        `Target requires category and balance on the same row: ${lines[i]}`
      );
    }

    if (
      balance === null &&
      contactNumber === null &&
      birthday === null
    ) {
      throw new Error(
        `Row has nothing to import (balance and/or phone/birthday): ${lines[i]}`
      );
    }

    rows.push({
      username,
      category,
      balance,
      ledgerTarget,
      contactNumber,
      birthday,
    });
  }

  if (rows.length === 0) {
    throw new Error("CSV has no data rows");
  }

  return rows;
}

/**
 * Builds the partial user_details update payload from profile changes.
 * @param changes - Preview profile changes
 * @returns Supabase update object, or null when empty
 */
function buildProfileUpdatePayload(
  changes: ProfileFieldChange[]
): { contact_number?: string; birthday?: string } | null {
  if (changes.length === 0) {
    return null;
  }

  const payload: { contact_number?: string; birthday?: string } = {};
  for (const change of changes) {
    if (change.field === "contact_number") {
      payload.contact_number = change.to;
    } else if (change.field === "birthday") {
      payload.birthday = change.to;
    }
  }
  return payload;
}

/**
 * Admin UI: download template, upload CSV, preview diffs, confirm OPENING txs
 * and optional user_details profile updates (phone / birthday).
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
    const actionable = valid.filter(
      (row) =>
        row.userAction === "create" ||
        (row.hasBalanceUpdate && row.delta !== 0) ||
        row.profileChanges.length > 0
    );
    const createUsernames = new Set(
      valid
        .filter((row) => row.userAction === "create")
        .map((row) => normalizeUsername(row.username))
    );
    const updateUsernames = new Set(
      valid
        .filter((row) => row.userAction === "update")
        .map((row) => normalizeUsername(row.username))
    );
    const netChange = valid.reduce(
      (acc, row) => (row.hasBalanceUpdate ? acc + row.delta : acc),
      0
    );
    return {
      rowCount: previewRows.length,
      validCount: valid.length,
      actionableCount: actionable.length,
      errorCount: previewRows.length - valid.length,
      createUserCount: createUsernames.size,
      updateUserCount: updateUsernames.size,
      netChange,
    };
  }, [previewRows]);

  const showLedgerTargetColumn = useMemo(
    () =>
      isBakiEnabled ||
      previewRows.some((row) => row.ledgerTarget === "baki"),
    [isBakiEnabled, previewRows]
  );

  const showProfileColumn = useMemo(
    () => previewRows.some((row) => row.profileChanges.length > 0),
    [previewRows]
  );

  /**
   * Builds preview rows from parsed CSV against live users/categories/balances.
   * @param parsedRows - Rows from parseOpeningCsv
   * @returns Preview rows with current/target/delta, profile diffs, or row errors
   */
  const buildPreview = useCallback(
    (parsedRows: ParsedCsvRow[]): OpeningPreviewRow[] => {
      return parsedRows.map((row) => {
        const usernameKey = normalizeUsername(row.username);
        const user = users.find(
          (u) => normalizeUsername(u.email.split("@")[0] ?? "") === usernameKey
        );
        const userAction: OpeningUserAction = user ? "update" : "create";
        const userId = user?.id ?? "";

        const profileChanges: ProfileFieldChange[] = [];
        const currentContact = user?.user_detail?.contact_number ?? null;
        const currentBirthday = user?.user_detail?.birthday ?? null;

        if (row.contactNumber !== null && row.contactNumber !== currentContact) {
          profileChanges.push({
            field: "contact_number",
            from: currentContact,
            to: row.contactNumber,
          });
        }
        if (row.birthday !== null && row.birthday !== currentBirthday) {
          profileChanges.push({
            field: "birthday",
            from: currentBirthday,
            to: row.birthday,
          });
        }

        const rowCategory = row.category;
        const rowBalance = row.balance;
        const rowLedgerTarget = row.ledgerTarget;

        if (rowBalance === null || rowCategory === null || rowLedgerTarget === null) {
          return {
            username: row.username,
            categoryName: "",
            categoryId: 0,
            userId,
            userAction,
            ledgerTarget: null,
            current: 0,
            targetBalance: 0,
            delta: 0,
            hasBalanceUpdate: false,
            profileChanges,
            error: null,
          };
        }

        const category = categories.find(
          (c) =>
            c.name.trim().toLowerCase() === rowCategory.trim().toLowerCase()
        );

        if (!category) {
          return {
            username: row.username,
            categoryName: rowCategory,
            categoryId: 0,
            userId,
            userAction,
            ledgerTarget: rowLedgerTarget,
            current: 0,
            targetBalance: rowBalance,
            delta: 0,
            hasBalanceUpdate: true,
            profileChanges,
            error: `Category not found: ${rowCategory}`,
          };
        }

        if (rowLedgerTarget === "baki" && !isBakiEnabled) {
          return {
            username: row.username,
            categoryName: category.name,
            categoryId: category.id,
            userId,
            userAction,
            ledgerTarget: rowLedgerTarget,
            current: 0,
            targetBalance: rowBalance,
            delta: 0,
            hasBalanceUpdate: true,
            profileChanges,
            error: "Baki is disabled — cannot import baki rows",
          };
        }

        const current =
          userAction === "create"
            ? 0
            : rowLedgerTarget === "baki"
              ? (bakis.find(
                  (b) => b.user_id === userId && b.category_id === category.id
                )?.balance ?? 0)
              : (accountBalances.find(
                  (ab) =>
                    ab.user_id === userId && ab.category_id === category.id
                )?.balance ?? 0);

        const targetBalance = rowBalance;
        const delta = targetBalance - current;

        return {
          username: row.username,
          categoryName: category.name,
          categoryId: category.id,
          userId,
          userAction,
          ledgerTarget: rowLedgerTarget,
          current,
          targetBalance,
          delta,
          hasBalanceUpdate: true,
          profileChanges,
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
   * Applies profile field updates for one user (empty cells already excluded).
   * @param userId - Auth user id
   * @param changes - Profile field changes to write
   */
  const applyProfileChanges = async (
    userId: string,
    changes: ProfileFieldChange[]
  ): Promise<void> => {
    const payload = buildProfileUpdatePayload(changes);
    if (payload === null) {
      return;
    }

    const { error } = await supabase
      .from("user_details")
      .update(payload)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to update profile for user ${userId}: ${error.message}`);
    }
  };

  /**
   * Merges profile field changes across rows for one username (last value wins).
   * @param rows - Valid preview rows for one username
   * @returns Deduplicated profile changes
   */
  const mergeProfileChanges = (
    rows: OpeningPreviewRow[]
  ): ProfileFieldChange[] => {
    const byField = new Map<ProfileFieldKey, ProfileFieldChange>();
    for (const row of rows) {
      for (const change of row.profileChanges) {
        byField.set(change.field, change);
      }
    }
    return Array.from(byField.values());
  };

  /**
   * Collects profile values to stamp onto a newly created user from all CSV rows
   * for that username (last non-empty wins per field).
   * @param rows - Valid preview rows for one username
   * @returns contact/birthday to pass into createUserAccount
   */
  const collectCreateProfile = (
    rows: OpeningPreviewRow[]
  ): { contactNumber: string | null; birthday: string | null } => {
    const merged = mergeProfileChanges(rows);
    let contactNumber: string | null = null;
    let birthday: string | null = null;
    for (const change of merged) {
      if (change.field === "contact_number") {
        contactNumber = change.to;
      }
      if (change.field === "birthday") {
        birthday = change.to;
      }
    }
    return { contactNumber, birthday };
  };

  /**
   * Confirms import: create missing users, optional profile updates, reverse prior
   * OPENING, then post new OPENING deltas.
   */
  const handleConfirm = async () => {
    if (!isAdmin || isConfirming) {
      return;
    }

    const validRows = previewRows.filter((row) => row.error === null);
    const actionableRows = validRows.filter(
      (row) =>
        row.userAction === "create" ||
        (row.hasBalanceUpdate && row.delta !== 0) ||
        row.profileChanges.length > 0
    );
    if (actionableRows.length === 0) {
      showAlert("No changes to import", "error");
      return;
    }

    setIsConfirming(true);
    try {
      const categoryIds = categories.map((category) => category.id);
      const createdUserIds = new Map<string, string>();

      const createUsernameKeys = Array.from(
        new Set(
          validRows
            .filter((row) => row.userAction === "create")
            .map((row) => normalizeUsername(row.username))
        )
      );

      for (const usernameKey of createUsernameKeys) {
        const rowsForUser = validRows.filter(
          (row) => normalizeUsername(row.username) === usernameKey
        );
        const displayUsername = rowsForUser[0]?.username ?? usernameKey;
        const profile = collectCreateProfile(rowsForUser);
        const created = await createUserAccount({
          email: buildFruitCalculatorEmail(displayUsername),
          password: DEFAULT_NEW_USER_PASSWORD,
          role: "customer",
          contactNumber: profile.contactNumber,
          birthday: profile.birthday,
          categoryIds,
          createBakis: isBakiEnabled,
        });
        createdUserIds.set(usernameKey, created.id);
      }

      const resolvedUserIds = new Map<string, string>();
      for (const row of validRows) {
        const usernameKey = normalizeUsername(row.username);
        if (row.userAction === "create") {
          const createdId = createdUserIds.get(usernameKey);
          if (typeof createdId !== "string" || createdId === "") {
            throw new Error(`Failed to resolve created user: ${row.username}`);
          }
          resolvedUserIds.set(usernameKey, createdId);
        } else {
          resolvedUserIds.set(usernameKey, row.userId);
        }
      }

      const updateUsernameKeys = Array.from(
        new Set(
          validRows
            .filter((row) => row.userAction === "update")
            .map((row) => normalizeUsername(row.username))
        )
      );

      for (const usernameKey of updateUsernameKeys) {
        const rowsForUser = validRows.filter(
          (row) => normalizeUsername(row.username) === usernameKey
        );
        const userId = resolvedUserIds.get(usernameKey);
        if (typeof userId !== "string" || userId === "") {
          throw new Error(`Missing user id for ${usernameKey}`);
        }
        const mergedProfile = mergeProfileChanges(rowsForUser);
        if (mergedProfile.length > 0) {
          await applyProfileChanges(userId, mergedProfile);
        }
      }

      for (const row of validRows) {
        const usernameKey = normalizeUsername(row.username);
        const userId = resolvedUserIds.get(usernameKey);
        if (typeof userId !== "string" || userId === "") {
          throw new Error(`Missing user id for ${row.username}`);
        }

        if (!row.hasBalanceUpdate || row.ledgerTarget === null) {
          continue;
        }

        if (row.ledgerTarget === "baki" && !isBakiEnabled) {
          throw new Error("Baki is disabled — cannot import baki rows");
        }

        const prior = findPriorOpenings(
          userId,
          row.categoryId,
          row.ledgerTarget
        );
        for (const tx of prior) {
          await deleteTransaction(tx);
        }

        if (row.ledgerTarget === "baki") {
          const baki = await getOrCreateBaki(userId, row.categoryId);

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
            user_id: userId,
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
          userId,
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
          user_id: userId,
          category_id: row.categoryId,
          amount,
          type,
          target: "account_balance",
          source: "OPENING",
          account_balance_id: fresh.id,
        });
      }

      const createdCount = createUsernameKeys.length;
      showAlert(
        createdCount > 0
          ? `Import applied (${String(createdCount)} user(s) created; default password ${DEFAULT_NEW_USER_PASSWORD})`
          : "Opening balances and profile fields applied",
        "success"
      );
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
          Each balance row posts an audit-friendly OPENING transaction. Re-import replaces prior
          OPENING rows for the same user, category, and target.
          Optional profile columns update user details when filled; empty cells leave existing
          values unchanged. Role is not imported from CSV (new accounts are always customer).
          Usernames that do not match an existing account are created as{" "}
          <code className="text-xs">username@fruitcalculator.com</code> with default password{" "}
          <code className="text-xs">{DEFAULT_NEW_USER_PASSWORD}</code> (same email convention as Add User).
          {isBakiEnabled
            ? " Columns: username, category, balance, target (account_balance|baki), contact_number (or phone), birthday. A row may set balance only, profile only, or both."
            : " Columns: username, category, balance, contact_number (or phone), birthday. A row may set balance only, profile only, or both (Baki rows are rejected while Baki is off)."}
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
              {summary.createUserCount} create / {summary.updateUserCount} update
              {" · "}
              {summary.actionableCount} with changes
              {" · "}
              Net balance change {formatSignedBalance(summary.netChange)}
            </p>
            <div className="mb-4 max-h-80 overflow-auto">
              <Table>
                <Table.Head>
                  <Table.HeadCell>User</Table.HeadCell>
                  <Table.HeadCell>Action</Table.HeadCell>
                  <Table.HeadCell>Category</Table.HeadCell>
                  {showLedgerTargetColumn && (
                    <Table.HeadCell>Target</Table.HeadCell>
                  )}
                  <Table.HeadCell>Current → Target</Table.HeadCell>
                  {showProfileColumn && (
                    <Table.HeadCell>Profile</Table.HeadCell>
                  )}
                  <Table.HeadCell>Status</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  {previewRows.map((row, rowIndex) => {
                    const rowKey = [
                      row.username,
                      row.categoryName,
                      row.ledgerTarget ?? "profile",
                      String(row.targetBalance),
                      String(rowIndex),
                    ].join("-");
                    const hasBalanceChange =
                      row.hasBalanceUpdate && row.delta !== 0;
                    const hasProfileChange = row.profileChanges.length > 0;
                    const isCreate = row.userAction === "create";
                    const isActionable =
                      isCreate || hasBalanceChange || hasProfileChange;
                    return (
                      <Table.Row key={rowKey}>
                        <Table.Cell>{row.username}</Table.Cell>
                        <Table.Cell>
                          {row.error ? (
                            "—"
                          ) : isCreate ? (
                            <span className="text-blue-700 dark:text-blue-400">
                              Create
                            </span>
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">
                              Update
                            </span>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          {row.hasBalanceUpdate ? row.categoryName : "—"}
                        </Table.Cell>
                        {showLedgerTargetColumn && (
                          <Table.Cell>
                            {row.ledgerTarget
                              ? formatLedgerTargetLabel(row.ledgerTarget)
                              : "—"}
                          </Table.Cell>
                        )}
                        <Table.Cell>
                          {row.error
                            ? "—"
                            : row.hasBalanceUpdate
                              ? previewBalanceChange(row.current, row.delta)
                              : "—"}
                        </Table.Cell>
                        {showProfileColumn && (
                          <Table.Cell>
                            {row.profileChanges.length === 0
                              ? "—"
                              : row.profileChanges
                                  .map((change) => formatProfileChange(change))
                                  .join("; ")}
                          </Table.Cell>
                        )}
                        <Table.Cell>
                          {row.error ? (
                            <span className="text-red-600 dark:text-red-400">
                              {row.error}
                            </span>
                          ) : !isActionable ? (
                            <span className="text-gray-500">No change</span>
                          ) : (
                            <span className="text-green-700 dark:text-green-400">
                              {isCreate ? "Will create" : "Ready"}
                            </span>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            </div>
            <Button
              color="primary"
              disabled={isConfirming || summary.actionableCount === 0}
              onClick={handleConfirm}>
              {isConfirming ? "Applying..." : "Confirm import"}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default OpeningBalancesCard;
