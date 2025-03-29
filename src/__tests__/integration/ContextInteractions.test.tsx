import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AllProviders } from "../../test-utils";
import App from "../../App";
import { supabase } from "../../utils/supabaseClient";

// Mock Supabase client
jest.mock("../../utils/supabaseClient", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    })),
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

describe("Context Interactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock authenticated session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: { user: { id: "test-user" } },
      },
      error: null,
    });
  });

  const renderApp = () => {
    return render(
      <MemoryRouter>
        <AllProviders>
          <App />
        </AllProviders>
      </MemoryRouter>
    );
  };

  it("should update account balance when adding a transaction", async () => {
    // Mock initial data
    (supabase.from as jest.Mock).mockImplementation((table) => ({
      select: jest.fn().mockResolvedValue({
        data: table === "account_balances" 
          ? [{ id: "1", user_id: "test-user", amount: 1000 }]
          : [],
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({
        data: { id: "1", amount: 500, type: "expense" },
        error: null,
      }),
      order: jest.fn().mockReturnThis(),
    }));

    renderApp();

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText("$1000")).toBeInTheDocument();
    });

    // Add a new transaction
    const addButton = screen.getByRole("button", { name: /add transaction/i });
    fireEvent.click(addButton);

    // Fill transaction form
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "500" } });
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: "expense" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    // Verify balance update
    await waitFor(() => {
      expect(screen.getByText("$500")).toBeInTheDocument();
    });
  });

  it("should update baki balance when adding a baki", async () => {
    // Mock initial data
    (supabase.from as jest.Mock).mockImplementation((table) => ({
      select: jest.fn().mockResolvedValue({
        data: table === "bakis" 
          ? [{ id: "1", user_id: "test-user", amount: 200 }]
          : [],
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({
        data: { id: "2", amount: 300, user_id: "test-user" },
        error: null,
      }),
      order: jest.fn().mockReturnThis(),
    }));

    renderApp();

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText("$200")).toBeInTheDocument();
    });

    // Add a new baki
    const addButton = screen.getByRole("button", { name: /add baki/i });
    fireEvent.click(addButton);

    // Fill baki form
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "300" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    // Verify baki balance update
    await waitFor(() => {
      expect(screen.getByText("$500")).toBeInTheDocument();
    });
  });

  it("should show alerts for successful and failed operations", async () => {
    // Mock successful operation
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      insert: jest.fn().mockResolvedValue({
        data: { id: "1", amount: 500 },
        error: null,
      }),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    }));

    renderApp();

    // Perform successful operation
    const addButton = screen.getByRole("button", { name: /add transaction/i });
    fireEvent.click(addButton);
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    // Verify success alert
    await waitFor(() => {
      expect(screen.getByText(/successfully added/i)).toBeInTheDocument();
    });

    // Mock failed operation
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: new Error("Failed to add transaction"),
      }),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    }));

    // Perform failed operation
    fireEvent.click(addButton);
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    // Verify error alert
    await waitFor(() => {
      expect(screen.getByText(/failed to add/i)).toBeInTheDocument();
    });
  });

  it("should handle real-time updates across contexts", async () => {
    // Mock initial data
    (supabase.from as jest.Mock).mockImplementation((table) => ({
      select: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      order: jest.fn().mockReturnThis(),
    }));

    renderApp();

    // Get channel callbacks
    const channelCallbacks = new Map();
    (supabase.channel as jest.Mock).mockImplementation(() => ({
      on: (event: string, callback: Function) => {
        channelCallbacks.set(event, callback);
        return { subscribe: jest.fn() };
      },
    }));

    // Simulate real-time updates
    await waitFor(() => {
      // Transaction update
      channelCallbacks.get("INSERT")({
        new: { id: "1", amount: 500, type: "expense" },
        table: "transactions",
      });

      // Baki update
      channelCallbacks.get("INSERT")({
        new: { id: "1", amount: 300 },
        table: "bakis",
      });

      // Account balance update
      channelCallbacks.get("UPDATE")({
        new: { id: "1", amount: 800 },
        table: "account_balances",
      });
    });

    // Verify all updates are reflected
    expect(screen.getByText("$800")).toBeInTheDocument();
    expect(screen.getByText("$500")).toBeInTheDocument();
    expect(screen.getByText("$300")).toBeInTheDocument();
  });
}); 