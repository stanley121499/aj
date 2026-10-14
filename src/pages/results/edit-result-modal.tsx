/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Label,
  Modal,
  Select,
  Textarea,
} from "flowbite-react";
import React, { useState } from "react";
import {
  HiOutlinePencilAlt
} from "react-icons/hi";
import { useCategoryContext } from "../../context/CategoryContext";
import { Result, useResultContext } from "../../context/ResultContext";

interface EditResultModalProps {
  result: Result;
}

/**
 * Edit result with an explicit confirm step warning about balance impact.
 */
const EditResultModal: React.FC<EditResultModalProps> = ({ result }) => {
  const [isOpen, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateResult } = useResultContext();
  const { categories } = useCategoryContext();
  const [resultData, setResultData] = useState<Result>(result);

  const handleUpdateResult = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateResult(resultData);
      setShowConfirm(false);
      setOpen(false);
    } catch (error) {
      console.error("Failed to update result:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)} className="">
        <div className="flex items-center gap-x-2">
          <HiOutlinePencilAlt className="text-xs" />
          Edit Result
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Edit result</strong>
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
                  onChange={(e) =>
                    setResultData({
                      ...resultData,
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
              <Label htmlFor="result">Result</Label>
              <div className="mt-1">
                <Textarea
                  id="result"
                  name="result"
                  placeholder="amount username"
                  value={resultData.result}
                  onChange={(e) =>
                    setResultData({ ...resultData, result: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="primary"
            onClick={() => setShowConfirm(true)}
            disabled={isSubmitting}>
            Save all
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showConfirm} onClose={() => setShowConfirm(false)} size="md">
        <Modal.Header>Confirm edit result</Modal.Header>
        <Modal.Body>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Saving will recalculate related transactions. Balances for the listed
            users may go up or down based on each line amount (positive → balance
            up; negative → balance down).
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="primary"
            disabled={isSubmitting}
            onClick={handleUpdateResult}>
            {isSubmitting ? "Saving..." : "Confirm save"}
          </Button>
          <Button color="gray" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditResultModal;
