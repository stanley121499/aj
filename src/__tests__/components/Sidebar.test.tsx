import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import { useUserContext } from "../../context/UserContext";

// Mock the context
jest.mock("../../context/UserContext");

describe("Sidebar", () => {
  const mockUser = {
    id: "test-user",
    email: "test@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock user context
    (useUserContext as jest.Mock).mockReturnValue({
      users: [mockUser],
      loading: false,
    });
  });

  const renderSidebar = () => {
    return render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
  };

  it("should render all menu items", () => {
    renderSidebar();
    
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Bakis")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("should highlight active menu item", () => {
    renderSidebar();
    
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveClass("bg-gray-900", "text-white");
  });

  it("should handle menu item clicks", () => {
    renderSidebar();
    
    const dashboardLink = screen.getByText("Dashboard");
    const transactionsLink = screen.getByText("Transactions");
    const bakisLink = screen.getByText("Bakis");
    const settingsLink = screen.getByText("Settings");

    fireEvent.click(dashboardLink);
    expect(window.location.pathname).toBe("/");

    fireEvent.click(transactionsLink);
    expect(window.location.pathname).toBe("/transactions");

    fireEvent.click(bakisLink);
    expect(window.location.pathname).toBe("/bakis");

    fireEvent.click(settingsLink);
    expect(window.location.pathname).toBe("/settings");
  });

  it("should toggle sidebar collapse", () => {
    renderSidebar();
    
    const collapseButton = screen.getByRole("button", { name: /toggle sidebar/i });
    
    // Initially sidebar should be expanded
    expect(screen.getByText("Dashboard")).toBeVisible();
    
    // Click to collapse
    fireEvent.click(collapseButton);
    expect(screen.queryByText("Dashboard")).not.toBeVisible();
    
    // Click to expand
    fireEvent.click(collapseButton);
    expect(screen.getByText("Dashboard")).toBeVisible();
  });

  it("should show icons for all menu items", () => {
    renderSidebar();
    
    const menuItems = screen.getAllByRole("link");
    menuItems.forEach(item => {
      expect(item.querySelector("svg")).toBeInTheDocument();
    });
  });

  it("should show tooltips for menu items when collapsed", () => {
    renderSidebar();
    
    const collapseButton = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(collapseButton);
    
    const menuItems = screen.getAllByRole("link");
    menuItems.forEach(item => {
      fireEvent.mouseEnter(item);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      fireEvent.mouseLeave(item);
    });
  });

  it("should handle mobile view", () => {
    // Mock window resize
    global.innerWidth = 640;
    global.dispatchEvent(new Event("resize"));
    
    renderSidebar();
    
    // Sidebar should be collapsed by default in mobile view
    expect(screen.queryByText("Dashboard")).not.toBeVisible();
    
    // Click to expand
    const expandButton = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(expandButton);
    expect(screen.getByText("Dashboard")).toBeVisible();
  });

  it("should handle keyboard navigation", () => {
    renderSidebar();
    
    const menuItems = screen.getAllByRole("link");
    
    // Test keyboard navigation
    menuItems[0].focus();
    expect(document.activeElement).toBe(menuItems[0]);
    
    fireEvent.keyDown(menuItems[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuItems[1]);
    
    fireEvent.keyDown(menuItems[1], { key: "ArrowUp" });
    expect(document.activeElement).toBe(menuItems[0]);
  });
}); 