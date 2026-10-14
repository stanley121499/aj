/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button, Modal
} from "flowbite-react";
import React, { useState } from "react";
import {
  HiTrash
} from "react-icons/hi";
import { useAlertContext } from "../../context/AlertContext";
import { Result, useResultContext } from "../../context/ResultContext";

interface DeleteResultModalProps {
  result: Result;
}

/**
 * Delete result with balance-impact warning (transactions reverse on delete).
 */
const DeleteResultModal: React.FC<DeleteResultModalProps> = ({ result }) => {
  const [isOpen, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteResult } = useResultContext();
  const { showAlert } = useAlertContext();

  const handleDeleteResult = async () => {
    if (isDeleting) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteResult(result);
      setOpen(false);
      showAlert("Result deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete result:", error);
      showAlert("Failed to delete result", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button color="failure" onClick={() => setOpen(true)} className="">
        <div className="flex items-center gap-x-2">
          <HiTrash className="text-sm" />
          Delete Result
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <Modal.Header>Confirm delete result</Modal.Header>
        <Modal.Body>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Deleting this result removes its ledger rows and reverses their
            balance effects (balances may go up or down depending on the original
            lines). This cannot be undone from here.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="failure"
            disabled={isDeleting}
            onClick={handleDeleteResult}>
            {isDeleting ? "Deleting..." : "Yes, delete"}
          </Button>
          <Button color="gray" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DeleteResultModal;
