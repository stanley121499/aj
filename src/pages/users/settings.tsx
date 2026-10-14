import {
  Card,
  Label,
  ToggleSwitch,
} from "flowbite-react";
import React, { useState } from "react";
import type { FC } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import { useAppSettingsContext } from "../../context/AppSettingsContext";
import { useAuthContext } from "../../context/AuthContext";
import OpeningBalancesCard from "./opening-balances";

/**
 * Settings page — admin controls only (Baki + opening balances).
 * Flowbite demo chrome removed so real controls are primary.
 */
const UserSettingsPage: FC = function () {
  const { user_detail } = useAuthContext();
  const isAdmin = user_detail?.role === "admin";

  return (
    <NavbarSidebarLayout>
      <div className="grid grid-cols-1 gap-y-6 px-4 pt-6 dark:bg-gray-900">
        <div className="col-span-full">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Admin controls for balances and features. Above zero = they owe; below
            zero = we owe them; zero = settled.
          </p>
        </div>

        {isAdmin ? (
          <>
            <div className="col-span-full">
              <AdminAppSettingsCard />
            </div>
            <div className="col-span-full">
              <OpeningBalancesCard />
            </div>
          </>
        ) : (
          <Card>
            <p className="text-gray-700 dark:text-gray-300">
              Settings are available to admins only. Ask an admin to change Baki or
              set opening balances.
            </p>
          </Card>
        )}
      </div>
    </NavbarSidebarLayout>
  );
};

/**
 * Admin-only controls for whole-app feature flags (Baki kill-switch).
 */
const AdminAppSettingsCard: FC = function () {
  const { isBakiEnabled, loading, setBakiEnabled } = useAppSettingsContext();
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Persists the Baki toggle for every client via app_settings.
   */
  const handleBakiToggle = async (checked: boolean) => {
    if (isSaving || loading) {
      return;
    }

    setIsSaving(true);
    try {
      await setBakiEnabled(checked);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card data-tour="settings-baki">
      <div className="flow-root">
        <h3 className="text-xl font-bold dark:text-white">App settings</h3>
        <p className="mb-4 text-sm font-normal text-gray-500 dark:text-gray-400">
          Whole-app controls. Changes apply to every user immediately.
        </p>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <div className="flex items-center justify-between py-4">
            <div className="flex grow flex-col">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Enable Baki
              </div>
              <div className="text-base font-normal text-gray-500 dark:text-gray-400">
                When off, Baki UI and Baki-targeted notes, transactions, and results
                are blocked for everyone. Account balance continues to work.
              </div>
            </div>
            <Label htmlFor="baki-enabled" className="sr-only">
              Toggle Baki feature
            </Label>
            <ToggleSwitch
              checked={isBakiEnabled}
              disabled={loading || isSaving}
              id="baki-enabled"
              label=""
              name="baki-enabled"
              onChange={handleBakiToggle}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UserSettingsPage;
