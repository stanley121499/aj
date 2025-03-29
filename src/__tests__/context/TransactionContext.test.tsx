import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useTransactionContext } from "../../context/TransactionContext";
import { AllProviders } from "../../test-utils";
import { supabase } from "../../utils/supabaseClient";
import { mockTransactions } from "../../mocks/resultData";
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

describe("TransactionContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with empty transactions and loading state", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }));

      const { result } = renderHook(() => useTransactionContext(), {
        wrapper: AllProviders,
      });

      expect(result.current.transactions).toEqual([]);
      expect(result.current.loading).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
    });

    it("should load initial transactions from Supabase", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useTransactionContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.transactions).toEqual(mockTransactions);
    });
  });

  describe("addTransaction", () => {
    it("should successfully add a transaction", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockTransactions[0],
          error: null,
        }),
      }));

      const { result } = renderHook(() => useTransactionContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        const newTransaction = await result.current.addTransaction(mockTransactions[0]);
        expect(newTransaction).toEqual(mockTransactions[0]);
      });

      expect(supabase.from).toHaveBeenCalledWith("transactions");
    });

    it("should handle add transaction error", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Failed to add transaction"),
        }),
      }));

      const { result } = renderHook(() => useTransactionContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        const newTransaction = await result.current.addTransaction(mockTransactions[0]);
        expect(newTransaction).toBeNull();
      });
    });
  });

  describe("deleteTransaction", () => {
    it("should successfully delete a transaction", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      }));

      const { result } = renderHook(() => useTransactionContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await result.current.deleteTransaction(mockTransactions[0]);
      });

      expect(supabase.from).toHaveBeenCalledWith("transactions");
    });

    it("should handle delete transaction error", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: new Error("Failed to delete transaction"),
        }),
      }));

      const { result } = renderHook(() => useTransactionContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await result.current.deleteTransaction(mockTransactions[0]);
      });
    });
  });

  describe("Real-time Updates", () => {
    it("should handle INSERT event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useTransactionContext(), {
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
          new: mockTransactions[0],
        });
      });

      expect(result.current.transactions).toContainEqual(mockTransactions[0]);
    });

    it("should handle UPDATE event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useTransactionContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockChannel = supabase.channel("test") as unknown as { on: jest.Mock };
      const onCallback = mockChannel.on.mock.calls[0][2];

      const updatedTransaction = { ...mockTransactions[0], amount: 2000 };
      act(() => {
        onCallback({
          eventType: "UPDATE",
          new: updatedTransaction,
        });
      });

      expect(result.current.transactions).toContainEqual(updatedTransaction);
    });

    it("should handle DELETE event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useTransactionContext(), {
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
          old: mockTransactions[0],
        });
      });

      expect(result.current.transactions).not.toContainEqual(mockTransactions[0]);
    });
  });
}); 