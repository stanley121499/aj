/**
 * Spotlight tour step and track types.
 * Targets are resolved via `[data-tour="<target>"]` after optional navigation.
 */

export type TourPlacement = "top" | "bottom" | "left" | "right" | "auto";

export type TourUserRole = "customer" | "employee" | "admin";

/**
 * One coach-mark step in a guided tour.
 */
export interface TourStep {
  id: string;
  title: string;
  tip: string;
  /** Route to navigate to before waiting for the target. */
  route: string;
  /** Value of data-tour on the highlighted element. */
  target: string;
  placement?: TourPlacement;
}

/**
 * Role-filtered guided tour track started from Help hub.
 */
export interface TourTrack {
  id: string;
  title: string;
  summary: string;
  roles: TourUserRole[];
  steps: TourStep[];
}
