/* eslint-disable jsx-a11y/anchor-is-valid */
import type { FC } from "react";
import NavbarSidebarLayout from "../layouts/navbar-sidebar";
import React from "react";

const DashboardPage: FC = function () {
  return (
    <NavbarSidebarLayout>
      <div className="px-4 pt-6">
        {/* <SalesThisWeek /> */}
        <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* <NewProductsThisWeek /> */}
          {/* <VisitorsThisWeek /> */}
          {/* <UserSignupsThisWeek /> */}
        </div>
        <div className="my-4 grid grid-cols-1 xl:gap-4 2xl:grid-cols-3">
          {/* <SessionsByCountry /> */}
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
            {/* <LatestCustomers /> */}
            {/* <AcquisitionOverview /> */}
          </div>
        </div>
        {/* <Transactions /> */}
      </div>
    </NavbarSidebarLayout>
  );
};

export default DashboardPage;
