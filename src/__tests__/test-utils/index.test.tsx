import React from "react";
import { render } from "../../test-utils";
import { useResultContext } from "../../context/ResultContext";
import { useUserContext } from "../../context/UserContext";
import { useAccountBalanceContext } from "../../context/AccountBalanceContext";
import { useBakiContext } from "../../context/BakiContext";
import { useTransactionContext } from "../../context/TransactionContext";
import { useAlertContext } from "../../context/AlertContext";

// Test component that uses all contexts
const TestComponent: React.FC = () => {
  const result = useResultContext();
  const user = useUserContext();
  const accountBalance = useAccountBalanceContext();
  const baki = useBakiContext();
  const transaction = useTransactionContext();
  const alert = useAlertContext();

  return (
    <div>
      <div data-testid="loading">{result.loading.toString()}</div>
      <div data-testid="results">{result.results.length}</div>
      <div data-testid="users">{user.users.length}</div>
      <div data-testid="account-balances">{accountBalance.accountBalances.length}</div>
      <div data-testid="bakis">{baki.bakis.length}</div>
      <div data-testid="transactions">{transaction.transactions.length}</div>
    </div>
  );
};

describe("Test Utilities", () => {
  it("should render component with all providers", () => {
    const { getByTestId } = render(<TestComponent />);

    // Verify all contexts are provided
    expect(getByTestId("loading")).toBeInTheDocument();
    expect(getByTestId("results")).toBeInTheDocument();
    expect(getByTestId("users")).toBeInTheDocument();
    expect(getByTestId("account-balances")).toBeInTheDocument();
    expect(getByTestId("bakis")).toBeInTheDocument();
    expect(getByTestId("transactions")).toBeInTheDocument();
  });

  it("should provide initial state from all contexts", () => {
    const { getByTestId } = render(<TestComponent />);

    // Verify initial state
    expect(getByTestId("loading")).toHaveTextContent("true");
    expect(getByTestId("results")).toHaveTextContent("0");
    expect(getByTestId("users")).toHaveTextContent("0");
    expect(getByTestId("account-balances")).toHaveTextContent("0");
    expect(getByTestId("bakis")).toHaveTextContent("0");
    expect(getByTestId("transactions")).toHaveTextContent("0");
  });

  it("should handle nested components", () => {
    const NestedComponent: React.FC = () => (
      <div>
        <TestComponent />
        <div data-testid="nested">Nested Component</div>
      </div>
    );

    const { getByTestId } = render(<NestedComponent />);

    expect(getByTestId("nested")).toBeInTheDocument();
    expect(getByTestId("loading")).toBeInTheDocument();
  });
}); 