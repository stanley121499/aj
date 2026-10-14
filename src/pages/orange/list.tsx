/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Breadcrumb,
  Label,
  Table,
  TextInput,
} from "flowbite-react";
import type { FC } from "react";
import React from "react";
import {
  HiHome,
} from "react-icons/hi";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { useAppSettingsContext } from "../../context/AppSettingsContext";
import { useUserContext, User } from "../../context/UserContext";
import UpdateUserBalanceModal from "./edit-user-modal";

const OrangeListPage: FC = function () {
  const { users, loading } = useUserContext();
  const { isBakiEnabled } = useAppSettingsContext();

  const [searchValue, setSearchValue] = React.useState("");

  if (loading) {
    return <LoadingPage />;
  }

  const filteredUsers = users
    .filter((user) => {
      const hasNegativeAccountBalance =
        user.account_balance.reduce(
          (acc, account_balance) => acc + account_balance.balance,
          0
        ) < 0;
      if (!isBakiEnabled) {
        return hasNegativeAccountBalance;
      }
      const hasNegativeBaki =
        user.baki.reduce((acc, baki) => acc + baki.balance, 0) < 0;
      return hasNegativeBaki || hasNegativeAccountBalance;
    })
    .filter((user) =>
      user.email.toLowerCase().includes(searchValue.toLowerCase())
    );

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="mb-1 w-full">
          <div className="mb-4">
            <Breadcrumb className="mb-4">
              <Breadcrumb.Item href="/dashboard">
                <div className="flex items-center gap-x-3">
                  <HiHome className="text-xl" />
                  <span className="dark:text-white">Home</span>
                </div>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Orange</Breadcrumb.Item>
            </Breadcrumb>
            <h1
              data-tour="orange-page"
              className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Orange
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Users with below-zero balances. Adjustments use signed math (increase → balance up, decrease → balance down).
            </p>
          </div>
          <div className="sm:flex">
            <div className="mb-3 flex items-center dark:divide-gray-700 sm:mb-0 sm:divide-x sm:divide-gray-100">
              <form className="w-full lg:pr-3">
                <Label htmlFor="users-search" className="sr-only">
                  Search
                </Label>
                <div className="relative mt-1 w-full lg:w-64 xl:w-96">
                  <TextInput
                    id="users-search"
                    name="users-search"
                    placeholder="Search for Users"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
              </form>
            </div>
            <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              {filteredUsers.length > 0 ? (
                <UsersTable users={filteredUsers} isBakiEnabled={isBakiEnabled} />
              ) : (
                <div className="p-4 text-center">No users found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

interface UsersTableProps {
  users: User[];
  isBakiEnabled: boolean;
}

const UsersTable: React.FC<UsersTableProps> = function ({ users, isBakiEnabled }) {
  return (
    <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
      <Table.Head className="bg-gray-100 dark:bg-gray-700">
        <Table.HeadCell>Username</Table.HeadCell>
        <Table.HeadCell>Phone Number</Table.HeadCell>
        {isBakiEnabled && <Table.HeadCell>Baki Total</Table.HeadCell>}
        <Table.HeadCell>Account Balance Total</Table.HeadCell>
        <Table.HeadCell>Actions</Table.HeadCell>
      </Table.Head>
      <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
        {users.map((user) => (
          <Table.Row key={user.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <Table.Cell>{user.email.split("@")[0]}</Table.Cell>
            <Table.Cell>{user.user_detail.contact_number}</Table.Cell>
            {isBakiEnabled && (
              <Table.Cell>
                {user.baki.reduce((acc, baki) => acc + baki.balance, 0)}
              </Table.Cell>
            )}
            <Table.Cell>
              {user.account_balance.reduce(
                (acc, account_balance) => acc + account_balance.balance,
                0
              )}
            </Table.Cell>
            <Table.Cell>
              <div className="flex items-center gap-x-3 whitespace-nowrap">
                <UpdateUserBalanceModal user={user} />
              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};


export default OrangeListPage;
