import React, { useMemo, useState } from "react";
import { Button, Card } from "flowbite-react";
import { Link } from "react-router-dom";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import { useAlertContext } from "../../context/AlertContext";
import { useAppSettingsContext } from "../../context/AppSettingsContext";
import { useAuthContext } from "../../context/AuthContext";
import { useTourContext } from "../../context/TourContext";
import { TOUR_TRACKS } from "../../tour/tracks";
import type { TourUserRole } from "../../tour/types";
import {
  NOTE_ENTRY_TIP,
  NOTE_VS_RESULT_CONTRAST,
  RESULT_ENTRY_TIP,
} from "../../utils/balanceLanguage";

/**
 * Soft check question for the shared how-balances module.
 */
const CHECK_QUESTION =
  "Note +50 → does the balance go up or down?";

/**
 * Help / Get started hub — pick a track to launch a spotlight coach-mark tour.
 */
const OnboardingPage: React.FC = function () {
  const { user_detail, markOnboardingComplete } = useAuthContext();
  const { showAlert } = useAlertContext();
  const { isBakiEnabled } = useAppSettingsContext();
  const { startTour, isActive } = useTourContext();
  const role: TourUserRole = user_detail?.role ?? "customer";

  const [showHowBalances, setShowHowBalances] = useState(false);
  const [checkAnswer, setCheckAnswer] = useState<"up" | "down" | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const tracks = useMemo(
    () => TOUR_TRACKS.filter((track) => track.roles.includes(role)),
    [role]
  );

  /**
   * Starts a guided overlay tour and marks the track as locally done when launched.
   * @param trackId - Tour track id
   */
  const handleStartTour = (trackId: string) => {
    startTour(trackId);
    setDoneIds((prev) =>
      prev.includes(trackId) ? prev : [...prev, trackId]
    );
  };

  const handleMarkComplete = async () => {
    setIsSaving(true);
    try {
      const ok = await markOnboardingComplete();
      if (ok) {
        showAlert("Onboarding marked complete", "success");
      } else {
        showAlert("Could not save onboarding progress", "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <NavbarSidebarLayout>
      <div className="px-4 pt-6" data-tour="help-hub">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
          Help / Get started
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Start a guided tour — the app highlights the right control with a dark
          overlay. Tracks match your role ({role}).
          {user_detail?.onboarding_completed_at
            ? " You have marked onboarding complete — reopen anytime."
            : " Mark done when finished, or skip for now."}
        </p>

        {!showHowBalances && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(role === "employee" || role === "admin") && (
              <Card
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setShowHowBalances(true)}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  How balances work
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Signed totals, note vs result contrast, one quick check.
                </p>
              </Card>
            )}
            {tracks.map((track) => (
              <Card key={track.id}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {track.title}
                  </h3>
                  {doneIds.includes(track.id) && (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Started
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {track.summary}
                </p>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  {track.steps.length} step{track.steps.length === 1 ? "" : "s"}
                </p>
                <div className="mt-4">
                  <Button
                    color="primary"
                    size="sm"
                    disabled={isActive}
                    onClick={() => handleStartTour(track.id)}>
                    Start tour
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {showHowBalances && (
          <Card className="mt-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              How balances work
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-300">
              <li>
                A signed balance is a running total: above zero = you owe, below zero = we owe you, zero = settled.
              </li>
              <li>{NOTE_ENTRY_TIP}</li>
              <li>{RESULT_ENTRY_TIP}</li>
              <li>{NOTE_VS_RESULT_CONTRAST}</li>
              {isBakiEnabled && (
                <li>
                  Baki is enabled: you may see a second balance target named Baki.
                </li>
              )}
            </ul>
            <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {CHECK_QUESTION}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  color={checkAnswer === "up" ? "failure" : "gray"}
                  size="sm"
                  onClick={() => setCheckAnswer("up")}>
                  Up
                </Button>
                <Button
                  color={checkAnswer === "down" ? "success" : "gray"}
                  size="sm"
                  onClick={() => setCheckAnswer("down")}>
                  Down
                </Button>
              </div>
              {checkAnswer === "down" && (
                <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                  Correct — a positive note moves the balance down.
                </p>
              )}
              {checkAnswer === "up" && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Not quite — positive notes move the balance down. Results move it up.
                </p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button color="gray" onClick={() => setShowHowBalances(false)}>
                Back to hub
              </Button>
            </div>
          </Card>
        )}

        <div className="mt-8 flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          {!user_detail?.onboarding_completed_at && (
            <Button
              color="primary"
              disabled={isSaving}
              onClick={handleMarkComplete}>
              {isSaving ? "Saving..." : "Mark onboarding complete"}
            </Button>
          )}
          <Button as={Link} to="/dashboard" color="gray">
            Back to dashboard
          </Button>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default OnboardingPage;
