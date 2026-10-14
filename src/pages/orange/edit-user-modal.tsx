import React from "react";
import EditBalancesModal from "../../components/edit-balances-modal";
import type { User } from "../../context/UserContext";

interface UpdateUserBalanceModalProps {
  user: User;
}

/**
 * Orange list entry point for balance edits.
 * Posts PAYOUT delta transactions via the shared EditBalancesModal.
 * Keeps the "Update" trigger label used on Orange.
 */
const UpdateUserBalanceModal: React.FC<UpdateUserBalanceModalProps> = ({
  user,
}) => {
  return <EditBalancesModal user={user} triggerLabel="Update" />;
};

export default UpdateUserBalanceModal;
