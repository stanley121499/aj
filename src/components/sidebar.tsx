/* eslint-disable jsx-a11y/anchor-is-valid */
import classNames from "classnames";
import { Sidebar, TextInput, Tooltip } from "flowbite-react";
import type { FC } from "react";
import React, { useEffect, useState } from "react";
import {
  HiChartPie,
  HiCog,
  HiInboxIn,
  HiInformationCircle,
  HiSearch,
} from "react-icons/hi";
import { IoLogoWhatsapp } from "react-icons/io";
import { TbBrandCampaignmonitor } from "react-icons/tb";
import { useSidebarContext } from "../context/SidebarContext";
import isSmallScreen from "../helpers/is-small-screen";
import { IoMdContact } from "react-icons/io";
import { HiTemplate } from "react-icons/hi";
import { FaListUl } from "react-icons/fa6";

const ExampleSidebar: FC = function () {
  const { isOpenOnSmallScreens: isSidebarOpenOnSmallScreens } =
    useSidebarContext();

  const [currentPage, setCurrentPage] = useState("");
  const [isWhatsAppOpen, setWhatsAppOpen] = useState(true);

  useEffect(() => {
    const newPage = window.location.pathname;

    setCurrentPage(newPage);
    setWhatsAppOpen(newPage.includes("/whatsapp/"));
  }, [setCurrentPage, setWhatsAppOpen]);

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
                  href="/"
                  icon={HiChartPie}
                  className={
                    "/" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""
                  }
                >
                  Dashboard
                </Sidebar.Item>
                {/* Contacts */}
                <Sidebar.Item
                  href="/contacts"
                  icon={IoMdContact}
                  className={
                    "/contacts" === currentPage
                      ? "bg-gray-100 dark:bg-gray-700"
                      : ""
                  }
                >
                  Contacts
                </Sidebar.Item>
                <Sidebar.Collapse
                  icon={IoLogoWhatsapp}
                  label="Whatsapp"
                  open={isWhatsAppOpen}
                >
                  <Sidebar.Item
                    href="/whatsapp/conversation"
                    icon={HiInboxIn}
                    label="3"
                    className={
                      "/whatsapp/conversation" === currentPage
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }
                  >
                    Conversation
                  </Sidebar.Item>
                  <Sidebar.Item
                    href="/whatsapp/campaigns"
                    icon={TbBrandCampaignmonitor}
                    className={
                      "/whatsapp/campaigns" === currentPage
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }
                  >
                    Campaigns
                  </Sidebar.Item>
                  {/* Template */}
                  <Sidebar.Item
                    href="/whatsapp/templates"
                    icon={HiTemplate}
                    className={
                      "/whatsapp/templates" === currentPage
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }
                  >
                    Templates
                  </Sidebar.Item>
                  {/* Contact List */}
                  <Sidebar.Item
                    href="/whatsapp/contact-list"
                    icon={FaListUl}
                    className={
                      "/whatsapp/contact-list" === currentPage
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }
                  >
                    Contact List
                  </Sidebar.Item>

                </Sidebar.Collapse>
                {/* <Sidebar.Collapse
                  icon={HiUsers}
                  label="Users"
                  open={isUsersOpen}
                >                  
                  <Sidebar.Item
                    href="/users/feed"
                    className={
                      "/users/feed" === currentPage
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }
                  >
                    Feed
                  </Sidebar.Item>
                  <Sidebar.Item
                    href="/users/settings"
                    className={
                      "/users/settings" === currentPage
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }
                  >
                    Settings
                  </Sidebar.Item>
                </Sidebar.Collapse> */}
              </Sidebar.ItemGroup>
              <Sidebar.ItemGroup>
                {/* <Sidebar.Item
                  href="https://github.com/themesberg/flowbite-react/"
                  icon={HiClipboard}
                >
                  Docs
                </Sidebar.Item>
                <Sidebar.Item
                  href="https://flowbite-react.com/"
                  icon={HiCollection}
                >
                  Components
                </Sidebar.Item> */}
                <Sidebar.Item
                  href="https://api.whatsapp.com/send/?phone=60139968817&text&type=phone_number&app_absent=0"
                  target="_blank"
                  icon={HiInformationCircle}
                >
                  Help
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

const BottomMenu: FC = function () {
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
