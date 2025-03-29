import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useAccountBalanceContext } from "../../context/AccountBalanceContext";
import { AllProviders } from "../../test-utils";
import { supabase } from "../../utils/supabaseClient";
import { mockAccountBalances } from "../../mocks/resultData";
import { RealtimeChannel } from "@supabase/supabase-js";

// Mock the context hooks
jest.mock("../../context/AlertContext", () => ({
  useAlertContext: () => ({
    showAlert: jest.fn(),
  }),
}));

// Mock Supabase client
jest.mock("../../utils/supabaseClient", () => {
  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
  } as unknown as RealtimeChannel;

  return {
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
      channel: jest.fn((name: string) => mockChannel),
    },
  };
});

describe("AccountBalanceContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with empty account balances and loading state", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }));

      const { result } = renderHook(() => useAccountBalanceContext(), {
        wrapper: AllProviders,
      });

      expect(result.current.accountBalances).toEqual([]);
      expect(result.current.loading).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
    });

    it("should load initial account balances from Supabase", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAccountBalances,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useAccountBalanceContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.accountBalances).toEqual(mockAccountBalances);
    });
  });

  describe("addAccountBalance", () => {
    it("should successfully add an account balance", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockAccountBalances[0],
          error: null,
        }),
      }));

      const { result } = renderHook(() => useAccountBalanceContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        const newBalance = await result.current.addAccountBalance({
          balance: mockAccountBalances[0].balance,
          user_id: mockAccountBalances[0].user_id,
          category_id: mockAccountBalances[0].category_id,
        });
        expect(newBalance).toEqual(mockAccountBalances[0]);
      });

      expect(supabase.from).toHaveBeenCalledWith("account_balances");
    });

    it("should handle add account balance error", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Failed to add account balance"),
        }),
      }));

      const { result } = renderHook(() => useAccountBalanceContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        const newBalance = await result.current.addAccountBalance({
          balance: mockAccountBalances[0].balance,
          user_id: mockAccountBalances[0].user_id,
          category_id: mockAccountBalances[0].category_id,
        });
        expect(newBalance).toBeNull();
      });
    });
  });

  describe("updateAccountBalance", () => {
    it("should successfully update an account balance", async () => {
      const updatedBalance = { ...mockAccountBalances[0], balance: 500 };
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedBalance,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useAccountBalanceContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        const success = await result.current.updateAccountBalance({
          ...mockAccountBalances[0],
          balance: 500,
        });
        expect(success).toBe(true);
      });

      expect(supabase.from).toHaveBeenCalledWith("account_balances");
    });

    it("should handle update account balance error", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Failed to update account balance"),
        }),
      }));

      const { result } = renderHook(() => useAccountBalanceContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        const success = await result.current.updateAccountBalance({
          ...mockAccountBalances[0],
          balance: 500,
        });
        expect(success).toBe(false);
      });
    });
  });

  describe("Real-time Updates", () => {
    it("should handle INSERT event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAccountBalances,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useAccountBalanceContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockChannel = supabase.channel("test") as unknown as { on: jest.Mock };
      const onCallback = mockChannel.on.mock.calls[0][2];

      act(() => {
        onCallback({
          eventType: "INSERT",
          new: mockAccountBalances[0],
        });
      });

      expect(result.current.accountBalances).toContainEqual(mockAccountBalances[0]);
    });

    it("should handle UPDATE event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAccountBalances,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useAccountBalanceContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockChannel = supabase.channel("test") as unknown as { on: jest.Mock };
      const onCallback = mockChannel.on.mock.calls[0][2];

      const updatedBalance = { ...mockAccountBalances[0], balance: 1000 };
      act(() => {
        onCallback({
          eventType: "UPDATE",
          new: updatedBalance,
        });
      });

      expect(result.current.accountBalances).toContainEqual(updatedBalance);
    });

    it("should handle DELETE event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAccountBalances,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useAccountBalanceContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockChannel = supabase.channel("test") as unknown as { on: jest.Mock };
      const onCallback = mockChannel.on.mock.calls[0][2];

      act(() => {
        onCallback({
          eventType: "DELETE",
          old: mockAccountBalances[0],
        });
      });

      expect(result.current.accountBalances).not.toContainEqual(mockAccountBalances[0]);
    });
  });
}); 