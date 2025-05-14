/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Breadcrumb,
  Label,
  Table,
  TextInput,
  // Button
} from "flowbite-react";
import type { FC } from "react";
import React from "react";
import {
  HiHome,
  HiChevronUp,
  HiChevronDown,
  // HiTrash
} from "react-icons/hi";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import AddUserModal from "./add-user-modal";
import EditUserModal from "./edit-user-modal";
import LoadingPage from "../pages/loading";
import { useUserContext, Users } from "../../context/UserContext";

type SortDirection = "asc" | "desc" | null;
type SortColumn = "username" | "accountBalance" | null;

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

const UserListPage: FC = function () {
  const { users, loading } = useUserContext();
  const [searchValue, setSearchValue] = React.useState("");
  const [sortState, setSortState] = React.useState<SortState>({
    column: null,
    direction: null,
  });

  if (loading || !users || users.length === 0) {
    return <LoadingPage />;
  }

  const handleSort = (column: SortColumn) => {
    setSortState((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortedUsers = (usersToSort: Users["users"]) => {
    if (!sortState.column || !sortState.direction) return usersToSort;

    return [...usersToSort].sort((a, b) => {
      if (sortState.column === "username") {
        const usernameA = a.email.split("@")[0].toLowerCase();
        const usernameB = b.email.split("@")[0].toLowerCase();
        return sortState.direction === "asc"
          ? usernameA.localeCompare(usernameB)
          : usernameB.localeCompare(usernameA);
      }

      if (sortState.column === "accountBalance") {
        const balanceA = a.account_balance.reduce((acc, ab) => acc + ab.balance, 0);
        const balanceB = b.account_balance.reduce((acc, ab) => acc + ab.balance, 0);
        return sortState.direction === "asc" ? balanceA - balanceB : balanceB - balanceA;
      }

      return 0;
    });
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchValue.toLowerCase())
  );
  const sortedUsers = getSortedUsers(filteredUsers);

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
              <Breadcrumb.Item>All User</Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              All Users
            </h1>
          </div>
          <div className="sm:flex">
            <div className="mb-3 hidden items-center dark:divide-gray-700 sm:mb-0 sm:flex sm:divide-x sm:divide-gray-100">
              <form className="lg:pr-3">
                <Label htmlFor="users-search" className="sr-only">
                  Search
                </Label>
                <div className="relative mt-1 lg:w-64 xl:w-96">
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
              <AddUserModal />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow">
              {sortedUsers.length > 0 ? (
                <UsersTable 
                  users={sortedUsers} 
                  sortState={sortState}
                  onSort={handleSort}
                />
              ) : (
                <div className="p-4 text-center">No users found</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* <Pagination /> */}
    </NavbarSidebarLayout>
  );
};

interface UsersTableProps extends Users {
  sortState: SortState;
  onSort: (column: SortColumn) => void;
}

const UsersTable: React.FC<UsersTableProps> = function ({ users, sortState, onSort }) {
  const renderSortIcon = (column: SortColumn) => {
    if (sortState.column !== column) return null;
    return sortState.direction === "asc" ? (
      <HiChevronUp className="ml-1 inline h-4 w-4" />
    ) : (
      <HiChevronDown className="ml-1 inline h-4 w-4" />
    );
  };

  return (
    <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
      <Table.Head className="bg-gray-100 dark:bg-gray-700">
        <Table.HeadCell 
          className="cursor-pointer"
          onClick={() => onSort("username")}
        >
          Username {renderSortIcon("username")}
        </Table.HeadCell>
        <Table.HeadCell>Birthday</Table.HeadCell>
        <Table.HeadCell>Phone Number</Table.HeadCell>
        <Table.HeadCell>Role</Table.HeadCell>
        <Table.HeadCell>Baki Total</Table.HeadCell>
        <Table.HeadCell 
          className="cursor-pointer"
          onClick={() => onSort("accountBalance")}
        >
          Account Balance Total {renderSortIcon("accountBalance")}
        </Table.HeadCell>
        <Table.HeadCell>Actions</Table.HeadCell>
      </Table.Head>
      <Table.Body className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
        {users.map((user) => (
          <Table.Row key={user.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <Table.Cell>{user.email.split("@")[0]}</Table.Cell>
            <Table.Cell>{user.user_detail.birthday ?? ""}</Table.Cell>
            <Table.Cell>{user.user_detail.contact_number ?? ""}</Table.Cell>
            <Table.Cell>{user.user_detail.role ?? ""}</Table.Cell>
            <Table.Cell>{user.baki.reduce((acc, baki) => acc + baki.balance, 0)}</Table.Cell>
            <Table.Cell>{user.account_balance.reduce((acc, account_balance) => acc + account_balance.balance, 0)}</Table.Cell>
            <Table.Cell>
              <div className="flex items-center gap-x-3 whitespace-nowrap">
                <EditUserModal user={user} />
                {/* <Button
                  className="text-red-600 dark:text-red-400"
                  onClick={() => deleteUser(user)}
                >
                  <HiTrash />
                </Button> */}

              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};


export default UserListPage;
