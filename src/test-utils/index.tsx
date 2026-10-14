import React, { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";
import { ResultProvider } from "../context/ResultContext";
import { TransactionProvider } from "../context/TransactionContext";
import { UserProvider } from "../context/UserContext";
import { AppSettingsProvider } from "../context/AppSettingsContext";
import { AuthProvider } from "../context/AuthContext";
import { BakiProvider } from "../context/BakiContext";
import { AccountBalanceProvider } from "../context/AccountBalanceContext";
import { AlertProvider } from "../context/AlertContext";
import { TourProvider } from "../context/TourContext";

/**
 * Shared provider tree for unit/integration tests.
 * Mirrors App.tsx ordering so Baki kill-switch context is available.
 */
export function AllProviders({ children }: PropsWithChildren) {
  return (
    <BrowserRouter>
      <TourProvider>
        <AlertProvider>
          <AuthProvider>
            <AppSettingsProvider>
              <UserProvider>
                <BakiProvider>
                  <AccountBalanceProvider>
                    <TransactionProvider>
                      <ResultProvider>
                        {children}
                      </ResultProvider>
                    </TransactionProvider>
                  </AccountBalanceProvider>
                </BakiProvider>
              </UserProvider>
            </AppSettingsProvider>
          </AuthProvider>
        </AlertProvider>
      </TourProvider>
    </BrowserRouter>
  );
}
