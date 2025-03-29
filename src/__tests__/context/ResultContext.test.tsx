import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useResultContext } from "../../context/ResultContext";
import { AllProviders } from "../../test-utils";
import { supabase } from "../../utils/supabaseClient";
import { mockResults, mockResultInserts } from "../../mocks/resultData";
import { RealtimeChannel } from "@supabase/supabase-js";

// Mock the context hooks
jest.mock("../../context/UserContext", () => ({
  useUserContext: () => ({
    users: mockResults,
  }),
}));

jest.mock("../../context/AccountBalanceContext", () => ({
  useAccountBalanceContext: () => ({
    accountBalances: mockResults,
    addAccountBalance: jest.fn().mockResolvedValue(mockResults[0]),
  }),
}));

jest.mock("../../context/BakiContext", () => ({
  useBakiContext: () => ({
    bakis: mockResults,
    addBaki: jest.fn().mockResolvedValue(mockResults[0]),
  }),
}));

jest.mock("../../context/TransactionContext", () => ({
  useTransactionContext: () => ({
    transactions: mockResults,
    addTransaction: jest.fn().mockResolvedValue(mockResults[0]),
    deleteTransaction: jest.fn(),
  }),
}));

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

describe("ResultContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with empty results and loading state", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }));

      const { result } = renderHook(() => useResultContext(), {
        wrapper: AllProviders,
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.loading).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
    });

    it("should load initial results from Supabase", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockResults,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useResultContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.results).toEqual(mockResults);
    });
  });

  describe("addResult", () => {
    it("should successfully add an account balance result", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockResults[0],
          error: null,
        }),
      }));

      const { result } = renderHook(() => useResultContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await result.current.addResult(mockResultInserts.accountBalance);
      });

      expect(supabase.from).toHaveBeenCalledWith("results");
    });

    it("should successfully add a baki result", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockResults[1],
          error: null,
        }),
      }));

      const { result } = renderHook(() => useResultContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await result.current.addResult(mockResultInserts.baki);
      });

      expect(supabase.from).toHaveBeenCalledWith("results");
    });

    it("should handle invalid result data", async () => {
      const { result } = renderHook(() => useResultContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await result.current.addResult(mockResultInserts.invalid);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("deleteResult", () => {
    it("should successfully delete a result", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      }));

      const { result } = renderHook(() => useResultContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await result.current.deleteResult(mockResults[0]);
      });

      expect(supabase.from).toHaveBeenCalledWith("results");
    });

    it("should handle deletion error", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: new Error("Failed to delete"),
        }),
      }));

      const { result } = renderHook(() => useResultContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await result.current.deleteResult(mockResults[0]);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("updateResult", () => {
    it("should successfully update a result", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      }));

      const { result } = renderHook(() => useResultContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await result.current.updateResult(mockResults[0]);
      });

      expect(supabase.from).toHaveBeenCalledWith("results");
    });

    it("should handle update error", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: new Error("Failed to update"),
        }),
      }));

      const { result } = renderHook(() => useResultContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await result.current.updateResult(mockResults[0]);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("Real-time Updates", () => {
    it("should handle INSERT event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockResults,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useResultContext(), {
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
          new: mockResults[0],
        });
      });

      expect(result.current.results).toContainEqual(mockResults[0]);
    });

    it("should handle UPDATE event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockResults,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useResultContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockChannel = supabase.channel("test") as unknown as { on: jest.Mock };
      const onCallback = mockChannel.on.mock.calls[0][2];

      const updatedResult = { ...mockResults[0], result: "updated result" };
      act(() => {
        onCallback({
          eventType: "UPDATE",
          new: updatedResult,
        });
      });

      expect(result.current.results).toContainEqual(updatedResult);
    });

    it("should handle DELETE event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockResults,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useResultContext(), {
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
          old: mockResults[0],
        });
      });

      expect(result.current.results).not.toContainEqual(mockResults[0]);
    });
  });
}); 