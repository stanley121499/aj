import classNames from "classnames";
import type { PropsWithChildren } from "react";
import React from "react";
import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";
import { SidebarProvider, useSidebarContext } from "../context/SidebarContext";

interface NavbarSidebarLayoutProps {
  isFooter?: boolean;
}

const NavbarSidebarLayout: React.FC<PropsWithChildren<NavbarSidebarLayoutProps>> =
  function ({ children, isFooter = true }) {
    return (
      <SidebarProvider>
        <Navbar />
        <div className="flex min-h-screen items-start bg-gray-50 pt-16 dark:bg-gray-900">
          <Sidebar />
          <MainContent isFooter={isFooter}>{children}</MainContent>
        </div>
      </SidebarProvider>
    );
  };

const MainContent: React.FC<PropsWithChildren<NavbarSidebarLayoutProps>> = function ({
  children,
  isFooter,
}) {
  const { isOpenOnSmallScreens: isSidebarOpen } = useSidebarContext();

  return (
    <main
      className={classNames(
        "relative w-full min-h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50 dark:bg-gray-900",
        isSidebarOpen ? "lg:ml-16" : "lg:ml-64"
      )}
    >
      {children}
    </main>
  );
};

export default NavbarSidebarLayout;
