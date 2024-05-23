/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Avatar,
  DarkThemeToggle,
  Dropdown,
  Navbar,
} from "flowbite-react";
import type { FC } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useSidebarContext } from "../context/SidebarContext";
import isSmallScreen from "../helpers/is-small-screen";
import {
  HiX,
  HiMenuAlt1
} from "react-icons/hi";
const ExampleNavbar: React.FC = function () {
  const { isOpenOnSmallScreens, setOpenOnSmallScreens, isPageWithSidebar } =
    useSidebarContext();

  return (
    <Navbar fluid>
      <div className="w-full p-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isPageWithSidebar && (
              <button
                onClick={() => setOpenOnSmallScreens(!isOpenOnSmallScreens)}
                className="mr-3 cursor-pointer rounded p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white lg:inline"
              >
                <span className="sr-only">Toggle sidebar</span>
                {isOpenOnSmallScreens && isSmallScreen() ? (
                  <HiX className="h-6 w-6" />
                ) : (
                  <HiMenuAlt1 className="h-6 w-6" />
                )}
              </button>
            )}
            <Navbar.Brand href="/">
              <img
                alt=""
                src="../../images/logo.svg"
                className="mr-3 h-6 sm:h-8"
              />
              <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white">
                Fruit Basket
              </span>
            </Navbar.Brand>
          </div>
          <div className="flex items-center lg:gap-3">
            <div className="flex items-center">
              <DarkThemeToggle />
            </div>
            <div className="hidden lg:block">
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>
    </Navbar>
  );
};

const UserDropdown: FC = function () {
  const { signOut, user } = useAuthContext();
  const navigate = useNavigate();
  const username = user.email.split("@")[0];

  return (
    <Dropdown
      arrowIcon={false}
      inline
      label={
        <span>
          <span className="sr-only">User menu</span>
          <Avatar
            alt=""
            img="../images/users/neil-sims.png"
            rounded
            size="sm"
          />
        </span>
      }
    >
      <Dropdown.Header>
        <span className="block truncate text-sm font-medium">
          {username}
        </span>
      </Dropdown.Header>
      <Dropdown.Item
        onClick={() => navigate("/dashboard")}
      >Dashboard</Dropdown.Item>
      <Dropdown.Item
        onClick={() => navigate("/users/settings")}
      >Settings</Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item
        onClick={() => signOut()}
      >Sign out</Dropdown.Item>
    </Dropdown>
  );
};

export default ExampleNavbar;
