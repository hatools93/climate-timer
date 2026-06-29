/**
 * Format utilities for the Climate Timer Card.
 */

/**
 * Converts a duration in minutes to a display string for the idle state.
 *
 * When < 60 minutes: "{m}m" format (e.g., 5 → "5m", 30 → "30m")
 * When ≥ 60 minutes: "{h}h {r}m" format where h = floor(m/60), r = m mod 60
 *   (e.g., 60 → "1h 0m", 90 → "1h 30m", 480 → "8h 0m")
 */
export function formatDurationIdle(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}m`;
}

/**
 * Converts milliseconds to a "MM:SS" countdown display string.
 *
 * MM is total minutes (can exceed 59), zero-padded to 2 digits.
 * SS is seconds, zero-padded to 2 digits.
 *
 * Examples: 300000 → "05:00", 61000 → "01:01", 0 → "00:00"
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}
