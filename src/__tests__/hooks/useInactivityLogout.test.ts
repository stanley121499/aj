import { renderHook } from "@testing-library/react";
import { useInactivityLogout } from "../../hooks/useInactivityLogout";
import { act } from "react-dom/test-utils";

// Mock the supabase auth
jest.mock("../../utils/supabaseClient", () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

describe("useInactivityLogout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Clear all mocks and timers
    jest.clearAllMocks();
    jest.clearAllTimers();
    // Reset all event listeners
    window.removeEventListener = jest.fn();
    window.addEventListener = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should set up event listeners on mount", () => {
    renderHook(() => useInactivityLogout());

    expect(window.addEventListener).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
  });

  it("should clean up event listeners on unmount", () => {
    const { unmount } = renderHook(() => useInactivityLogout());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith("click", expect.any(Function));
  });

  it("should not logout before inactivity timeout", () => {
    const { result } = renderHook(() => useInactivityLogout());

    // Advance time by less than the inactivity timeout
    act(() => {
      jest.advanceTimersByTime(14 * 60 * 1000); // 14 minutes
    });

    expect(result.current).toBeUndefined();
  });

  it("should logout after inactivity timeout", () => {
    const { result } = renderHook(() => useInactivityLogout());

    // Advance time by more than the inactivity timeout
    act(() => {
      jest.advanceTimersByTime(16 * 60 * 1000); // 16 minutes
    });

    expect(result.current).toBeUndefined();
    // Verify that signOut was called
    expect(require("../../utils/supabaseClient").supabase.auth.signOut).toHaveBeenCalled();
  });

  it("should reset timer on user activity", () => {
    const { result } = renderHook(() => useInactivityLogout());

    // Advance time partially
    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000); // 10 minutes
    });

    // Simulate user activity
    act(() => {
      const mousemoveCallback = (window.addEventListener as jest.Mock).mock.calls.find(
        call => call[0] === "mousemove"
      )[1];
      mousemoveCallback();
    });

    // Advance time by less than the full timeout after activity
    act(() => {
      jest.advanceTimersByTime(14 * 60 * 1000); // 14 minutes
    });

    expect(result.current).toBeUndefined();
    expect(require("../../utils/supabaseClient").supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it("should handle multiple activity events", () => {
    const { result } = renderHook(() => useInactivityLogout());

    // Get the event callbacks
    const mousemoveCallback = (window.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === "mousemove"
    )[1];
    const keydownCallback = (window.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === "keydown"
    )[1];
    const clickCallback = (window.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === "click"
    )[1];

    // Simulate multiple user activities
    act(() => {
      jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      mousemoveCallback();
      jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      keydownCallback();
      jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      clickCallback();
      jest.advanceTimersByTime(10 * 60 * 1000); // 10 minutes
    });

    expect(result.current).toBeUndefined();
    expect(require("../../utils/supabaseClient").supabase.auth.signOut).not.toHaveBeenCalled();
  });
}); 