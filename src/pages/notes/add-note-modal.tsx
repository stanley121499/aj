/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button, Modal
} from "flowbite-react";
import React, { useState } from "react";
import {
  HiPlus
} from "react-icons/hi";
import CreateNoteForm from "../../components/dashboard/create-note-form";

const AddNoteModal: React.FC = function () {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-x-3">
          <HiPlus className="text-xl" />
          Add Note
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen} size="7xl">
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Add new note</strong>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 overflow-y-auto">
            <CreateNoteForm />
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default AddNoteModal;