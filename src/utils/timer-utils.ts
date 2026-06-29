/**
 * Timer computation utilities for the Climate Timer Card.
 *
 * Provides functions to compute remaining time and elapsed fraction
 * from a Home Assistant timer entity's `finishes_at` attribute.
 */

import { parseDurationToMs } from "./duration-utils";

/**
 * Computes the remaining milliseconds until a timer finishes.
 *
 * @param finishesAt - ISO timestamp string of when the timer will finish.
 * @returns The remaining milliseconds, or 0 if the time is in the past.
 */
export function computeRemainingMs(finishesAt: string): number {
  return Math.max(0, Date.parse(finishesAt) - Date.now());
}

/**
 * Computes the elapsed fraction of a timer's total duration.
 *
 * Uses the timer entity's `finishes_at` attribute and total duration string
 * to determine how much of the timer has elapsed, clamped to [0.0, 1.0].
 *
 * @param finishesAt - ISO timestamp string of when the timer will finish.
 * @param durationStr - Duration string in "HH:MM:SS" format representing the total timer duration.
 * @returns A fraction between 0.0 and 1.0 representing elapsed time.
 */
export function computeElapsedFraction(finishesAt: string, durationStr: string): number {
  const totalMs = parseDurationToMs(durationStr);

  // Edge case: if total duration is 0, consider the timer fully elapsed
  if (totalMs === 0) {
    return 1.0;
  }

  const remainingMs = Math.max(0, Date.parse(finishesAt) - Date.now());
  const fraction = (totalMs - remainingMs) / totalMs;

  // Clamp to [0.0, 1.0]
  return Math.max(0.0, Math.min(1.0, fraction));
}
