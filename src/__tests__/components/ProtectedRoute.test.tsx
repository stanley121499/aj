import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import { supabase } from "../../utils/supabaseClient";

// Mock the supabase auth
jest.mock("../../utils/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

// Mock child component
const MockComponent = () => <div>Protected Content</div>;

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (isAuthenticated: boolean) => {
    // Mock the session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: isAuthenticated ? { user: { id: "test-user" } } : null,
      },
      error: null,
    });

    return render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <MockComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("should render protected content when authenticated", async () => {
    renderWithRouter(true);

    // Wait for the protected content to be rendered
    const protectedContent = await screen.findByText("Protected Content");
    expect(protectedContent).toBeInTheDocument();
  });

  it("should redirect to login when not authenticated", async () => {
    renderWithRouter(false);

    // Wait for the login page to be rendered
    const loginPage = await screen.findByText("Login Page");
    expect(loginPage).toBeInTheDocument();
  });

  it("should handle authentication loading state", async () => {
    // Mock a delayed session response
    (supabase.auth.getSession as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    renderWithRouter(true);

    // Initially, there should be no content
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("should handle authentication error", async () => {
    // Mock an error response
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: new Error("Authentication failed"),
    });

    renderWithRouter(false);

    // Should redirect to login on error
    const loginPage = await screen.findByText("Login Page");
    expect(loginPage).toBeInTheDocument();
  });
}); 