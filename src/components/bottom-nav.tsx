import React from "react";
import { GrTransaction } from "react-icons/gr";
import { HiChartPie, HiQuestionMarkCircle } from "react-icons/hi";

/**
 * Optional mobile bottom nav. Only links to routes that exist.
 * Dead destinations (/new, /settings, /profile) removed.
 * Currently unused on the landing page; safe if re-enabled.
 */
const BottomNav: React.FC = () => {
  /**
   * Navigates to an in-app path.
   * @param destination - Absolute app path
   */
  const handleButtonClick = (destination: string) => {
    window.location.href = destination;
  };

  return (
    <div
      className="fixed z-50 h-16 max-wLg -translate-x-1/2 bg-white border border-gray-200 rounded-full bottom-4 left-1/2 dark:bg-gray-700 dark:border-gray-600"
      style={{ width: "max-content" }}>
      <div className="grid h-full max-wLg grid-cols-3 mx-auto">
        <button
          type="button"
          className="inline-flex flex-col items-center justify-center px-5 rounded-s-full hover:bg-gray-50 dark:hover:bg-gray-800 group"
          onClick={() => handleButtonClick("/dashboard")}>
          <HiChartPie className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" />
          <span className="sr-only">Dashboard</span>
        </button>
        <button
          type="button"
          className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
          onClick={() => handleButtonClick("/transactions")}>
          <GrTransaction className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" />
          <span className="sr-only">Transactions</span>
        </button>
        <button
          type="button"
          className="inline-flex flex-col items-center justify-center px-5 rounded-e-full hover:bg-gray-50 dark:hover:bg-gray-800 group"
          onClick={() => handleButtonClick("/onboarding")}>
          <HiQuestionMarkCircle className="w-5 h-5 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" />
          <span className="sr-only">Help</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
