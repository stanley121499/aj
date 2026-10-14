import {
  NOTE_ENTRY_TIP,
  NOTE_VS_RESULT_CONTRAST,
  RESULT_ENTRY_TIP,
} from "../utils/balanceLanguage";
import type { TourTrack } from "./types";

/**
 * Guided tour tracks by use case / role.
 * Started from Help hub — not auto-started on login.
 */
export const TOUR_TRACKS: TourTrack[] = [
  {
    id: "check-balance",
    title: "Check my balance",
    summary: "See per-category signed balances and what above/below zero means.",
    roles: ["customer", "employee", "admin"],
    steps: [
      {
        id: "cb-1",
        title: "Your balance cards",
        tip: "Each category has a signed total. Green = Above 0, red = Below 0, gray = Zero — labels, not good/bad.",
        route: "/dashboard",
        target: "balance-cards",
        placement: "bottom",
      },
      {
        id: "cb-2",
        title: "Read the legend",
        tip: "Match colors to Above 0 / Below 0 / Zero anytime you are unsure.",
        route: "/dashboard",
        target: "balance-legend",
        placement: "bottom",
      },
      {
        id: "cb-3",
        title: "Review history anytime",
        tip: "Transactions show ↑ (balance up) and ↓ (balance down) with a Source badge — not debit/credit jargon.",
        route: "/dashboard",
        target: "nav-transactions",
        placement: "right",
      },
    ],
  },
  {
    id: "submit-note",
    title: "Submit a payment note",
    summary: "Upload proof and amount. Positive = money in → balance down.",
    roles: ["customer", "employee", "admin"],
    steps: [
      {
        id: "sn-1",
        title: "Create a note",
        tip: NOTE_ENTRY_TIP,
        route: "/dashboard",
        target: "create-note-form",
        placement: "left",
      },
      {
        id: "sn-2",
        title: "Submit when ready",
        tip: "Balance moves only after an operator approves. The live A → B preview shows what approval will do.",
        route: "/dashboard",
        target: "create-note-submit",
        placement: "top",
      },
    ],
  },
  {
    id: "review-history",
    title: "Review my history",
    summary: "Read ↑/↓ effects and Source badges.",
    roles: ["customer", "employee", "admin"],
    steps: [
      {
        id: "rh-1",
        title: "Open Transactions",
        tip: "Scan Effect (↑/↓) and Source (Note, Result, Opening, Payout). ↑ = balance up; ↓ = balance down.",
        route: "/transactions",
        target: "nav-transactions",
        placement: "right",
      },
      {
        id: "rh-2",
        title: "Your ledger",
        tip: "Each row shows how the signed balance moved — not who-owes-whom language.",
        route: "/transactions",
        target: "transactions-page",
        placement: "bottom",
      },
    ],
  },
  {
    id: "approve-notes",
    title: "Approve or reject notes",
    summary: "Confirm before a note moves a balance.",
    roles: ["employee", "admin"],
    steps: [
      {
        id: "an-1",
        title: "Notes in the sidebar",
        tip: "Operators review pending notes here before balances move.",
        route: "/notes",
        target: "nav-notes",
        placement: "right",
      },
      {
        id: "an-2",
        title: "Review pending notes",
        tip: "Approval applies the note credit/debit and moves the balance. Positive note → balance down.",
        route: "/notes",
        target: "notes-page",
        placement: "bottom",
      },
    ],
  },
  {
    id: "enter-results",
    title: "Enter results",
    summary: "Paste amount username lines. Positive = balance up (opposite of notes).",
    roles: ["employee", "admin"],
    steps: [
      {
        id: "er-1",
        title: "Results in the sidebar",
        tip: RESULT_ENTRY_TIP,
        route: "/results",
        target: "nav-results",
        placement: "right",
      },
      {
        id: "er-2",
        title: "Add a result",
        tip: `${RESULT_ENTRY_TIP} ${NOTE_VS_RESULT_CONTRAST}`,
        route: "/results",
        target: "results-page",
        placement: "bottom",
      },
    ],
  },
  {
    id: "orange-adjust",
    title: "Orange adjustments",
    summary: "Fix below-zero users with signed math (increase → up, decrease → down).",
    roles: ["employee", "admin"],
    steps: [
      {
        id: "oa-1",
        title: "Open Orange",
        tip: "Orange lists users with below-zero balances. Increase moves balance up; decrease moves it down.",
        route: "/orange",
        target: "nav-orange",
        placement: "right",
      },
      {
        id: "oa-2",
        title: "Adjust carefully",
        tip: "Clear all only zeroes below-zero balances. Keep the Orange name in nav and pages.",
        route: "/orange",
        target: "orange-page",
        placement: "bottom",
      },
    ],
  },
  {
    id: "clean-start",
    title: "Clean-start opening balances",
    summary: "CSV import posts OPENING transactions to set signed targets.",
    roles: ["admin"],
    steps: [
      {
        id: "cs-1",
        title: "Open Settings",
        tip: "Admin Settings holds Baki and opening-balance tools. Use the sidebar Settings link.",
        route: "/users/settings",
        target: "nav-settings",
        placement: "right",
      },
      {
        id: "cs-2",
        title: "Opening balances",
        tip: "Download the template, set username / category / balance, then preview and confirm. Re-import replaces prior OPENING for the same user × category.",
        route: "/users/settings",
        target: "opening-balances",
        placement: "top",
      },
      {
        id: "cs-3",
        title: "Baki kill-switch",
        tip: "When Baki is off, Account balance continues to work. Toggle only when you intend a global change.",
        route: "/users/settings",
        target: "settings-baki",
        placement: "bottom",
      },
    ],
  },
  {
    id: "toggle-baki",
    title: "Turn Baki on/off",
    summary: "Global kill-switch for Baki UI and Baki-targeted money movement.",
    roles: ["admin"],
    steps: [
      {
        id: "tb-1",
        title: "Settings",
        tip: "Open admin Settings from the sidebar.",
        route: "/users/settings",
        target: "nav-settings",
        placement: "right",
      },
      {
        id: "tb-2",
        title: "Enable Baki",
        tip: "When off, Baki UI and Baki-targeted notes, transactions, and results are blocked. Account balance still works.",
        route: "/users/settings",
        target: "settings-baki",
        placement: "bottom",
      },
    ],
  },
];

/**
 * Looks up a tour track by id.
 * @param trackId - Track identifier from the Help hub
 * @returns Track or null when unknown
 */
export function getTourTrackById(trackId: string): TourTrack | null {
  const track = TOUR_TRACKS.find((item) => item.id === trackId);
  return track ?? null;
}
