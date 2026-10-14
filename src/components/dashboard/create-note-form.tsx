import React from "react";
import { useNoteContext, NoteInsert } from "../../context/NoteContext";
import { TextInput, Select, FileInput, Label, Button } from "flowbite-react";
import { useCategoryContext } from "../../context/CategoryContext";
import { useAuthContext } from "../../context/AuthContext";
import { supabase } from "../../utils/supabaseClient";
import { useAlertContext } from "../../context/AlertContext";
import { useAppSettingsContext } from "../../context/AppSettingsContext";
import { useAccountBalanceContext } from "../../context/AccountBalanceContext";
import { useBakiContext } from "../../context/BakiContext";
import { useUserContext } from "../../context/UserContext";
import {
  NOTE_ENTRY_TIP,
  previewBalanceChange,
} from "../../utils/balanceLanguage";

type method = "CA" | "BT" | "CH";

interface CreateNoteFormProps {
  currentUser?: boolean;
  onNoteCreated?: () => void;
}

/**
 * Note posting: positive amount → credit → balance down; negative → debit → balance up.
 * @param amount - Signed note amount
 * @returns Signed balance delta
 */
function noteAmountToBalanceDelta(amount: number): number {
  if (amount >= 0) {
    return -Math.abs(amount);
  }
  return Math.abs(amount);
}

