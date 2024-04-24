
import React from "react";
import { useNoteContext, NoteInsert } from "../../context/NoteContext";
import {
  TextInput,
  Select,
  FileInput,
  Label,
  Button,
} from "flowbite-react";
import { useCategoryContext } from "../../context/CategoryContext";
import { useAuthContext } from "../../context/AuthContext";
import { useAccountBalanceContext } from "../../context/AccountBalanceContext";
import { supabase } from "../../utils/supabaseClient";

type method = "CA" | "BT" | "CH";

const CreateNoteForm: React.FC = function () {
  const [ file, setFile] = React.useState<File | null>(null);
  const { addNote } = useNoteContext();
  const { categories } = useCategoryContext();
  const { user } = useAuthContext();
  const { accountBalances } = useAccountBalanceContext();
  const [note, setNote] = React.useState<NoteInsert>({
    account_balance_id: "1",
    amount: 0,
    category_id: 1,
    media_url: "",
    method: "cash",
    status: "PENDING",
    user_id: user?.id || "",
  });

  const handleCreateNote = async () => {
    // find the account balance id with selected category and user id 
    const accountBalance = accountBalances.find(
      (accountBalance) =>
        accountBalance.category_id === note.category_id &&
        accountBalance.user_id === note.user_id
    );

    if (!accountBalance) {
      alert("Account Balance not found");
      return;
    }

    note.account_balance_id = accountBalance.id;

    // Upload file to supabase storage
    if (file) {
      const { data, error } = await supabase.storage
        .from("media")
        .upload(`media/${file.name}`, file);

      if (error) {
        alert("Error uploading file");
        return;
      }

      note.media_url = data?.path || "";
    }

    addNote({
      ...note,
      media_url: note.media_url,
    });

  }

  return (
    <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800 sm:p-6 xl:p-8">
      <h3 className="mb-4 text-xl font-bold dark:text-white">
        Create a new note
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
        <div>
          <Label>Amount</Label>
          <div className="mt-1">
            <TextInput
              type="number"
              value={note.amount}
              onChange={(e) => setNote({
                ...note,
                amount: parseFloat(e.target.value),
              })}
            />
          </div>
        </div>
        <div>
          <Label>Category</Label>
          <div className="mt-1">
            <Select
              value={note.category_id}
              onChange={(e) => setNote({
                ...note,
                category_id: parseInt(e.target.value),
              })}
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
          <Label>Method</Label>
          <div className="mt-1">
            <Select
              value={note.method}
              onChange={(e) => setNote({
                ...note,
                method: e.target.value as method,
              })}
            >
              <option value="CA">CA</option>
              <option value="BT">BT</option>
              <option value="CH">CH</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>Media</Label>
          <div className="mt-1">
            <div className="flex w-full items-center justify-center">
              <Label
                htmlFor="dropzone-file"
                className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
              >
                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                  <svg
                    className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                </div>
                <FileInput id="dropzone-file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Label>
            </div>
          </div>
        </div>

        <Button color="primary" onClick={handleCreateNote}>
          Create Note
        </Button>
      </div>
    </div>
  );
};

export default CreateNoteForm;