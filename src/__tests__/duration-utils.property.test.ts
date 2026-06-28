// Feature: climate-timer-card, Property 2: Duration adjustment with clamping
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  adjustDuration,
  clampDuration,
  MIN_DURATION,
  MAX_DURATION,
  STEP,
} from "../utils/duration-utils";

/**
 * **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**
 *
 * Property 2: Duration adjustment with clamping
 *
 * For any valid current duration (5 ≤ d ≤ 480, multiple of 5) and any scroll
 * direction (up or down), adjusting the duration SHALL produce a result that is:
 * exactly d + 5 when direction is up and d < 480, exactly d - 5 when direction
 * is down and d > 5, or unchanged when at the respective boundary. The result
 * SHALL always satisfy 5 ≤ result ≤ 480 and be a multiple of 5.
 */

// Generator: valid durations that are multiples of STEP in [MIN_DURATION..MAX_DURATION]
const validDurationArb = fc.integer({ min: 1, max: Math.floor(MAX_DURATION / STEP) }).map((n) => n * STEP);

// Generator: scroll direction
const directionArb = fc.oneof(
  fc.constant("up" as const),
  fc.constant("down" as const)
);

describe("Property 2: Duration adjustment with clamping", () => {
  it("adjustDuration result is always in [MIN_DURATION, MAX_DURATION]", () => {
    fc.assert(
      fc.property(validDurationArb, directionArb, (duration, direction) => {
        const result = adjustDuration(duration, direction);
        expect(result).toBeGreaterThanOrEqual(MIN_DURATION);
        expect(result).toBeLessThanOrEqual(MAX_DURATION);
      }),
      { numRuns: 100 }
    );
  });

  it("adjustDuration result is always a multiple of STEP", () => {
    fc.assert(
      fc.property(validDurationArb, directionArb, (duration, direction) => {
        const result = adjustDuration(duration, direction);
        expect(result % STEP).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("adjustDuration increases by STEP when direction is up and d < MAX_DURATION", () => {
    const belowMaxArb = fc.integer({ min: 1, max: Math.floor(MAX_DURATION / STEP) - 1 }).map((n) => n * STEP);
    fc.assert(
      fc.property(belowMaxArb, (duration) => {
        const result = adjustDuration(duration, "up");
        expect(result).toBe(duration + STEP);
      }),
      { numRuns: 100 }
    );
  });

  it("adjustDuration decreases by STEP when direction is down and d > MIN_DURATION", () => {
    const aboveMinArb = fc.integer({ min: 2, max: Math.floor(MAX_DURATION / STEP) }).map((n) => n * STEP);
    fc.assert(
      fc.property(aboveMinArb, (duration) => {
        const result = adjustDuration(duration, "down");
        expect(result).toBe(duration - STEP);
      }),
      { numRuns: 100 }
    );
  });

  it("adjustDuration stays at MAX_DURATION when direction is up and d === MAX_DURATION", () => {
    const result = adjustDuration(MAX_DURATION, "up");
    expect(result).toBe(MAX_DURATION);
  });

  it("adjustDuration stays at MIN_DURATION when direction is down and d === MIN_DURATION", () => {
    const result = adjustDuration(MIN_DURATION, "down");
    expect(result).toBe(MIN_DURATION);
  });

  describe("clampDuration properties", () => {
    const anyNumberArb = fc.double({
      min: -1000,
      max: 1000,
      noNaN: true,
      noDefaultInfinity: true,
    });

    it("clampDuration result is always in [MIN_DURATION, MAX_DURATION]", () => {
      fc.assert(
        fc.property(anyNumberArb, (value) => {
          const result = clampDuration(value);
          expect(result).toBeGreaterThanOrEqual(MIN_DURATION);
          expect(result).toBeLessThanOrEqual(MAX_DURATION);
        }),
        { numRuns: 100 }
      );
    });

    it("clampDuration result is always a multiple of STEP", () => {
      fc.assert(
        fc.property(anyNumberArb, (value) => {
          const result = clampDuration(value);
          expect(result % STEP).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });
});
