import React, { useLayoutEffect, useRef, useState } from "react";
import { Button } from "flowbite-react";
import type { TourStep } from "../../tour/types";

interface SpotlightTourProps {
  trackTitle: string;
  step: TourStep;
  stepIndex: number;
  stepCount: number;
  targetRect: DOMRect | null;
  isPreparing: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const PADDING = 8;
const TOOLTIP_GAP = 12;
const TOOLTIP_WIDTH = 320;

interface TooltipPosition {
  top: number;
  left: number;
}

/**
 * Positions the coach tooltip near the highlight, flipping when near edges.
 * @param rect - Highlighted target bounds (or null for centered fallback)
 * @param tooltipHeight - Measured tooltip height
 * @param preferred - Preferred placement from the step
 * @returns Fixed viewport coordinates for the tooltip
 */
function computeTooltipPosition(
  rect: DOMRect | null,
  tooltipHeight: number,
  preferred: TourStep["placement"]
): TooltipPosition {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  if (!rect) {
    return {
      top: Math.max(24, (viewportH - tooltipHeight) / 2),
      left: Math.max(16, (viewportW - TOOLTIP_WIDTH) / 2),
    };
  }

  const highlightTop = rect.top - PADDING;
  const highlightBottom = rect.bottom + PADDING;
  const highlightLeft = rect.left - PADDING;
  const highlightCenterX = rect.left + rect.width / 2;

  const placement =
    preferred && preferred !== "auto"
      ? preferred
      : highlightBottom + TOOLTIP_GAP + tooltipHeight < viewportH
        ? "bottom"
        : "top";

  let top = highlightBottom + TOOLTIP_GAP;
  let left = highlightCenterX - TOOLTIP_WIDTH / 2;

  if (placement === "top") {
    top = highlightTop - TOOLTIP_GAP - tooltipHeight;
  } else if (placement === "left") {
    top = rect.top + rect.height / 2 - tooltipHeight / 2;
    left = highlightLeft - TOOLTIP_GAP - TOOLTIP_WIDTH;
  } else if (placement === "right") {
    top = rect.top + rect.height / 2 - tooltipHeight / 2;
    left = rect.right + PADDING + TOOLTIP_GAP;
  }

  left = Math.min(Math.max(16, left), viewportW - TOOLTIP_WIDTH - 16);
  top = Math.min(Math.max(16, top), viewportH - tooltipHeight - 16);

  return { top, left };
}

/**
 * Full-screen coach-mark overlay with spotlight cutout and step tooltip.
 * Matches Flowbite light/dark surfaces; blocks interaction outside controls.
 */
const SpotlightTour: React.FC<SpotlightTourProps> = function ({
  trackTitle,
  step,
  stepIndex,
  stepCount,
  targetRect,
  isPreparing,
  onNext,
  onBack,
  onSkip,
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({
    top: 24,
    left: 24,
  });

  useLayoutEffect(() => {
    const height = tooltipRef.current?.offsetHeight ?? 180;
    setTooltipPos(computeTooltipPosition(targetRect, height, step.placement));
  }, [targetRect, step.placement, step.id, isPreparing]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onSkip();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onSkip]);

  const highlightStyle: React.CSSProperties | undefined = targetRect
    ? {
        position: "fixed",
        top: targetRect.top - PADDING,
        left: targetRect.left - PADDING,
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
        borderRadius: 8,
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
        border: "2px solid rgb(63, 131, 248)",
        zIndex: 10000,
        pointerEvents: "none",
      }
    : undefined;

  const isLast = stepIndex >= stepCount - 1;

  return (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title">
      {/* Full dim when target not yet ready */}
      {!targetRect && (
        <div className="absolute inset-0 bg-black/65" aria-hidden="true" />
      )}

      {highlightStyle && <div style={highlightStyle} aria-hidden="true" />}

      {/* Click shield so page controls stay inert during the tour */}
      <div className="absolute inset-0 z-[10001]" aria-hidden="true" />

      <div
        ref={tooltipRef}
        className="fixed z-[10002] w-[320px] max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-gray-800"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {trackTitle} · Step {stepIndex + 1} of {stepCount}
        </p>
        <h2
          id="tour-step-title"
          className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
          {step.title}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {isPreparing ? "Finding the control…" : step.tip}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button color="primary" size="sm" onClick={onNext} disabled={isPreparing}>
            {isLast ? "Done" : "Next"}
          </Button>
          <Button
            color="gray"
            size="sm"
            onClick={onBack}
            disabled={stepIndex === 0 || isPreparing}>
            Back
          </Button>
          <Button color="light" size="sm" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SpotlightTour;
