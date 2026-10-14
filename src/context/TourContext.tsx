import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useNavigate } from "react-router-dom";
import SpotlightTour from "../components/tour/SpotlightTour";
import { getTourTrackById } from "../tour/tracks";
import type { TourStep, TourTrack } from "../tour/types";
import {
  ensureSidebarVisibleForTour,
  waitForTourTarget,
} from "../tour/waitForTourTarget";

interface TourContextProps {
  /** Whether a guided tour is active. */
  isActive: boolean;
  /** Active track metadata, or null when idle. */
  activeTrack: TourTrack | null;
  /** Zero-based step index within the active track. */
  stepIndex: number;
  /** Current step, or null when idle. */
  currentStep: TourStep | null;
  /** True while navigating / waiting for the highlight target. */
  isPreparing: boolean;
  /**
   * Starts a guided tour by track id (from Help hub).
   * @param trackId - Tour track identifier
   */
  startTour: (trackId: string) => void;
  /** Advances to the next step, or ends the tour on the last step. */
  nextStep: () => void;
  /** Goes back one step when possible. */
  backStep: () => void;
  /** Ends the tour without marking completion. */
  skipTour: () => void;
}

const TourContext = createContext<TourContextProps | null>(null);

/**
 * Provides guided spotlight tours across authenticated pages.
 * Must wrap routes inside BrowserRouter.
 */
export function TourProvider({ children }: Readonly<PropsWithChildren>) {
  const navigate = useNavigate();
  const [activeTrack, setActiveTrack] = useState<TourTrack | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  /** Ignores stale async prepare results when the user advances quickly. */
  const prepareGenerationRef = useRef(0);

  const currentStep =
    activeTrack && activeTrack.steps[stepIndex]
      ? activeTrack.steps[stepIndex]
      : null;

  /**
   * Clears tour state and highlight geometry.
   */
  const clearTour = useCallback(() => {
    prepareGenerationRef.current += 1;
    setActiveTrack(null);
    setStepIndex(0);
    setIsPreparing(false);
    setTargetRect(null);
  }, []);

  /**
   * Navigates to the step route, waits for data-tour, then sets highlight rect.
   * @param step - Step to prepare
   */
  const prepareStep = useCallback(
    async (step: TourStep) => {
      const generation = prepareGenerationRef.current + 1;
      prepareGenerationRef.current = generation;
      setIsPreparing(true);
      setTargetRect(null);

      const currentPath = window.location.pathname;
      if (currentPath !== step.route) {
        navigate(step.route);
      }

      // Allow React Router + layout to paint before probing for the target.
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), 50);
      });
      if (prepareGenerationRef.current !== generation) {
        return;
      }

      if (step.target.startsWith("nav-")) {
        ensureSidebarVisibleForTour();
        await new Promise<void>((resolve) => {
          window.setTimeout(() => resolve(), 120);
        });
        if (prepareGenerationRef.current !== generation) {
          return;
        }
      }

      const element = await waitForTourTarget(step.target);
      if (prepareGenerationRef.current !== generation) {
        return;
      }
      if (!element) {
        setIsPreparing(false);
        setTargetRect(null);
        return;
      }

      if (element instanceof HTMLElement) {
        element.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: "smooth",
        });
      }

      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), 200);
      });
      if (prepareGenerationRef.current !== generation) {
        return;
      }

      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      setIsPreparing(false);
    },
    [navigate]
  );

  const startTour = useCallback(
    (trackId: string) => {
      const track = getTourTrackById(trackId);
      if (!track || track.steps.length === 0) {
        return;
      }
      setActiveTrack(track);
      setStepIndex(0);
      void prepareStep(track.steps[0]);
    },
    [prepareStep]
  );

  const nextStep = useCallback(() => {
    if (!activeTrack) {
      return;
    }
    const nextIndex = stepIndex + 1;
    if (nextIndex >= activeTrack.steps.length) {
      clearTour();
      return;
    }
    setStepIndex(nextIndex);
    const next = activeTrack.steps[nextIndex];
    if (next) {
      void prepareStep(next);
    }
  }, [activeTrack, stepIndex, prepareStep, clearTour]);

  const backStep = useCallback(() => {
    if (!activeTrack || stepIndex <= 0) {
      return;
    }
    const prevIndex = stepIndex - 1;
    setStepIndex(prevIndex);
    const prev = activeTrack.steps[prevIndex];
    if (prev) {
      void prepareStep(prev);
    }
  }, [activeTrack, stepIndex, prepareStep]);

  const skipTour = useCallback(() => {
    clearTour();
  }, [clearTour]);

  /**
   * Recompute highlight on resize/scroll while a step is visible.
   */
  React.useEffect(() => {
    if (!currentStep || isPreparing) {
      return;
    }

    const refreshRect = () => {
      const element = document.querySelector(
        `[data-tour="${currentStep.target}"]`
      );
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    window.addEventListener("resize", refreshRect);
    window.addEventListener("scroll", refreshRect, true);
    return () => {
      window.removeEventListener("resize", refreshRect);
      window.removeEventListener("scroll", refreshRect, true);
    };
  }, [currentStep, isPreparing]);

  const value = useMemo<TourContextProps>(
    () => ({
      isActive: activeTrack !== null,
      activeTrack,
      stepIndex,
      currentStep,
      isPreparing,
      startTour,
      nextStep,
      backStep,
      skipTour,
    }),
    [
      activeTrack,
      stepIndex,
      currentStep,
      isPreparing,
      startTour,
      nextStep,
      backStep,
      skipTour,
    ]
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {activeTrack && currentStep && (
        <SpotlightTour
          trackTitle={activeTrack.title}
          step={currentStep}
          stepIndex={stepIndex}
          stepCount={activeTrack.steps.length}
          targetRect={targetRect}
          isPreparing={isPreparing}
          onNext={nextStep}
          onBack={backStep}
          onSkip={skipTour}
        />
      )}
    </TourContext.Provider>
  );
}

/**
 * Access the guided tour API.
 * @returns Tour context
 */
export function useTourContext(): TourContextProps {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTourContext must be used within a TourProvider");
  }
  return context;
}
