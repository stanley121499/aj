/* eslint-disable jsx-a11y/anchor-is-valid */
import classNames from "classnames";
import { Sidebar, TextInput, Tooltip } from "flowbite-react";
import React, { useEffect, useState } from "react";
import { FaUsers } from "react-icons/fa";
import { FaRegNoteSticky } from "react-icons/fa6";
import { GrTransaction } from "react-icons/gr";
import {
  HiChartPie,
  HiCog,
  HiSearch,
} from "react-icons/hi";
import { IoDocumentTextOutline } from "react-icons/io5";
import { useSidebarContext } from "../context/SidebarContext";
import isSmallScreen from "../helpers/is-small-screen";

const ExampleSidebar: React.FC = function () {
  const { isOpenOnSmallScreens: isSidebarOpenOnSmallScreens } =
    useSidebarContext();

  const [currentPage, setCurrentPage] = useState("");

  useEffect(() => {
    const newPage = window.location.pathname;

    setCurrentPage(newPage);
  }, [setCurrentPage]);

  return (
    <div
      className={classNames("lg:!block", {
        hidden: !isSidebarOpenOnSmallScreens,
      })}
    >
      <Sidebar
        aria-label="Sidebar with multi-level dropdown example"
        collapsed={isSidebarOpenOnSmallScreens && !isSmallScreen()}
      >
        <div className="flex h-full flex-col justify-between py-2">
          <div>
            <form className="pb-3 md:hidden">
              <TextInput
                icon={HiSearch}
                type="search"
                placeholder="Search"
                required
                size={32}
              />
            </form>
            <Sidebar.Items>
              <Sidebar.ItemGroup>
                <Sidebar.Item
                  href="/dashboard"
                  icon={HiChartPie}
                  className={
                    "/dashboard" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                  }
                >
                  Dashboard
                </Sidebar.Item>

                {/* Transactions */}
                <Sidebar.Item
                  href="/transactions"
                  icon={GrTransaction}
                  className={
                    "/transactions" === currentPage
                      ? "bg-gray-100 dark:bg-gray-700"
                      : ""
                  }
                >
                  Transactions
                </Sidebar.Item>

                {/* Note */}
                <Sidebar.Item
                  href="/notes"
                  icon={FaRegNoteSticky}
                  className={
                    "/notes" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                  }
                >
                  Notes
                </Sidebar.Item>

                {/* Result */}
                <Sidebar.Item
                  href="/results"
                  icon={IoDocumentTextOutline}
                  className={
                    "/results" === currentPage
                      ? "bg-gray-100 dark:bg-gray-700"
                      : ""
                  }
                >
                  Results
                </Sidebar.Item>

                {/* Users */}
                <Sidebar.Item
                  href="/users"
                  icon={FaUsers}
                  className={
                    "/users" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                  }
                >
                  Users
                </Sidebar.Item>

              </Sidebar.ItemGroup>
            </Sidebar.Items>
          </div>
          <BottomMenu />
        </div>
      </Sidebar>
    </div>
  );
};

const BottomMenu: React.FC = function () {
  return (
    <div className="flex items-center justify-center gap-x-5">
      {/* <button className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
        <span className="sr-only">Tweaks</span>
        <HiAdjustments className="text-2xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white " />
      </button> */}
      <div>
        <Tooltip content="Settings page">
          <a
            href="/users/settings"
            className="inline-flex cursor-pointer justify-center rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <span className="sr-only">Settings page</span>
            <HiCog className="text-2xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" />
          </a>
        </Tooltip>
      </div>
    </div>
  );
};



export default ExampleSidebar;
