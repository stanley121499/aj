import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../../components/navbar";
import { useUserContext } from "../../context/UserContext";
import { useAccountBalanceContext } from "../../context/AccountBalanceContext";

// Mock the contexts
jest.mock("../../context/UserContext");
jest.mock("../../context/AccountBalanceContext");
jest.mock("../../utils/supabaseClient", () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

describe("Navbar", () => {
  const mockUser = {
    id: "test-user",
    email: "test@example.com",
  };

  const mockBalance = {
    id: "1",
    user_id: "test-user",
    amount: 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock user context
    (useUserContext as jest.Mock).mockReturnValue({
      users: [mockUser],
      loading: false,
    });
    // Mock account balance context
    (useAccountBalanceContext as jest.Mock).mockReturnValue({
      accountBalances: [mockBalance],
      loading: false,
    });
  });

  const renderNavbar = () => {
    return render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
  };

  it("should render the logo", () => {
    renderNavbar();
    const logo = screen.getByAltText("Logo");
    expect(logo).toBeInTheDocument();
  });

  it("should render navigation links", () => {
    renderNavbar();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Bakis")).toBeInTheDocument();
  });

  it("should render user balance", () => {
    renderNavbar();
    expect(screen.getByText("$1000")).toBeInTheDocument();
  });

  it("should render user menu button", () => {
    renderNavbar();
    const menuButton = screen.getByRole("button", { name: /user menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it("should open user menu on click", () => {
    renderNavbar();
    const menuButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(menuButton);
    
    expect(screen.getByText("Sign out")).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });

  it("should handle sign out", () => {
    renderNavbar();
    const menuButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(menuButton);
    
    const signOutButton = screen.getByText("Sign out");
    fireEvent.click(signOutButton);
    
    expect(require("../../utils/supabaseClient").supabase.auth.signOut).toHaveBeenCalled();
  });

  it("should show loading state", () => {
    (useUserContext as jest.Mock).mockReturnValue({
      users: [],
      loading: true,
    });
    (useAccountBalanceContext as jest.Mock).mockReturnValue({
      accountBalances: [],
      loading: true,
    });

    renderNavbar();
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("should handle mobile menu toggle", () => {
    renderNavbar();
    const mobileMenuButton = screen.getByRole("button", { name: /open main menu/i });
    
    // Initially mobile menu should be hidden
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    
    // Click to open mobile menu
    fireEvent.click(mobileMenuButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    
    // Click again to close
    fireEvent.click(mobileMenuButton);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("should handle navigation link clicks", () => {
    renderNavbar();
    const dashboardLink = screen.getByText("Dashboard");
    const transactionsLink = screen.getByText("Transactions");
    const bakisLink = screen.getByText("Bakis");

    fireEvent.click(dashboardLink);
    expect(window.location.pathname).toBe("/");

    fireEvent.click(transactionsLink);
    expect(window.location.pathname).toBe("/transactions");

    fireEvent.click(bakisLink);
    expect(window.location.pathname).toBe("/bakis");
  });
}); 