// Feature: climate-timer-card, Property 5: Elapsed fraction computation from timer entity
import { describe, it, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { computeRemainingMs, computeElapsedFraction } from '../utils/timer-utils';
import { parseDurationToMs } from '../utils/duration-utils';

/**
 * Validates: Requirements 4.3, 4.5
 *
 * Property 5: Elapsed fraction computation from timer entity
 * For any `finishes_at` timestamp (in the future or past relative to now) and
 * `duration` string representing a valid HA timer duration, the elapsed fraction
 * function SHALL report a value in [0.0, 1.0] where: the fraction equals
 * `(totalMs - remainingMs) / totalMs`, `remainingMs = max(0, finishesAt - now)`,
 * `totalMs = parseDuration(duration)`, and the result is clamped to [0.0, 1.0].
 * The remaining time SHALL never be negative.
 */

/**
 * Generates a random offset from "now" in milliseconds [-3600000, 3600000] (±1 hour).
 * This is used to create finishesAt timestamps that are either in the future or past.
 */
const offsetArb = fc.integer({ min: -3600000, max: 3600000 });

/**
 * Generates a random duration in minutes [1, 480] and converts to "HH:MM:SS" string.
 */
const durationMinutesArb = fc.integer({ min: 1, max: 480 });

function minutesToDurationStr(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
}

describe('Timer display property tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('computeRemainingMs', () => {
    it('result is always >= 0', () => {
      fc.assert(
        fc.property(offsetArb, (offset) => {
          const now = Date.now();
          vi.spyOn(Date, 'now').mockReturnValue(now);
          const finishesAt = new Date(now + offset).toISOString();
          const result = computeRemainingMs(finishesAt);
          vi.restoreAllMocks();
          return result >= 0;
        }),
        { numRuns: 100 }
      );
    });

    it('for future timestamps, result > 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 3600000 }),
          (positiveOffset) => {
            const now = Date.now();
            vi.spyOn(Date, 'now').mockReturnValue(now);
            const finishesAt = new Date(now + positiveOffset).toISOString();
            const result = computeRemainingMs(finishesAt);
            vi.restoreAllMocks();
            return result > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for past timestamps, result === 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -3600000, max: -100 }),
          (negativeOffset) => {
            const now = Date.now();
            vi.spyOn(Date, 'now').mockReturnValue(now);
            const finishesAt = new Date(now + negativeOffset).toISOString();
            const result = computeRemainingMs(finishesAt);
            vi.restoreAllMocks();
            return result === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('computeElapsedFraction', () => {
    it('result is always in [0.0, 1.0]', () => {
      fc.assert(
        fc.property(offsetArb, durationMinutesArb, (offset, durationMin) => {
          const now = Date.now();
          vi.spyOn(Date, 'now').mockReturnValue(now);
          const finishesAt = new Date(now + offset).toISOString();
          const durationStr = minutesToDurationStr(durationMin);
          const result = computeElapsedFraction(finishesAt, durationStr);
          vi.restoreAllMocks();
          return result >= 0.0 && result <= 1.0;
        }),
        { numRuns: 100 }
      );
    });

    it('result matches the formula: (totalMs - max(0, finishesAt - now)) / totalMs, clamped', () => {
      fc.assert(
        fc.property(offsetArb, durationMinutesArb, (offset, durationMin) => {
          const now = Date.now();
          vi.spyOn(Date, 'now').mockReturnValue(now);
          const finishesAt = new Date(now + offset).toISOString();
          const durationStr = minutesToDurationStr(durationMin);

          const result = computeElapsedFraction(finishesAt, durationStr);

          // Compute expected value using the same formula
          const totalMs = parseDurationToMs(durationStr);
          const remainingMs = Math.max(0, Date.parse(finishesAt) - now);
          const expectedFraction = Math.max(0.0, Math.min(1.0, (totalMs - remainingMs) / totalMs));

          vi.restoreAllMocks();
          return Math.abs(result - expectedFraction) < 1e-10;
        }),
        { numRuns: 100 }
      );
    });

    it('when finishesAt is far in the past, fraction should be 1.0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -3600000, max: -60000 }),
          durationMinutesArb,
          (pastOffset, durationMin) => {
            const now = Date.now();
            vi.spyOn(Date, 'now').mockReturnValue(now);
            // Ensure finishesAt is far enough in the past that remainingMs = 0
            // and totalMs - 0 = totalMs, so fraction = 1.0
            const finishesAt = new Date(now + pastOffset).toISOString();
            const durationStr = minutesToDurationStr(durationMin);
            const totalMs = parseDurationToMs(durationStr);

            // Only test when the offset magnitude exceeds the total duration
            // so that the timer is fully elapsed
            if (Math.abs(pastOffset) > 0 && totalMs > 0) {
              const remainingMs = Math.max(0, Date.parse(finishesAt) - now);
              // remainingMs should be 0 since finishesAt is in the past
              if (remainingMs === 0) {
                const result = computeElapsedFraction(finishesAt, durationStr);
                vi.restoreAllMocks();
                return result === 1.0;
              }
            }
            vi.restoreAllMocks();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('when duration is "00:00:00" (totalMs = 0), fraction should be 1.0', () => {
      fc.assert(
        fc.property(offsetArb, (offset) => {
          const now = Date.now();
          vi.spyOn(Date, 'now').mockReturnValue(now);
          const finishesAt = new Date(now + offset).toISOString();
          const result = computeElapsedFraction(finishesAt, '00:00:00');
          vi.restoreAllMocks();
          return result === 1.0;
        }),
        { numRuns: 100 }
      );
    });
  });
});
