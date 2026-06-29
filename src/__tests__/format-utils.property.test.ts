// Feature: climate-timer-card, Property 3: Idle duration formatting
// Feature: climate-timer-card, Property 4: Countdown time formatting
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatDurationIdle, formatCountdown } from '../utils/format-utils';

/**
 * Validates: Requirements 2.8
 *
 * Property 3: Idle duration formatting
 * For any valid duration in minutes (5 ≤ m ≤ 480, multiple of 5), the idle format
 * function SHALL produce a string that omits hours when m < 60 (format: "{m}m")
 * and includes hours when m ≥ 60 (format: "{h}h {r}m" where h = floor(m/60) and
 * r = m mod 60).
 */

/** Generates valid durations: multiples of 5 in [5, 480] */
const durationArb = fc.integer({ min: 1, max: 96 }).map(n => n * 5);

describe('Idle duration formatting property tests (Property 3)', () => {
  it('should produce "{m}m" format when m < 60', () => {
    const subHourArb = fc.integer({ min: 1, max: 11 }).map(n => n * 5); // 5, 10, ..., 55
    fc.assert(
      fc.property(subHourArb, (m) => {
        const result = formatDurationIdle(m);
        expect(result).toBe(`${m}m`);
      }),
      { numRuns: 100 }
    );
  });

  it('should produce "{h}h {r}m" format when m >= 60', () => {
    const hourPlusArb = fc.integer({ min: 12, max: 96 }).map(n => n * 5); // 60, 65, ..., 480
    fc.assert(
      fc.property(hourPlusArb, (m) => {
        const result = formatDurationIdle(m);
        const h = Math.floor(m / 60);
        const r = m % 60;
        expect(result).toBe(`${h}h ${r}m`);
      }),
      { numRuns: 100 }
    );
  });

  it('should never contain "h" when m < 60', () => {
    const subHourArb = fc.integer({ min: 1, max: 11 }).map(n => n * 5);
    fc.assert(
      fc.property(subHourArb, (m) => {
        const result = formatDurationIdle(m);
        expect(result).not.toContain('h');
      }),
      { numRuns: 100 }
    );
  });

  it('should always contain "h" when m >= 60', () => {
    const hourPlusArb = fc.integer({ min: 12, max: 96 }).map(n => n * 5);
    fc.assert(
      fc.property(hourPlusArb, (m) => {
        const result = formatDurationIdle(m);
        expect(result).toContain('h');
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 4.1
 *
 * Property 4: Countdown time formatting
 * For any remaining time in milliseconds (0 ≤ ms ≤ 480 × 60 × 1000), the countdown
 * format function SHALL produce a string in "MM:SS" format where MM is zero-padded
 * total minutes and SS is zero-padded seconds, and parsing the output back to
 * milliseconds (at second precision) SHALL equal `floor(ms / 1000) * 1000`.
 */

/** Generates random millisecond values in [0, 28800000] (0 to 480 minutes) */
const msArb = fc.integer({ min: 0, max: 28800000 });

describe('Countdown time formatting property tests (Property 4)', () => {
  it('should produce output matching MM:SS regex pattern', () => {
    fc.assert(
      fc.property(msArb, (ms) => {
        const result = formatCountdown(ms);
        // MM is 2+ digit zero-padded, SS is exactly 2 digits
        expect(result).toMatch(/^\d{2,}:\d{2}$/);
      }),
      { numRuns: 100 }
    );
  });

  it('should round-trip: parsing MM:SS back to ms equals floor(ms/1000)*1000', () => {
    fc.assert(
      fc.property(msArb, (ms) => {
        const result = formatCountdown(ms);
        const [mmStr, ssStr] = result.split(':');
        const parsedMs = (parseInt(mmStr, 10) * 60 + parseInt(ssStr, 10)) * 1000;
        const expected = Math.floor(ms / 1000) * 1000;
        expect(parsedMs).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('should always produce SS in [0, 59]', () => {
    fc.assert(
      fc.property(msArb, (ms) => {
        const result = formatCountdown(ms);
        const ssStr = result.split(':')[1];
        const ss = parseInt(ssStr, 10);
        expect(ss).toBeGreaterThanOrEqual(0);
        expect(ss).toBeLessThanOrEqual(59);
      }),
      { numRuns: 100 }
    );
  });

  it('should satisfy MM*60 + SS = floor(ms/1000)', () => {
    fc.assert(
      fc.property(msArb, (ms) => {
        const result = formatCountdown(ms);
        const [mmStr, ssStr] = result.split(':');
        const mm = parseInt(mmStr, 10);
        const ss = parseInt(ssStr, 10);
        const totalSeconds = Math.floor(ms / 1000);
        expect(mm * 60 + ss).toBe(totalSeconds);
      }),
      { numRuns: 100 }
    );
  });
});
