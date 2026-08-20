// Feature: ui-mode-selection, Property 3: Duration Boundary Clamping Invariant
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { adjustDuration, clampDuration } from "../utils/duration-utils";

/**
 * **Validates: Requirements 3.5, 3.6, 3.7, 3.8, 7.2**
 *
 * Property 3: Duration Boundary Clamping Invariant
 *
 * For any non-negative integer duration, any valid step > 0, and any valid
 * maxDuration >= step, clampDuration(duration, maxDuration, step) SHALL produce
 * a value that is (a) a positive multiple of step, (b) greater than or equal to
 * step, and (c) less than or equal to maxDuration.
 */

// Generator: step is a positive integer between 1 and 60
const stepArb = fc.integer({ min: 1, max: 60 });

// Generator: maxDuration is >= step (derived from step)
const stepAndMaxArb = stepArb.chain((step) =>
  fc.integer({ min: step, max: step * 100 }).map((maxDuration) => ({
    step,
    maxDuration,
  }))
);

// Generator: arbitrary non-negative integer duration (including out-of-range values)
const durationArb = fc.integer({ min: 0, max: 1000 });

describe("Property 3: Duration Boundary Clamping Invariant", () => {
  it("clampDuration result is always a positive multiple of step", () => {
    fc.assert(
      fc.property(durationArb, stepAndMaxArb, (duration, { step, maxDuration }) => {
        const result = clampDuration(duration, maxDuration, step);
        expect(result % step).toBe(0);
        expect(result).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("clampDuration result is always >= step", () => {
    fc.assert(
      fc.property(durationArb, stepAndMaxArb, (duration, { step, maxDuration }) => {
        const result = clampDuration(duration, maxDuration, step);
        expect(result).toBeGreaterThanOrEqual(step);
      }),
      { numRuns: 100 }
    );
  });

  it("clampDuration result is always <= maxDuration", () => {
    fc.assert(
      fc.property(durationArb, stepAndMaxArb, (duration, { step, maxDuration }) => {
        const result = clampDuration(duration, maxDuration, step);
        expect(result).toBeLessThanOrEqual(maxDuration);
      }),
      { numRuns: 100 }
    );
  });

  it("clampDuration result satisfies all three invariants simultaneously", () => {
    fc.assert(
      fc.property(durationArb, stepAndMaxArb, (duration, { step, maxDuration }) => {
        const result = clampDuration(duration, maxDuration, step);

        // (a) positive multiple of step
        expect(result % step).toBe(0);
        expect(result).toBeGreaterThan(0);

        // (b) >= step
        expect(result).toBeGreaterThanOrEqual(step);

        // (c) <= maxDuration
        expect(result).toBeLessThanOrEqual(maxDuration);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: ui-mode-selection, Property 2: Duration Adjustment Correctness

/**
 * **Validates: Requirements 3.3, 3.4, 3.7, 3.8**
 *
 * Property 2: Duration Adjustment Correctness
 *
 * For any valid duration `d` (where `step <= d <= maxDuration` and `d` is a
 * multiple of `step`), any valid `step > 0`, any valid `maxDuration >= step`,
 * and any direction ("up" or "down"), the result of
 * `adjustDuration(d, direction, maxDuration, step)` SHALL be a multiple of
 * `step` within the range [step, maxDuration].
 */

// Generator: direction
const directionArb = fc.oneof(
  fc.constant("up" as const),
  fc.constant("down" as const)
);

describe("Feature: ui-mode-selection, Property 2: Duration Adjustment Correctness", () => {
  it("adjustDuration result is always a multiple of step within [step, maxDuration]", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 60 }).chain((step) => {
          // maxDuration must be a multiple of step >= step
          return fc.integer({ min: 1, max: 20 }).chain((maxMult) => {
            const maxDuration = step * maxMult;
            // duration is a valid multiple of step in [step, maxDuration]
            return fc.integer({ min: 1, max: maxMult }).map((durMult) => ({
              duration: durMult * step,
              step,
              maxDuration,
            }));
          });
        }),
        directionArb,
        ({ duration, step, maxDuration }, direction) => {
          const result = adjustDuration(duration, direction, maxDuration, step);

          // Post-condition 1: result is a multiple of step
          expect(result % step).toBe(0);

          // Post-condition 2: result >= step (minimum bound)
          expect(result).toBeGreaterThanOrEqual(step);

          // Post-condition 3: result <= maxDuration (maximum bound)
          expect(result).toBeLessThanOrEqual(maxDuration);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("adjustDuration 'up' increases or stays at maxDuration", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 60 }).chain((step) => {
          return fc.integer({ min: 1, max: 20 }).chain((maxMult) => {
            const maxDuration = step * maxMult;
            return fc.integer({ min: 1, max: maxMult }).map((durMult) => ({
              duration: durMult * step,
              step,
              maxDuration,
            }));
          });
        }),
        ({ duration, step, maxDuration }) => {
          const result = adjustDuration(duration, "up", maxDuration, step);

          // When going up, result should be >= duration (increases or stays clamped)
          expect(result).toBeGreaterThanOrEqual(duration);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("adjustDuration 'down' decreases or stays at step (minimum)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 60 }).chain((step) => {
          return fc.integer({ min: 1, max: 20 }).chain((maxMult) => {
            const maxDuration = step * maxMult;
            return fc.integer({ min: 1, max: maxMult }).map((durMult) => ({
              duration: durMult * step,
              step,
              maxDuration,
            }));
          });
        }),
        ({ duration, step, maxDuration }) => {
          const result = adjustDuration(duration, "down", maxDuration, step);

          // When going down, result should be <= duration (decreases or stays clamped)
          expect(result).toBeLessThanOrEqual(duration);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: ui-mode-selection, Property 7: Duration Preservation on Mode Switch

/**
 * **Validates: Requirements 7.3, 7.4**
 *
 * Property 7: Duration Preservation on Mode Switch
 *
 * For any current duration and any new configuration (step, maxDuration),
 * switching ui_mode SHALL result in a duration equal to
 * clampDuration(currentDuration, maxDuration, step) — which is the nearest
 * valid multiple of step that does not exceed maxDuration, with a minimum
 * value of step.
 */

describe("Feature: ui-mode-selection, Property 7: Duration Preservation on Mode Switch", () => {
  it("preserved duration equals clampDuration(currentDuration, maxDuration, step)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 60 }).chain((step) =>
          fc.integer({ min: step, max: step * 100 }).chain((maxDuration) =>
            fc.integer({ min: 1, max: 1000 }).map((duration) => ({
              duration,
              step,
              maxDuration,
            }))
          )
        ),
        ({ duration, step, maxDuration }) => {
          // Simulate mode switch: the preserved duration should be clamped
          const preservedDuration = clampDuration(duration, maxDuration, step);

          // Verify it equals what clampDuration produces
          expect(preservedDuration).toBe(clampDuration(duration, maxDuration, step));

          // Verify the preserved duration satisfies all validity invariants
          // (a) positive multiple of step
          expect(preservedDuration % step).toBe(0);
          expect(preservedDuration).toBeGreaterThan(0);

          // (b) >= step (minimum bound)
          expect(preservedDuration).toBeGreaterThanOrEqual(step);

          // (c) <= maxDuration
          expect(preservedDuration).toBeLessThanOrEqual(maxDuration);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("duration is preserved exactly when already valid (multiple of step within [step, maxDuration])", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 60 }).chain((step) =>
          fc.integer({ min: 1, max: 20 }).chain((maxMult) => {
            const maxDuration = step * maxMult;
            return fc.integer({ min: 1, max: maxMult }).map((durMult) => ({
              duration: durMult * step,
              step,
              maxDuration,
            }));
          })
        ),
        ({ duration, step, maxDuration }) => {
          // When the duration is already a valid multiple of step in [step, maxDuration],
          // mode switch should preserve it exactly
          const preservedDuration = clampDuration(duration, maxDuration, step);
          expect(preservedDuration).toBe(duration);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("out-of-range durations are clamped to nearest valid value on mode switch", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 60 }).chain((step) =>
          fc.integer({ min: step, max: step * 50 }).chain((maxDuration) =>
            fc.integer({ min: maxDuration + 1, max: maxDuration + 500 }).map(
              (duration) => ({
                duration,
                step,
                maxDuration,
              })
            )
          )
        ),
        ({ duration, step, maxDuration }) => {
          // Duration exceeds maxDuration — should be clamped down
          const preservedDuration = clampDuration(duration, maxDuration, step);
          expect(preservedDuration).toBeLessThanOrEqual(maxDuration);
          expect(preservedDuration).toBeGreaterThanOrEqual(step);
          expect(preservedDuration % step).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: ui-mode-selection, Property 4: Idle Duration Format Correctness
import { formatDurationIdle } from "../utils/format-utils";

/**
 * **Validates: Requirements 3.2**
 *
 * Property 4: Idle Duration Format Correctness
 *
 * For any positive integer duration in minutes (1–1440),
 * formatDurationIdle(duration) SHALL produce a string matching the pattern
 * "{m}m" when duration < 60, or "{h}h {r}m" when duration >= 60, where
 * h = floor(duration / 60) and r = duration % 60.
 */

describe("Feature: ui-mode-selection, Property 4: Idle Duration Format Correctness", () => {
  it("formatDurationIdle produces correct format for durations < 60 minutes", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 59 }), (duration) => {
        const result = formatDurationIdle(duration);
        expect(result).toBe(`${duration}m`);
      }),
      { numRuns: 100 }
    );
  });

  it("formatDurationIdle produces correct format for durations >= 60 minutes", () => {
    fc.assert(
      fc.property(fc.integer({ min: 60, max: 1440 }), (duration) => {
        const result = formatDurationIdle(duration);
        const h = Math.floor(duration / 60);
        const r = duration % 60;
        expect(result).toBe(`${h}h ${r}m`);
      }),
      { numRuns: 100 }
    );
  });

  it("formatDurationIdle format matches '{m}m' or '{h}h {r}m' pattern for all valid durations", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1440 }), (duration) => {
        const result = formatDurationIdle(duration);

        if (duration < 60) {
          // Should match "{m}m" pattern
          const match = result.match(/^(\d+)m$/);
          expect(match).not.toBeNull();
          expect(Number(match![1])).toBe(duration);
        } else {
          // Should match "{h}h {r}m" pattern
          const match = result.match(/^(\d+)h (\d+)m$/);
          expect(match).not.toBeNull();
          const h = Number(match![1]);
          const r = Number(match![2]);
          expect(h).toBe(Math.floor(duration / 60));
          expect(r).toBe(duration % 60);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: ui-mode-selection, Property 5: Countdown Format Correctness
import { formatCountdown } from "../utils/format-utils";

/**
 * **Validates: Requirements 4.4**
 *
 * Property 5: Countdown Format Correctness
 *
 * For any non-negative integer millisecond value, formatCountdown(ms) SHALL
 * produce a string in "MM:SS" format where MM is zero-padded to at least 2
 * digits and SS is zero-padded to exactly 2 digits, and the numeric values
 * satisfy MM = floor(floor(ms/1000) / 60) and SS = floor(ms/1000) % 60.
 */

describe("Feature: ui-mode-selection, Property 5: Countdown Format Correctness", () => {
  // Generator: non-negative integers 0–86400000 (ms values, up to 24 hours)
  const msArb = fc.integer({ min: 0, max: 86400000 });

  it("formatCountdown output matches MM:SS format with correct zero-padding", () => {
    fc.assert(
      fc.property(msArb, (ms) => {
        const result = formatCountdown(ms);

        // Verify format: MM is at least 2 digits, SS is exactly 2 digits
        expect(result).toMatch(/^\d{2,}:\d{2}$/);
      }),
      { numRuns: 100 }
    );
  });

  it("formatCountdown produces correct numeric MM and SS values", () => {
    fc.assert(
      fc.property(msArb, (ms) => {
        const result = formatCountdown(ms);

        const totalSeconds = Math.floor(ms / 1000);
        const expectedMM = Math.floor(totalSeconds / 60);
        const expectedSS = totalSeconds % 60;

        const [mmStr, ssStr] = result.split(":");
        const actualMM = parseInt(mmStr, 10);
        const actualSS = parseInt(ssStr, 10);

        expect(actualMM).toBe(expectedMM);
        expect(actualSS).toBe(expectedSS);
      }),
      { numRuns: 100 }
    );
  });

  it("formatCountdown SS is always in [0, 59]", () => {
    fc.assert(
      fc.property(msArb, (ms) => {
        const result = formatCountdown(ms);
        const ssStr = result.split(":")[1];
        const actualSS = parseInt(ssStr, 10);

        expect(actualSS).toBeGreaterThanOrEqual(0);
        expect(actualSS).toBeLessThanOrEqual(59);
      }),
      { numRuns: 100 }
    );
  });

  it("formatCountdown MM is always non-negative", () => {
    fc.assert(
      fc.property(msArb, (ms) => {
        const result = formatCountdown(ms);
        const mmStr = result.split(":")[0];
        const actualMM = parseInt(mmStr, 10);

        expect(actualMM).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: ui-mode-selection, Property 6: Event Contract Consistency
import "../components/simple-timer-selector";
import { SimpleTimerSelector } from "../components/simple-timer-selector";

/**
 * **Validates: Requirements 7.1**
 *
 * Property 6: Event Contract Consistency
 *
 * For any duration change triggered in the Simple UI (via increment or
 * decrement button), the emitted `duration-changed` CustomEvent SHALL have
 * `detail.duration` set to a number (the new duration in minutes),
 * `bubbles` set to `true`, and `composed` set to `true`, matching the
 * Rotary UI event contract exactly.
 */

describe("Feature: ui-mode-selection, Property 6: Event Contract Consistency", () => {
  const step = 15;
  const maxDuration = 240;

  // Generator: valid durations that are multiples of step within [step, maxDuration]
  const validDurationArb = fc
    .integer({ min: 1, max: maxDuration / step })
    .map((mult) => mult * step);

  // Generator: button action direction
  const buttonActionArb = fc.oneof(
    fc.constant("increment" as const),
    fc.constant("decrement" as const)
  );

  it("duration-changed event has detail.duration as number, bubbles: true, composed: true", async () => {
    await fc.assert(
      fc.asyncProperty(validDurationArb, buttonActionArb, async (duration, action) => {
        // Skip cases where the button would be disabled (no event fires)
        if (action === "increment" && duration >= maxDuration) return;
        if (action === "decrement" && duration <= step) return;

        // Create element
        const el = document.createElement("simple-timer-selector") as SimpleTimerSelector;
        el.duration = duration;
        el.maxDuration = maxDuration;
        el.stepSize = step;
        el.timerActive = false;

        document.body.appendChild(el);
        await el.updateComplete;

        // Capture the event
        let capturedEvent: CustomEvent | null = null;
        el.addEventListener("duration-changed", ((e: CustomEvent) => {
          capturedEvent = e;
        }) as EventListener);

        // Find and click the appropriate button
        const buttons = el.shadowRoot!.querySelectorAll("button");
        const targetButton =
          action === "decrement" ? buttons[0] : buttons[1];

        targetButton.click();

        // Verify event contract
        expect(capturedEvent).not.toBeNull();
        expect(typeof capturedEvent!.detail.duration).toBe("number");
        expect(capturedEvent!.bubbles).toBe(true);
        expect(capturedEvent!.composed).toBe(true);

        // Clean up
        document.body.removeChild(el);
      }),
      { numRuns: 100 }
    );
  });

  it("emitted duration is always a valid number (not NaN, not Infinity)", async () => {
    await fc.assert(
      fc.asyncProperty(validDurationArb, buttonActionArb, async (duration, action) => {
        // Skip cases where the button would be disabled
        if (action === "increment" && duration >= maxDuration) return;
        if (action === "decrement" && duration <= step) return;

        const el = document.createElement("simple-timer-selector") as SimpleTimerSelector;
        el.duration = duration;
        el.maxDuration = maxDuration;
        el.stepSize = step;
        el.timerActive = false;

        document.body.appendChild(el);
        await el.updateComplete;

        let capturedEvent: CustomEvent | null = null;
        el.addEventListener("duration-changed", ((e: CustomEvent) => {
          capturedEvent = e;
        }) as EventListener);

        const buttons = el.shadowRoot!.querySelectorAll("button");
        const targetButton =
          action === "decrement" ? buttons[0] : buttons[1];

        targetButton.click();

        expect(capturedEvent).not.toBeNull();
        expect(Number.isFinite(capturedEvent!.detail.duration)).toBe(true);
        expect(Number.isNaN(capturedEvent!.detail.duration)).toBe(false);

        document.body.removeChild(el);
      }),
      { numRuns: 100 }
    );
  });
});
