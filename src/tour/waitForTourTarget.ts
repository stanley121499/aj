/**
 * Resolves a tour target element by data-tour, waiting for mount after navigation.
 */

const DEFAULT_TIMEOUT_MS = 8000;
const POLL_INTERVAL_MS = 100;

/**
 * Builds the CSS selector for a data-tour attribute.
 * @param target - data-tour value
 * @returns Attribute selector string
 */
export function tourTargetSelector(target: string): string {
  return `[data-tour="${target}"]`;
}

/**
 * Returns the first element matching a tour target, or null.
 * @param target - data-tour value
 * @returns Element or null
 */
export function findTourTarget(target: string): Element | null {
  return document.querySelector(tourTargetSelector(target));
}

/**
 * Waits until a data-tour element exists or the timeout elapses.
 * @param target - data-tour value
 * @param timeoutMs - Max wait time
 * @returns The element when found, otherwise null
 */
export function waitForTourTarget(
  target: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Element | null> {
  const existing = findTourTarget(target);
  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    const startedAt = Date.now();
    let settled = false;

    const finish = (element: Element | null) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearInterval(intervalId);
      observer.disconnect();
      resolve(element);
    };

    const tryFind = () => {
      const element = findTourTarget(target);
      if (element) {
        finish(element);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        finish(null);
      }
    };

    const observer = new MutationObserver(() => {
      tryFind();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const intervalId = window.setInterval(tryFind, POLL_INTERVAL_MS);
    tryFind();
  });
}

/**
 * Ensures a sidebar tour target is visible on small screens by opening the menu.
 */
export function ensureSidebarVisibleForTour(): void {
  const navTarget = document.querySelector("[data-tour^=\"nav-\"]");
  if (navTarget && isElementVisible(navTarget)) {
    return;
  }

  const buttons = Array.from(document.querySelectorAll("button"));
  const sidebarToggle = buttons.find((button) => {
    const sr = button.querySelector(".sr-only");
    return sr?.textContent?.includes("Toggle sidebar") === true;
  });

  if (sidebarToggle instanceof HTMLElement) {
    sidebarToggle.click();
  }
}

/**
 * Whether an element has a non-zero layout box and is not display:none.
 * @param element - DOM node to check
 * @returns True when the element is likely visible
 */
export function isElementVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
