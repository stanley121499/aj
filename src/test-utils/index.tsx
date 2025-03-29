import React, { PropsWithChildren } from "react";
import { render as rtlRender } from "@testing-library/react";
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

function render(ui: React.ReactElement, options = {}) {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { render }; 