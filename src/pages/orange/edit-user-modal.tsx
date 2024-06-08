/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Label, Modal, TextInput } from "flowbite-react";
import React, { useState } from "react";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { useAlertContext } from "../../context/AlertContext";
import { User } from "../../context/UserContext";
import { useCategoryContext } from "../../context/CategoryContext";
import { useTransactionContext } from "../../context/TransactionContext";

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
  const { categories } = useCategoryContext();
  const { addTransaction } = useTransactionContext();

  const handleUpdateBalance = async () => {
    // Find the difference the create Transaction for the difference
    const newUserData = { ...userData };
    const initialUserDatas = { ...initialUserData };
    const newBaki = newUserData.baki;
    const newAccountBalance = newUserData.account_balance;
    const initialBaki = initialUserDatas.baki;
    const initialAccountBalance = initialUserDatas.account_balance;

    // Update balances for all bakis and account balances
    newBaki.forEach((baki) => {
      const initialBakiBalance =
        initialBaki.find((el) => el.id === baki.id)?.balance || 0;
      if (baki.balance !== initialBakiBalance) {
        const difference = baki.balance - initialBakiBalance;
        addTransaction({
          user_id: user.id,
          category_id: baki.category_id,
          amount: difference,
          target: "baki",
          source: "PAYOUT",
          type: difference < 0 ? "debit" : "credit",
          baki_id: baki.id,
        });
      }
    });

    newAccountBalance.forEach((account_balance) => {
      const initialAccountBalanceBalance =
        initialAccountBalance.find((el) => el.id === account_balance.id)
          ?.balance || 0;
      if (account_balance.balance !== initialAccountBalanceBalance) {
        const difference =
          account_balance.balance - initialAccountBalanceBalance;
        addTransaction({
          user_id: user.id,
          category_id: account_balance.category_id,
          amount: difference,
          target: "account_balance",
          source: "PAYOUT",
          type: difference < 0 ? "debit" : "credit",
          account_balance_id: account_balance.id,
        });
      }
    });

    showAlert("User updated successfully", "success");
    setOpen(false);
  };

  const handleClearAll = async () => {
    // Change all balance to 0 then update for those in negative
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
  };

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
          <strong>Update user</strong>
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
                      onChange={(e) => {
                        const newBalance = parseInt(e.target.value, 10);
                        if (!isNaN(newBalance)) {
                          const newUserData = { ...userData };
                          newUserData.baki = newUserData.baki.map((el) =>
                            el.id === baki.id
                              ? { ...baki, balance: newBalance }
                              : el
                          );
                          setUserData(newUserData);
                        }
                      }}
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
                      onChange={(e) => {
                        const newBalance = parseInt(e.target.value, 10);
                        if (!isNaN(newBalance)) {
                          const newUserData = { ...userData };
                          newUserData.account_balance =
                            newUserData.account_balance.map((el) =>
                              el.id === account_balance.id
                                ? { ...account_balance, balance: newBalance }
                                : el
                            );
                          setUserData(newUserData);
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={() => handleUpdateBalance()}>
            Save all
          </Button>

          {/* Clear All button */}
          <Button color="danger" onClick={() => handleClearAll()}>
            Clear all
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UpdateUserBalanceModal;
