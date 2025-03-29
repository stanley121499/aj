/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import NavbarSidebarLayout from "../layouts/navbar-sidebar";
import BalanceCards from "../components/dashboard/balance-cards";
import CreateNoteForm from "../components/dashboard/create-note-form";
import { Button } from "flowbite-react";
import { useNoteContext } from "../context/NoteContext";
import { useAccountBalanceContext } from "../context/AccountBalanceContext";
import { useBakiContext } from "../context/BakiContext";
import { useAlertContext } from "../context/AlertContext";
import { useTransactionContext } from "../context/TransactionContext";
import { useResultContext } from "../context/ResultContext";

const DashboardPage: React.FC = function () {
  const { notes, approveNote } = useNoteContext();
  const { accountBalances, updateAccountBalance } = useAccountBalanceContext();
  const { bakis, updateBaki } = useBakiContext();
  const { showAlert } = useAlertContext();
  const { transactions, deleteTransaction } = useTransactionContext();
  const { results, updateResult } = useResultContext();

  const handleResetCalculations = async () => {
    try {
      console.log("Starting reset calculations...");
      
      // Step 1: Delete all transactions without updating balances
      console.log(`Found ${transactions.length} transactions to delete`);
      for (const transaction of transactions) {
        console.log(`Deleting transaction ${transaction.id}...`);
        await deleteTransaction(transaction, true);  // Skip balance updates during reset
      }
      console.log("All transactions deleted");

      // Step 2: Reset all balances to 0
      console.log(`Found ${accountBalances.length} account balances to reset`);
      for (const accountBalance of accountBalances) {
        if (accountBalance.balance !== 0) {
          console.log(`Resetting account balance ${accountBalance.id} to 0...`);
          await updateAccountBalance({
            ...accountBalance,
            balance: 0,
          });
        }
      }
      console.log("All account balances reset to 0");

      console.log(`Found ${bakis.length} bakis to reset`);
      for (const baki of bakis) {
        if (baki.balance !== 0) {
          console.log(`Resetting baki ${baki.id} to 0...`);
          await updateBaki({
            ...baki,
            balance: 0,
          });
        }
      }
      console.log("All bakis reset to 0");

      // Step 3: Process all approved notes first (they might be older)
      console.log(`Found ${notes.length} notes to process`);
      const approvedNotes = notes.filter(note => note.status === "APPROVED")
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      for (const note of approvedNotes) {
        console.log(`Processing approved note ${note.id} from ${note.created_at}...`);
        await approveNote(note);
      }
      console.log("All approved notes processed");

      // Step 4: Process all results in chronological order
      console.log(`Found ${results.length} results to process`);
      const sortedResults = [...results]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      for (const result of sortedResults) {
        console.log(`Processing result ${result.id} from ${result.created_at}...`);
        await updateResult(result);
      }
      console.log("All results processed");

      console.log("Reset and recalculation completed successfully");
      showAlert("Calculations reset and recalculated successfully", "success");
    } catch (error) {
      console.error("Error in reset and recalculation:", error);
      showAlert("Error in reset and recalculation", "error");
    }
  };

  return (
    <NavbarSidebarLayout>
      <div className="grid grid-cols-1 px-4 pt-6 xl:grid-cols-2 xl:gap-4">
        <div className="col-span-full mb-4 xl:mb-2 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
            Dashboard
          </h1>
          {/* <Button
            color="failure"
            onClick={handleResetCalculations}
            className="bg-red-600 hover:bg-red-700">
            Reset Calculations
          </Button> */}
        </div>
        <div className="col-span-full xl:col-auto">
          <BalanceCards />
        </div>
        <div className="col-span-1">
          <CreateNoteForm currentUser={true} />
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default DashboardPage;
