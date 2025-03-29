import { useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/**
 * Type for entities that can be tracked in real-time
 */
type TrackableEntity = {
  id: string | number;
};

/**
 * Type for the payload received from Supabase real-time events
 */
type RealtimePayload<T extends TrackableEntity> = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
};

/**
 * Type for the handler function that processes real-time changes
 */
type RealtimeHandler<T extends TrackableEntity> = (payload: RealtimePayload<T>) => void;

/**
 * Type for the subscription configuration
 */
type SubscriptionConfig = {
  table: string;
  schema?: string;
  channel?: string;
};

/**
 * Type for tracking pending operations
 */
type PendingOperation<T extends TrackableEntity> = {
  id: string | number;
  type: "INSERT" | "UPDATE" | "DELETE";
  timestamp: number;
  data?: T;
};

/**
 * Type for the operation tracking function
 */
type TrackOperation<T extends TrackableEntity> = (operation: PendingOperation<T>) => void;

/**
 * Custom hook for handling real-time subscriptions to Supabase tables
 * @param config - Configuration for the subscription
 * @param handler - Function to handle real-time changes
 * @param dependencies - Array of dependencies for the effect
 * @returns Function to track pending operations
 */
export function useRealtimeSubscription<T extends TrackableEntity>(
  config: SubscriptionConfig,
  handler: RealtimeHandler<T>,
  dependencies: unknown[] = []
): TrackOperation<T> {
  const pendingOperations = useRef<Map<string | number, PendingOperation<T>>>(new Map());
  const operationTimeout = 5000; // 5 seconds timeout for pending operations

  useEffect(() => {
    const channelName = config.channel || config.table;
    const schema = config.schema || "public";

    const handlePayload = (payload: RealtimePostgresChangesPayload<T>) => {
      // For DELETE events, we need to use the old record's ID
      const recordId = payload.eventType === "DELETE" 
        ? payload.old.id 
        : payload.new.id;

      if (!recordId) {
        console.error("Received payload without ID:", payload);
        return;
      }

      const pendingOp = pendingOperations.current.get(recordId);
      
      // If there's a pending operation and it's recent enough
      if (pendingOp && 
          pendingOp.type === payload.eventType && 
          Date.now() - pendingOp.timestamp < operationTimeout) {
        // This is likely our own operation, skip it
        pendingOperations.current.delete(recordId);
        return;
      }

      // If there's a pending operation but it's too old, clear it
      if (pendingOp && Date.now() - pendingOp.timestamp >= operationTimeout) {
        pendingOperations.current.delete(recordId);
      }

      // For DELETE events, we need to ensure we have the old record
      if (payload.eventType === "DELETE") {
        handler({
          eventType: payload.eventType,
          new: payload.old as T, // Use old record for DELETE events
          old: payload.old as T
        });
      } else {
        handler({
          eventType: payload.eventType,
          new: payload.new as T,
          old: payload.old as T
        });
      }
    };

    const subscription: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema, table: config.table },
        handlePayload
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [config.table, config.schema, config.channel, handler, ...dependencies]);

  // Return a function to track pending operations
  return (operation: PendingOperation<T>) => {
    pendingOperations.current.set(operation.id, operation);
    
    // Clean up after timeout
    setTimeout(() => {
      pendingOperations.current.delete(operation.id);
    }, operationTimeout);
  };
} 