const CreateNoteForm: React.FC<CreateNoteFormProps> = ({ currentUser, onNoteCreated }) => {
  const [file, setFile] = React.useState<File | null>(null);
  const { addNote } = useNoteContext();
  const { categories } = useCategoryContext();
  const { showAlert } = useAlertContext();
  const { users } = useUserContext();
  const { user } = useAuthContext();
  const { isBakiEnabled } = useAppSettingsContext();
  const { accountBalances } = useAccountBalanceContext();
  const { bakis } = useBakiContext();
  const [loading, setLoading] = React.useState(false);

  // Get the default user ID - either the current user's ID or the first user's ID from the list
  const defaultUserId = currentUser ? user?.id : users[0]?.id;

  const [note, setNote] = React.useState<NoteInsert>({
    amount: 0,
    category_id: 1,
    remarks: "",
    media_url: "",
    method: "CA",
    status: "PENDING",
    user_id: defaultUserId || "",
    target: "account_balance",
  });

  // Update user_id when users array changes
  React.useEffect(() => {
    if (!currentUser && users.length > 0 && !note.user_id) {
      setNote(prev => ({
        ...prev,
        user_id: users[0].id
      }));
    }
  }, [users, currentUser, note.user_id]);

  // Force account_balance target when Baki is disabled.
  React.useEffect(() => {
    if (!isBakiEnabled && note.target === "baki") {
      setNote((prev) => ({
        ...prev,
        target: "account_balance",
      }));
    }
  }, [isBakiEnabled, note.target]);

  /**
   * Looks up the current signed balance for the selected user × category × target.
   * @returns Current balance or null when the row is missing
   */
  const getCurrentBalance = (): number | null => {
    const selectedUserId = note.user_id;
    if (!selectedUserId || !note.category_id) {
      return null;
    }
    if (note.target === "baki") {
      const row = bakis.find(
        (b) =>
          b.user_id === selectedUserId && b.category_id === note.category_id
      );
      return row ? row.balance : null;
    }
    const row = accountBalances.find(
      (ab) =>
        ab.user_id === selectedUserId && ab.category_id === note.category_id
    );
    return row ? row.balance : null;
  };

  const currentBalance = getCurrentBalance();
  const balancePreview =
    currentBalance !== null && note.amount !== 0 && !isNaN(note.amount)
      ? previewBalanceChange(
          currentBalance,
          noteAmountToBalanceDelta(note.amount)
        )
      : null;

  const handleCreateNote = async () => {
    setLoading(true);

    if (note.target === "baki" && !isBakiEnabled) {
      showAlert("Baki is currently disabled", "error");
      setLoading(false);
      return;
    }

    // Upload file to supabase storage
    if (file) {
      // Generate a unique filename
      const filename = `${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from("notes")
        .upload(`${filename}`, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error(error);
        showAlert("Failed to upload file", "error");
        setLoading(false);
        return;
      }

      note.media_url = data?.path || "";
    }

    const submittedUserId = note.user_id;

    addNote({
      ...note,
      media_url: note.media_url,
    });

    // Keep admin-selected user after submit; customers stay on self.
    const nextUserId = currentUser
      ? user?.id || ""
      : submittedUserId || users[0]?.id || "";

    setNote({
      amount: 0,
      category_id: 1,
      remarks: "",
      media_url: "",
      method: "CA",
      status: "PENDING",
      user_id: nextUserId,
      target: "account_balance",
    });
    setFile(null);

    showAlert("Note created successfully", "success");
    setLoading(false);
    
    // Call the onNoteCreated callback if provided
    if (onNoteCreated) {
      onNoteCreated();
    }
  };

  return (
    <div
      data-tour="create-note-form"
      className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800 sm:p-6 xl:p-8">
      {currentUser && (
        <h3 className="mb-4 text-xl font-bold dark:text-white">
          Create a new note
        </h3>
      )}
      <div
        className={`grid gap-4 ${currentUser ? "grid-cols-1" : "grid-cols-2"}`}>
        {!currentUser && (
          <div>
            <Label>User</Label>
            <div className="mt-1">
              <Select
                value={note.user_id}
                onChange={(e) =>
                  setNote({
                    ...note,
                    user_id: e.target.value,
                  })
                }>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email.split("@")[0]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        <div>
          <Label>Amount</Label>
          <div className="mt-1">
            <TextInput
              type="number"
              value={note.amount}
              onChange={(e) =>
                setNote({
                  ...note,
                  amount: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {NOTE_ENTRY_TIP}
          </p>
          {balancePreview && (
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
              After approval, balance will go from {balancePreview}
            </p>
          )}
        </div>

        {/* Remarks */}
        <div>
          <Label>Remarks</Label>
          <div className="mt-1">
            <TextInput
              value={note.remarks || ""}
              onChange={(e) =>
                setNote({
                  ...note,
                  remarks: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div>
          <Label>Category</Label>
          <div className="mt-1">
            <Select
              value={note.category_id}
              onChange={(e) =>
                setNote({
                  ...note,
                  category_id: parseInt(e.target.value),
                })
              }>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label>Method</Label>
          <div className="mt-1">
            <Select
              value={note.method}
              onChange={(e) =>
                setNote({
                  ...note,
                  method: e.target.value as method,
                })
              }>
              <option value="CA">CA</option>
              <option value="BT">BT</option>
              <option value="CH">CH</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>For</Label>
          <div className="mt-1">
            <Select
              value={note.target}
              onChange={(e) =>
                setNote({
                  ...note,
                  target: e.target.value as "account_balance" | "baki",
                })
              }>
              <option value="account_balance">Account Balance</option>
              {isBakiEnabled && <option value="baki">Baki</option>}
            </Select>
          </div>
        </div>
        <div>
          <Label>Media</Label>
          <div className="mt-1">
            {!file && (
              <div className="flex w-full items-center justify-center">
                <Label
                  htmlFor="dropzone-file"
                  className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pb-6 pt-5">
                    <svg
                      className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16">
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      SVG, PNG, JPG or GIF (MAX. 800x400px)
                    </p>
                  </div>
                  <FileInput
                    id="dropzone-file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </Label>
              </div>
            )}
            {file && (
              <div className="flex items-center justify-between">
                <span>{file.name}</span>
                <Button color="danger" onClick={() => setFile(null)}>
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>

        <Button
          color="primary"
          onClick={handleCreateNote}
          disabled={loading}
          data-tour="create-note-submit"
          className={`w-full mt-4 ${currentUser ? "" : "col-span-2"}`}>
          Create Note
        </Button>
      </div>
    </div>
  );
};

export default CreateNoteForm;
