import React, { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";
import { ResultProvider } from "../context/ResultContext";
import { TransactionProvider } from "../context/TransactionContext";
import { UserProvider } from "../context/UserContext";
import { BakiProvider } from "../context/BakiContext";
import { AccountBalanceProvider } from "../context/AccountBalanceContext";
import { AlertProvider } from "../context/AlertContext";

export function AllProviders({ children }: PropsWithChildren<{}>) {
  return (
    <BrowserRouter>
      <AlertProvider>
        <UserProvider>
          <AccountBalanceProvider>
            <BakiProvider>
              <TransactionProvider>
                <ResultProvider>
                  {children}
                </ResultProvider>
              </TransactionProvider>
            </BakiProvider>
          </AccountBalanceProvider>
        </UserProvider>
      </AlertProvider>
    </BrowserRouter>
  );
}

