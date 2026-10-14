/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Label,
  Modal,
  Select,
  Textarea,
} from "flowbite-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  HiPlus
} from "react-icons/hi";
import { useAlertContext } from "../../context/AlertContext";
import { useAppSettingsContext } from "../../context/AppSettingsContext";
import { useAuthContext } from "../../context/AuthContext";
import { useCategoryContext } from "../../context/CategoryContext";
import { ResultInsert, useResultContext } from "../../context/ResultContext";
import {
  NOTE_VS_RESULT_CONTRAST,
  RESULT_ENTRY_TIP,
  arrowEffectLabel,
  formatMoney,
} from "../../utils/balanceLanguage";
import { parseResultLine, ParsedResultLine } from "../../utils/resultParser";
import type { TransactionType } from "../../types/transaction";

interface PreviewRow {
  line: string;
  parsed: ParsedResultLine | null;
  error: string | null;
}

/**
 * Soft-parses result text for preview without throwing on the whole block.
 * @param resultText - Raw multiline result input
 * @returns Per-line preview rows
 */
function buildResultPreview(resultText: string): PreviewRow[] {
  const lines = resultText.split("\n");
  const rows: PreviewRow[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    try {
      const parsed = parseResultLine(trimmed);
      rows.push({ line: trimmed, parsed, error: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid line";
      rows.push({ line: trimmed, parsed: null, error: message });
    }
  }

  return rows;
}

/**
 * Maps a result line amount to transaction type for arrow display.
 * Positive → debit (balance up); negative → credit (balance down).
 * @param amount - Signed result amount
 * @returns debit or credit
 */
function resultAmountToType(amount: number): TransactionType {
  return amount > 0 ? "debit" : "credit";
}

const AddResultModal: React.FC = function () {
  const [isOpen, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addResult } = useResultContext();
  const { user } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { categories } = useCategoryContext();
  const { isBakiEnabled } = useAppSettingsContext();
  const [resultData, setResultData] = useState<ResultInsert>({
    category_id: 1,
    result: "",
    status: "PENDING",
    target: "account_balance",
    user_id: user?.id ?? "",
  });

  useEffect(() => {
    if (!isBakiEnabled && resultData.target === "baki") {
      setResultData((prev) => ({
        ...prev,
        target: "account_balance",
      }));
    }
  }, [isBakiEnabled, resultData.target]);

  const previewRows = useMemo(
    () => buildResultPreview(resultData.result),
    [resultData.result]
  );

  const handleAddResult = async () => {
    if (isSubmitting) return;

    if (resultData.target === "baki" && !isBakiEnabled) {
      showAlert("Baki is currently disabled", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await addResult(resultData);
      setOpen(false);
      setResultData({
        category_id: 0,
        result: "",
        status: "PENDING",
        target: "account_balance",
        user_id: user?.id ?? "",
      });
    } catch (error: unknown) {
      console.error("Failed to add result:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-x-3">
          <HiPlus className="text-xl" />
          Add Result
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen} size="3xl">
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Add new result</strong>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
            <div>
              <Label htmlFor="category">Category</Label>
              <div className="mt-1">
                <Select
                  id="category"
                  name="category"
                  value={resultData.category_id}
                  onChange={(e) => setResultData({ ...resultData, category_id: parseInt(e.target.value) })}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="target">Target</Label>
              <div className="mt-1">
                <Select
                  value={resultData.target}
                  onChange={(e) => setResultData({
                    ...resultData,
                    target: e.target.value as "account_balance" | "baki",
                  })}
                >
                  <option value="account_balance">Account Balance</option>
                  {isBakiEnabled && <option value="baki">Baki</option>}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="result">Result</Label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Format: <span className="font-mono">amount username</span> (one per line)
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {RESULT_ENTRY_TIP}
              </p>
              <p className="mt-1 rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                Opposite of notes: {NOTE_VS_RESULT_CONTRAST}
              </p>
              <div className="mt-2">
                <Textarea
                  id="result"
                  name="result"
                  placeholder={"100 alice\n-50 bob"}
                  rows={6}
                  value={resultData.result}
                  onChange={(e) => setResultData({ ...resultData, result: e.target.value })}
                />
              </div>
            </div>

            {previewRows.length > 0 && (
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Parse preview ({previewRows.length} row
                  {previewRows.length === 1 ? "" : "s"})
                </p>
                <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                  {previewRows.map((row) => (
                    <li
                      key={row.line}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 py-1 last:border-0 dark:border-gray-800">
                      {row.parsed ? (
                        <>
                          <span className="text-gray-800 dark:text-gray-200">
                            {row.parsed.username}: {formatMoney(row.parsed.amount)}
                          </span>
                          <span
                            className={
                              row.parsed.amount > 0
                                ? "font-semibold text-green-600 dark:text-green-400"
                                : "font-semibold text-red-600 dark:text-red-400"
                            }>
                            {arrowEffectLabel(
                              resultAmountToType(row.parsed.amount),
                              Math.abs(row.parsed.amount)
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">
                          {row.error}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            color="primary" 
            onClick={handleAddResult}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add result"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddResultModal;
