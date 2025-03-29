import { renderHook } from "@testing-library/react";
import { AllProviders } from "../../test-utils";

/**
 * Helper function to setup test with providers
 * @param callback The test callback to run
 * @returns The rendered hook result
 */
export const setupTestWithProviders = async <T,>(callback: () => T) => {
  const { result } = renderHook(() => callback(), {
    wrapper: AllProviders,
  });
  return result;
};

/**
 * Helper function to setup mock channel
 * @param mockChannel The mock channel object
 * @returns The setup mock channel
 */
export const setupMockChannel = (mockChannel: any) => {
  mockChannel.on.mockReturnValue(mockChannel);
  mockChannel.subscribe.mockReturnValue(mockChannel);
  return mockChannel;
};

/**
 * Helper function to setup mock error
 * @param error The error message
 * @returns The mock error implementation
 */
export const setupMockError = (error: string) => {
  return {
    error: new Error(error),
    data: null,
    status: 500,
    statusText: "Internal Server Error",
  };
};

/**
 * Helper function to render a hook with all providers
 * @param hook The hook to render
 */
export const renderHookWithProviders = <TProps, TResult>(
  hook: (props: TProps) => TResult
) => {
  return renderHook(hook, {
    wrapper: AllProviders,
  });
};

/**
 * Helper function to setup real-time subscription tests
 * @param channelName The channel name to mock
 * @param mockCallback The callback to handle subscription events
 */
export const setupRealtimeTest = (
  channelName: string,
  mockCallback: (payload: any) => void
) => {
  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
  };

  mockChannel.on.mockImplementation((event: string, filter: any, callback: any) => {
    mockCallback(callback);
    return mockChannel;
  });

  return mockChannel;
}; 