import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useAlertContext } from "../../context/AlertContext";
import { AllProviders } from "../../test-utils";

describe("AlertContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with empty alert state", () => {
      const { result } = renderHook(() => useAlertContext(), {
        wrapper: AllProviders,
      });

      expect(result.current.alert).toBeNull();
      expect(result.current.showAlert).toBeDefined();
    });
  });

  describe("showAlert", () => {
    it("should show an alert with success type", () => {
      const { result } = renderHook(() => useAlertContext(), {
        wrapper: AllProviders,
      });

      act(() => {
        result.current.showAlert({
          type: "success",
          message: "Operation successful",
        });
      });

      expect(result.current.alert).toEqual({
        type: "success",
        message: "Operation successful",
      });
    });

    it("should show an alert with error type", () => {
      const { result } = renderHook(() => useAlertContext(), {
        wrapper: AllProviders,
      });

      act(() => {
        result.current.showAlert({
          type: "error",
          message: "Operation failed",
        });
      });

      expect(result.current.alert).toEqual({
        type: "error",
        message: "Operation failed",
      });
    });

    it("should show an alert with warning type", () => {
      const { result } = renderHook(() => useAlertContext(), {
        wrapper: AllProviders,
      });

      act(() => {
        result.current.showAlert({
          type: "warning",
          message: "Please be careful",
        });
      });

      expect(result.current.alert).toEqual({
        type: "warning",
        message: "Please be careful",
      });
    });

    it("should show an alert with info type", () => {
      const { result } = renderHook(() => useAlertContext(), {
        wrapper: AllProviders,
      });

      act(() => {
        result.current.showAlert({
          type: "info",
          message: "Just for your information",
        });
      });

      expect(result.current.alert).toEqual({
        type: "info",
        message: "Just for your information",
      });
    });
  });

  describe("Auto-dismiss", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should auto-dismiss alert after default timeout", () => {
      const { result } = renderHook(() => useAlertContext(), {
        wrapper: AllProviders,
      });

      act(() => {
        result.current.showAlert({
          type: "success",
          message: "Operation successful",
        });
      });

      expect(result.current.alert).toBeDefined();

      act(() => {
        jest.advanceTimersByTime(3000); // Default timeout
      });

      expect(result.current.alert).toBeNull();
    });

    it("should auto-dismiss alert after custom timeout", () => {
      const { result } = renderHook(() => useAlertContext(), {
        wrapper: AllProviders,
      });

      act(() => {
        result.current.showAlert({
          type: "success",
          message: "Operation successful",
          timeout: 5000,
        });
      });

      expect(result.current.alert).toBeDefined();

      act(() => {
        jest.advanceTimersByTime(4999);
      });

      expect(result.current.alert).toBeDefined();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.alert).toBeNull();
    });

    it("should not auto-dismiss alert when timeout is set to 0", () => {
      const { result } = renderHook(() => useAlertContext(), {
        wrapper: AllProviders,
      });

      act(() => {
        result.current.showAlert({
          type: "success",
          message: "Operation successful",
          timeout: 0,
        });
      });

      expect(result.current.alert).toBeDefined();

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.alert).toBeDefined();
    });

    it("should clear previous timeout when showing new alert", () => {
      const { result } = renderHook(() => useAlertContext(), {
        wrapper: AllProviders,
      });

      act(() => {
        result.current.showAlert({
          type: "success",
          message: "First alert",
        });
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.showAlert({
          type: "error",
          message: "Second alert",
        });
      });

      expect(result.current.alert).toEqual({
        type: "error",
        message: "Second alert",
      });

      act(() => {
        jest.advanceTimersByTime(2999);
      });

      expect(result.current.alert).toBeDefined();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.alert).toBeNull();
    });
  });
}); 