import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useUserContext } from "../../context/UserContext";
import { AllProviders } from "../../test-utils";
import { supabase } from "../../utils/supabaseClient";
import { mockUsers } from "../../mocks/resultData";
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

describe("UserContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with empty users and loading state", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }));

      const { result } = renderHook(() => useUserContext(), {
        wrapper: AllProviders,
      });

      expect(result.current.users).toEqual([]);
      expect(result.current.loading).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
    });

    it("should load initial users from Supabase", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useUserContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.users).toEqual(mockUsers);
    });
  });

  describe("addUser", () => {
    it("should successfully add a user", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUsers[0],
          error: null,
        }),
      }));

      const { result } = renderHook(() => useUserContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        const newUser = await result.current.addUser({
          email: mockUsers[0].email,
        });
        expect(newUser).toEqual(mockUsers[0]);
      });

      expect(supabase.from).toHaveBeenCalledWith("users");
    });

    it("should handle add user error", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Failed to add user"),
        }),
      }));

      const { result } = renderHook(() => useUserContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        const newUser = await result.current.addUser({
          email: mockUsers[0].email,
        });
        expect(newUser).toBeNull();
      });
    });
  });

  describe("Real-time Updates", () => {
    it("should handle INSERT event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useUserContext(), {
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
          new: mockUsers[0],
        });
      });

      expect(result.current.users).toContainEqual(mockUsers[0]);
    });

    it("should handle UPDATE event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useUserContext(), {
        wrapper: AllProviders,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const mockChannel = supabase.channel("test") as unknown as { on: jest.Mock };
      const onCallback = mockChannel.on.mock.calls[0][2];

      const updatedUser = { ...mockUsers[0], email: "updated@example.com" };
      act(() => {
        onCallback({
          eventType: "UPDATE",
          new: updatedUser,
        });
      });

      expect(result.current.users).toContainEqual(updatedUser);
    });

    it("should handle DELETE event", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      }));

      const { result } = renderHook(() => useUserContext(), {
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
          old: mockUsers[0],
        });
      });

      expect(result.current.users).not.toContainEqual(mockUsers[0]);
    });
  });
}); 