import React from "react";
import { render, screen } from "@testing-library/react";
import AlertComponent from "../../components/AlertComponent";
import { useAlertContext } from "../../context/AlertContext";

// Mock the AlertContext
jest.mock("../../context/AlertContext");

describe("AlertComponent", () => {
  const mockUseAlertContext = useAlertContext as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when alert is null", () => {
    mockUseAlertContext.mockReturnValue({
      alert: null,
      showAlert: jest.fn(),
    });

    const { container } = render(<AlertComponent />);
    expect(container.firstChild).toBeNull();
  });

  it("should render success alert", () => {
    mockUseAlertContext.mockReturnValue({
      alert: {
        type: "success",
        message: "Operation successful",
      },
      showAlert: jest.fn(),
    });

    render(<AlertComponent />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Operation successful");
    expect(alert).toHaveClass("bg-green-50", "text-green-800");
  });

  it("should render error alert", () => {
    mockUseAlertContext.mockReturnValue({
      alert: {
        type: "error",
        message: "Operation failed",
      },
      showAlert: jest.fn(),
    });

    render(<AlertComponent />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Operation failed");
    expect(alert).toHaveClass("bg-red-50", "text-red-800");
  });

  it("should render warning alert", () => {
    mockUseAlertContext.mockReturnValue({
      alert: {
        type: "warning",
        message: "Please be careful",
      },
      showAlert: jest.fn(),
    });

    render(<AlertComponent />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Please be careful");
    expect(alert).toHaveClass("bg-yellow-50", "text-yellow-800");
  });

  it("should render info alert", () => {
    mockUseAlertContext.mockReturnValue({
      alert: {
        type: "info",
        message: "Just for your information",
      },
      showAlert: jest.fn(),
    });

    render(<AlertComponent />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Just for your information");
    expect(alert).toHaveClass("bg-blue-50", "text-blue-800");
  });
}); 