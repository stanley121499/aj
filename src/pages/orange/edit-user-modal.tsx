/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Label, Modal, TextInput } from "flowbite-react";
import React, { useState, useCallback } from "react";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { useAlertContext } from "../../context/AlertContext";
import { User } from "../../context/UserContext";
import { useCategoryContext } from "../../context/CategoryContext";
import { useTransactionContext } from "../../context/TransactionContext";
import { supabase } from "../../utils/supabaseClient";

// Defining props type
interface UpdateUserBalanceModalProps {
  user: User;
}

const UpdateUserBalanceModal: React.FC<UpdateUserBalanceModalProps> = ({
  user,
}) => {
  const [isOpen, setOpen] = useState(false);
  const { showAlert } = useAlertContext();
  const [userData, setUserData] = useState<User>(user);
  const [initialUserData] = useState<User>(user);
  const [isUpdating, setIsUpdating] = useState(false);
  const { categories } = useCategoryContext();
  const { addTransaction } = useTransactionContext();

  const handleUpdateBalance = useCallback(async () => {
    try {
      setIsUpdating(true);
      const newUserData = { ...userData };
      const initialUserDatas = { ...initialUserData };
      const newBaki = newUserData.baki;
      const newAccountBalance = newUserData.account_balance;
      const initialBaki = initialUserDatas.baki;
      const initialAccountBalance = initialUserDatas.account_balance;

      // Process bakis
      for (const baki of newBaki) {
        const initialBakiBalance = initialBaki.find((el) => el.id === baki.id)?.balance || 0;
        if (baki.balance !== initialBakiBalance) {
          // For PAYOUT: If initial balance is negative (boss owes), we need to add positive amount
          // If initial balance is positive (user owes), we need to subtract
          const difference = baki.balance - initialBakiBalance;
          
          // Fetch fresh baki data before creating transaction
          const { data: freshBaki, error: bakiError } = await supabase
            .from("bakis")
            .select("*")
            .eq("id", baki.id)
            .single();

          if (bakiError) {
            throw new Error(`Failed to fetch fresh baki data: ${bakiError.message}`);
          }

          if (freshBaki) {
            await addTransaction({
              user_id: user.id,
              category_id: baki.category_id,
              amount: Math.abs(difference),
              target: "baki",
              source: "PAYOUT",
              type: "debit",
              baki_id: baki.id,
            });
          }
        }
      }

      // Process account balances
      for (const accountBalance of newAccountBalance) {
        const initialAccountBalanceBalance = initialAccountBalance.find(
          (el) => el.id === accountBalance.id
        )?.balance || 0;
        
        if (accountBalance.balance !== initialAccountBalanceBalance) {
          const difference = accountBalance.balance - initialAccountBalanceBalance;
          
          // Fetch fresh account balance data before creating transaction
          const { data: freshBalance, error: balanceError } = await supabase
            .from("account_balances")
            .select("*")
            .eq("id", accountBalance.id)
            .single();

          if (balanceError) {
            throw new Error(`Failed to fetch fresh account balance data: ${balanceError.message}`);
          }

          if (freshBalance) {
            await addTransaction({
              user_id: user.id,
              category_id: accountBalance.category_id,
              amount: Math.abs(difference),
              target: "account_balance",
              source: "PAYOUT",
              type: "debit",
              account_balance_id: accountBalance.id,
            });
          }
        }
      }

      showAlert("User balances updated successfully", "success");
      setOpen(false);
    } catch (error) {
      console.error("Error updating balances:", error);
      showAlert(error instanceof Error ? error.message : "Error updating balances", "error");
    } finally {
      setIsUpdating(false);
    }
  }, [user.id, userData, initialUserData, addTransaction, showAlert]);

  const handleClearAll = useCallback(() => {
    const newUserData = { ...userData };
    newUserData.baki = newUserData.baki.map((baki) =>
      baki.balance < 0 ? { ...baki, balance: 0 } : baki
    );
    newUserData.account_balance = newUserData.account_balance.map(
      (account_balance) =>
        account_balance.balance < 0
          ? { ...account_balance, balance: 0 }
          : account_balance
    );

    setUserData(newUserData);
  }, [userData]);

  const handleBalanceChange = useCallback((type: "baki" | "account_balance", id: string, newBalance: number) => {
    if (!isNaN(newBalance)) {
      setUserData(prev => ({
        ...prev,
        [type]: prev[type].map((el) =>
          el.id === id
            ? { ...el, balance: newBalance }
            : el
        )
      }));
    }
  }, []);

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)} className="">
        <div className="flex items-center gap-x-2">
          <HiOutlinePencilAlt className="text-xs" />
          Update
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen} size="7xl">
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Update user balances</strong>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-2">
            <div className="col-span-1">
              {/* Baki */}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Baki
              </h2>
              {userData.baki.map((baki) => (
                <div key={baki.id} className="flex items-center gap-x-3 mb-2">
                  <Label
                    htmlFor={baki.id.toString()}
                    className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {
                      categories.find(
                        (category) => category.id === baki.category_id
                      )?.name
                    }
                  </Label>
                  <div className="flex-1">
                    <TextInput
                      id={baki.id.toString()}
                      name={baki.id.toString()}
                      type="number"
                      placeholder="Baki"
                      value={baki.balance}
                      onChange={(e) => handleBalanceChange("baki", baki.id, parseInt(e.target.value, 10))}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="col-span-1">
              {/* Account Balance */}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Account Balance
              </h2>
              {userData.account_balance.map((account_balance) => (
                <div
                  key={account_balance.id}
                  className="flex items-center gap-x-3 mb-2">
                  <Label
                    htmlFor={account_balance.id.toString()}
                    className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {
                      categories.find(
                        (category) =>
                          category.id === account_balance.category_id
                      )?.name
                    }
                  </Label>
                  <div className="flex-1">
                    <TextInput
                      id={account_balance.id.toString()}
                      name={account_balance.id.toString()}
                      type="number"
                      placeholder="Account Balance"
                      value={account_balance.balance}
                      onChange={(e) => handleBalanceChange("account_balance", account_balance.id, parseInt(e.target.value, 10))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            color="primary" 
            onClick={handleUpdateBalance}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Save all"}
          </Button>

          <Button 
            color="danger" 
            onClick={handleClearAll}
            disabled={isUpdating}
          >
            Clear all
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UpdateUserBalanceModal;
