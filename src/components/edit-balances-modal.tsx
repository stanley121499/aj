/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Label, Modal, TextInput } from "flowbite-react";
import React, { useCallback, useEffect, useState } from "react";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { useAlertContext } from "../context/AlertContext";
import { useAppSettingsContext } from "../context/AppSettingsContext";
import { useCategoryContext } from "../context/CategoryContext";
import { useTransactionContext } from "../context/TransactionContext";
import type { User } from "../context/UserContext";
import {
  balanceDirectionLabel,
  formatSignedBalance,
  previewBalanceChange,
} from "../utils/balanceLanguage";
import {
  parseBalanceInput,
  postBalanceEdits,
} from "../utils/postBalanceEdits";

interface EditBalancesModalProps {
  user: User;
  /** Label on the trigger button (Orange keeps "Update"). */
  triggerLabel?: string;
}

interface DraftBalances {
  account_balance: Array<{ id: string; category_id: number; balance: number }>;
  baki: Array<{ id: string; category_id: number; balance: number }>;
}

/**
 * Clones balance rows from a user into editable draft state.
 * @param source - User whose balances seed the form
 * @returns Deep-copied draft balances
 */
function cloneDraftFromUser(source: User): DraftBalances {
  return {
    account_balance: source.account_balance.map((row) => ({
      id: row.id,
      category_id: row.category_id,
      balance: row.balance,
    })),
    baki: source.baki.map((row) => ({
      id: row.id,
      category_id: row.category_id,
      balance: row.balance,
    })),
  };
}

/**
 * Staff modal: set target balances per category; each change posts a PAYOUT delta tx.
 * Uses signed math (target - current) via postBalanceEdits / signedDeltaToTransactionType.
 */
const EditBalancesModal: React.FC<EditBalancesModalProps> = ({
  user,
  triggerLabel = "Edit balances",
}) => {
  const [isOpen, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftBalances>(() => cloneDraftFromUser(user));
  const [baseline, setBaseline] = useState<DraftBalances>(() =>
    cloneDraftFromUser(user)
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const { showAlert } = useAlertContext();
  const { categories } = useCategoryContext();
  const { addTransaction } = useTransactionContext();
  const { isBakiEnabled } = useAppSettingsContext();

  // Refresh draft from latest user whenever the modal opens.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const next = cloneDraftFromUser(user);
    setDraft(next);
    setBaseline(next);
  }, [isOpen, user]);

  const categoryName = useCallback(
    (categoryId: number): string => {
      return categories.find((category) => category.id === categoryId)?.name ?? "Unknown";
    },
    [categories]
  );

  /**
   * Applies target edits: fetch live balances, post delta PAYOUT txs, close on success.
   */
  const handleSave = useCallback(async () => {
    try {
      setIsUpdating(true);
      const posted = await postBalanceEdits({
        userId: user.id,
        accountBalances: draft.account_balance,
        bakis: draft.baki,
        includeBaki: isBakiEnabled,
        addTransaction,
      });

      if (posted === 0) {
        showAlert("No balance changes to save", "success");
      } else {
        showAlert(
          `Updated ${posted} balance${posted === 1 ? "" : "s"} via transaction`,
          "success"
        );
      }
      setOpen(false);
    } catch (error) {
      console.error("Error updating balances:", error);
      showAlert(
        error instanceof Error ? error.message : "Error updating balances",
        "error"
      );
    } finally {
      setIsUpdating(false);
    }
  }, [user.id, draft, isBakiEnabled, addTransaction, showAlert]);

  /**
   * Clears below-zero (we owe) balances to settled zero; leaves they-owe alone.
   */
  const handleClearAll = useCallback(() => {
    setDraft((prev) => ({
      account_balance: prev.account_balance.map((row) =>
        row.balance < 0 ? { ...row, balance: 0 } : row
      ),
      baki: isBakiEnabled
        ? prev.baki.map((row) =>
            row.balance < 0 ? { ...row, balance: 0 } : row
          )
        : prev.baki,
    }));
  }, [isBakiEnabled]);

  const handleBalanceChange = useCallback(
    (type: "baki" | "account_balance", id: string, raw: string) => {
      const parsed = parseBalanceInput(raw);
      if (parsed === null) {
        return;
      }
      setDraft((prev) => ({
        ...prev,
        [type]: prev[type].map((row) =>
          row.id === id ? { ...row, balance: parsed } : row
        ),
      }));
    },
    []
  );

  /**
   * Renders one category field with who-owes-whom labels and current → target preview.
   */
  const renderBalanceField = (
    type: "baki" | "account_balance",
    row: { id: string; category_id: number; balance: number }
  ) => {
    const current =
      baseline[type].find((el) => el.id === row.id)?.balance ?? row.balance;
    const delta = row.balance - current;
    const inputId = `${type}-${row.id}`;

    return (
      <div key={row.id} className="mb-4 space-y-1">
        <Label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {categoryName(row.category_id)}
        </Label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Current: {formatSignedBalance(current)} (
          {balanceDirectionLabel(current, "staff")}) · Target meaning:{" "}
          {balanceDirectionLabel(row.balance, "staff")}
        </p>
        <TextInput
          id={inputId}
          name={inputId}
          type="number"
          step="0.01"
          placeholder="Target balance"
          value={row.balance}
          onChange={(e) => handleBalanceChange(type, row.id, e.target.value)}
        />
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {delta === 0
            ? "No change"
            : `Preview: ${previewBalanceChange(current, delta)}`}
        </p>
      </div>
    );
  };

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-x-2">
          <HiOutlinePencilAlt className="text-xs" />
          {triggerLabel}
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen} size="7xl">
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>
            Edit balances — {user.email.split("@")[0] ?? user.email}
          </strong>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Enter the target signed balance per category. Positive = they owe;
            negative = we owe them. Saving posts a PAYOUT transaction for each
            change (same pipeline as Orange / opening balances).
          </p>
          <div
            className={`grid gap-6 ${
              isBakiEnabled ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
            }`}>
            {isBakiEnabled && (
              <div className="col-span-1">
                <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Baki
                </h2>
                {draft.baki.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No baki rows for this user.
                  </p>
                ) : (
                  draft.baki.map((row) => renderBalanceField("baki", row))
                )}
              </div>
            )}
            <div className="col-span-1">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Account balance
              </h2>
              {draft.account_balance.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No account balance rows for this user.
                </p>
              ) : (
                draft.account_balance.map((row) =>
                  renderBalanceField("account_balance", row)
                )
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save all"}
          </Button>
          <Button color="danger" onClick={handleClearAll} disabled={isUpdating}>
            Clear all
          </Button>
          <p className="w-full text-sm text-gray-500 dark:text-gray-400">
            Clear all zeroes balances we owe (below zero). Does not change
            balances they owe (above zero).
          </p>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditBalancesModal;
