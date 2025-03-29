import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useBakiContext } from "../../context/BakiContext";
import { AllProviders } from "../../test-utils";
import { supabase } from "../../utils/supabaseClient";
import { mockBakis } from "../../mocks/resultData";
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

describe("BakiContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with empty bakis and loading state", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }));

      const { result } = renderHook(() => useBakiContext(), {
        wrapper: AllProviders,
      });

      expect(result.current.bakis).toEqual([]);
      expect(result.current.loading).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
    });

    it("should load initial bakis from Supabase", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockBakis,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useBakiContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.bakis).toEqual(mockBakis);
    });
  });

  describe("addBaki", () => {
    it("should successfully add a baki", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockBakis[0],
          error: null,
        }),
      }));

      const { result } = renderHook(() => useBakiContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        const newBaki = await result.current.addBaki({
          amount: mockBakis[0].amount,
          user_id: mockBakis[0].user_id,
        });
        expect(newBaki).toEqual(mockBakis[0]);
      });

      expect(supabase.from).toHaveBeenCalledWith("bakis");
    });

    it("should handle add baki error", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Failed to add baki"),
        }),
      }));

      const { result } = renderHook(() => useBakiContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        const newBaki = await result.current.addBaki({
          amount: mockBakis[0].amount,
          user_id: mockBakis[0].user_id,
        });
        expect(newBaki).toBeNull();
      });
    });
  });

  describe("deleteBaki", () => {
    it("should successfully delete a baki", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockBakis[0],
          error: null,
        }),
      }));

      const { result } = renderHook(() => useBakiContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        const success = await result.current.deleteBaki(mockBakis[0].id);
        expect(success).toBe(true);
      });

      expect(supabase.from).toHaveBeenCalledWith("bakis");
    });

    it("should handle delete baki error", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Failed to delete baki"),
        }),
      }));

      const { result } = renderHook(() => useBakiContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        const success = await result.current.deleteBaki(mockBakis[0].id);
        expect(success).toBe(false);
      });
    });
  });

  describe("Real-time Updates", () => {
    it("should handle INSERT event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockBakis,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useBakiContext(), {
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
          new: mockBakis[0],
        });
      });

      expect(result.current.bakis).toContainEqual(mockBakis[0]);
    });

    it("should handle UPDATE event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockBakis,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useBakiContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockChannel = supabase.channel("test") as unknown as { on: jest.Mock };
      const onCallback = mockChannel.on.mock.calls[0][2];

      const updatedBaki = { ...mockBakis[0], amount: 200 };
      act(() => {
        onCallback({
          eventType: "UPDATE",
          new: updatedBaki,
        });
      });

      expect(result.current.bakis).toContainEqual(updatedBaki);
    });

    it("should handle DELETE event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockBakis,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useBakiContext(), {
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
          old: mockBakis[0],
        });
      });

      expect(result.current.bakis).not.toContainEqual(mockBakis[0]);
    });
  });
}); 