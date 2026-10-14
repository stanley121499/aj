/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Breadcrumb,
  Label,
  Table,
  TextInput,
  Button,
  Badge,
  Modal,
} from "flowbite-react";
import type { FC } from "react";
import React from "react";
import { HiHome } from "react-icons/hi";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { useNoteContext, Note, Notes } from "../../context/NoteContext";
import { FaRegCheckCircle } from "react-icons/fa";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useUserContext } from "../../context/UserContext";
import { useCategoryContext } from "../../context/CategoryContext";
import { useAccountBalanceContext } from "../../context/AccountBalanceContext";
import { useBakiContext } from "../../context/BakiContext";
import ViewMediaModal from "./view-media-modal";
import AddNoteModal from "./add-note-modal";
import {
  formatMoney,
  humanizeTarget,
  previewBalanceChange,
} from "../../utils/balanceLanguage";

/**
 * Note amount → signed balance delta (positive note → balance down).
 * @param amount - Signed note amount
 * @returns Signed balance change
 */
function noteAmountToBalanceDelta(amount: number): number {
  if (amount >= 0) {
    return -Math.abs(amount);
  }
  return Math.abs(amount);
}

const NoteListPage: FC = function () {
  const { notes, loading } = useNoteContext();
  const { users } = useUserContext();
  const [searchValue, setSearchValue] = React.useState("");

  // LoadingPage only while the notes fetch is in flight — empty arrays show empty UI.
  if (loading) {
    return <LoadingPage />;
  }

  const filteredNotes = notes.filter((note) => {
    if (!searchValue) {
      return true;
    }
    const email = users.find((user) => user.id === note.user_id)?.email ?? "";
    return email.includes(searchValue);
  });

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="mb-1 w-full">
          <div className="mb-4">
            <Breadcrumb className="mb-4">
              <Breadcrumb.Item href="/dashboard">
                <div className="flex items-center gap-x-3">
                  <HiHome className="text-xl" />
                  <span className="dark:text-white">Home</span>
                </div>
              </Breadcrumb.Item>
              <Breadcrumb.Item>All Notes</Breadcrumb.Item>
            </Breadcrumb>
            <h1
              data-tour="notes-page"
              className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              All Notes
            </h1>
          </div>
          <div className="sm:flex">
            <div className="mb-3 flex items-center dark:divide-gray-700 sm:mb-0 sm:divide-x sm:divide-gray-100">
              <form className="w-full lg:pr-3">
                <Label htmlFor="notes-search" className="sr-only">
                  Search
                </Label>
                <div className="relative mt-1 w-full lg:w-64 xl:w-96">
                  <TextInput
                    id="notes-search"
                    name="notes-search"
                    placeholder="Search for Notes"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
              </form>
            </div>
            <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
              <AddNoteModal />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              {filteredNotes.length > 0 ? (
                <NotesTable notes={filteredNotes} />
              ) : (
                <div className="p-8 text-center text-gray-600 dark:text-gray-300">
                  <p className="mb-2 text-lg font-medium">
                    {notes.length === 0 ? "No notes yet" : "No matching notes"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {notes.length === 0
                      ? "Create a note or wait for customers to submit payment proofs."
                      : "Try a different search."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

const NotesTable: React.FC<Notes> = function ({ notes }) {
  const { users } = useUserContext();
  const { categories } = useCategoryContext();
  const { approveNote, rejectNote } = useNoteContext();
  const { accountBalances } = useAccountBalanceContext();
  const { bakis } = useBakiContext();
  const [confirmNote, setConfirmNote] = React.useState<Note | null>(null);
  const [isApproving, setIsApproving] = React.useState(false);

  /**
   * Builds A → B preview for approving a pending note.
   * @param note - Note pending approval
   * @returns Preview string or null when balance row missing
   */
  const getApprovePreview = (note: Note): string | null => {
    const current =
      note.target === "baki"
        ? bakis.find(
            (b) =>
              b.user_id === note.user_id && b.category_id === note.category_id
          )?.balance
        : accountBalances.find(
            (ab) =>
              ab.user_id === note.user_id &&
              ab.category_id === note.category_id
          )?.balance;

    if (typeof current !== "number") {
      return null;
    }

    return previewBalanceChange(
      current,
      noteAmountToBalanceDelta(note.amount)
    );
  };

  const handleConfirmApprove = async () => {
    if (!confirmNote || isApproving) {
      return;
    }
    setIsApproving(true);
    try {
      await approveNote(confirmNote);
      setConfirmNote(null);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <>
      <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
        <Table.Head className="bg-gray-100 dark:bg-gray-700">
          <Table.HeadCell>Customer</Table.HeadCell>
          <Table.HeadCell>Method</Table.HeadCell>
          <Table.HeadCell>Amount</Table.HeadCell>
          <Table.HeadCell>Target</Table.HeadCell>
          <Table.HeadCell>Category</Table.HeadCell>
          <Table.HeadCell>Status</Table.HeadCell>
          <Table.HeadCell>Remarks</Table.HeadCell>
          <Table.HeadCell>Media</Table.HeadCell>
          <Table.HeadCell>Actions</Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
          {notes.map((note) => (
            <Table.Row
              key={note.id}
              className="hover:bg-gray-100 dark:hover:bg-gray-700">
              <Table.Cell>
                {
                  users
                    .find((user) => user.id === note.user_id)
                    ?.email.split("@")[0]
                }
              </Table.Cell>
              <Table.Cell>{note.method}</Table.Cell>
              <Table.Cell>{formatMoney(note.amount)}</Table.Cell>
              <Table.Cell>
                {note.target === "account_balance" || note.target === "baki"
                  ? humanizeTarget(note.target)
                  : note.target}
              </Table.Cell>
              <Table.Cell>
                {
                  categories.find((category) => category.id === note.category_id)
                    ?.name
                }
              </Table.Cell>
              <Table.Cell>
                {note.status === "APPROVED" ? (
                  <Badge color="green" className="w-fit">
                    Approved
                  </Badge>
                ) : note.status === "PENDING" ? (
                  <Badge color="yellow" className="w-fit">
                    Pending
                  </Badge>
                ) : (
                  <Badge color="red" className="w-fit">
                    Rejected
                  </Badge>
                )}
              </Table.Cell>
              <Table.Cell>{note.remarks}</Table.Cell>
              <Table.Cell>
                {note.media_url && <ViewMediaModal mediaURL={note.media_url} />}
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-x-3 whitespace-nowrap">
                  {note.status === "PENDING" && (
                    <>
                      <Button
                        color="success"
                        onClick={() => setConfirmNote(note)}
                        className="flex items-center gap-x-2">
                        <div className="flex items-center gap-x-3">
                          <FaRegCheckCircle className="text-sm" />
                          Approve
                        </div>
                      </Button>
                      <Button
                        color="failure"
                        onClick={() => rejectNote(note)}
                        className="flex items-center gap-x-2">
                        <div className="flex items-center gap-x-3">
                          <IoIosCloseCircleOutline className="text-sm" />
                          Reject
                        </div>
                      </Button>
                    </>
                  )}
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <Modal
        show={confirmNote !== null}
        onClose={() => setConfirmNote(null)}
        size="md">
        <Modal.Header>Confirm approve note</Modal.Header>
        <Modal.Body>
          {confirmNote && (
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>
                Approving will move the{" "}
                {confirmNote.target === "account_balance" ||
                confirmNote.target === "baki"
                  ? humanizeTarget(confirmNote.target)
                  : "balance"}{" "}
                by {formatMoney(confirmNote.amount)} (
                {confirmNote.amount >= 0
                  ? "balance will go down"
                  : "balance will go up"}
                ).
              </p>
              {getApprovePreview(confirmNote) && (
                <p className="font-medium text-gray-900 dark:text-white">
                  Balance will go from {getApprovePreview(confirmNote)}
                </p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="success"
            disabled={isApproving}
            onClick={handleConfirmApprove}>
            {isApproving ? "Approving..." : "Confirm approve"}
          </Button>
          <Button color="gray" onClick={() => setConfirmNote(null)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NoteListPage;
