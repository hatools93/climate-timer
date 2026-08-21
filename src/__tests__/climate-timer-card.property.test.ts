import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";
import "../components/climate-timer-card";
import type { ClimateTimerCard } from "../components/climate-timer-card";
import type { HomeAssistant } from "../ha-types";

/**
 * Property-Based Tests: Bug Condition Exploration - HVAC Mode Override on Timer Start
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2**
 *
 * These tests encode the EXPECTED (correct) behavior. They are designed to FAIL
 * on unfixed code, confirming the bug exists. Once the fix is implemented, they
 * should PASS, confirming the bug is resolved.
 *
 * Bug Condition: When entity_state != "heat" — specifically when entity is on in
 * a non-heat mode, or entity is off with a known last mode that is not "heat",
 * the system should preserve the HVAC mode rather than overriding it with "heat".
 */

function createMockHass(overrides?: Partial<any>): HomeAssistant {
  return {
    states: {
      "climate.test_ac": {
        entity_id: "climate.test_ac",
        state: "off",
        attributes: {
          friendly_name: "Test AC",
          hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
          temperature: 24,
          current_temperature: 25,
        },
      },
      "timer.test_timer": {
        entity_id: "timer.test_timer",
        state: "idle",
        attributes: {
          duration: "00:30:00",
          remaining: "00:00:00",
          finishes_at: "",
          friendly_name: "Test Timer",
          restore: false,
        },
      },
      ...overrides?.states,
    },
    callService: vi.fn().mockResolvedValue(undefined),
    connection: {},
    ...overrides,
  };
}

function createCard(): ClimateTimerCard {
  const el = document.createElement("climate-timer-card") as ClimateTimerCard;
  el.setConfig({
    type: "custom:climate-timer-card",
    entity: "climate.test_ac",
    timer_entity: "timer.test_timer",
  });
  return el;
}

describe("Property 1: Bug Condition - HVAC Mode Override on Timer Start", () => {
  let el: ClimateTimerCard;

  beforeEach(() => {
    el = createCard();
    document.body.appendChild(el);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    el.remove();
  });

  /**
   * Property: For all non-heat active HVAC modes, when entity is already on and
   * _handleStart() is called, the system should NOT call `climate.turn_on`
   * (preserving the current mode by taking no climate action).
   *
   * Bug condition: entity is already on in a non-heat mode.
   * Expected behavior: no climate.turn_on call (mode preserved by inaction).
   * Actual (buggy) behavior: climate.turn_on is called, resetting mode to "heat".
   *
   * **Validates: Requirements 1.1, 2.1**
   */
  it("should NOT call climate.turn_on when entity is already on in a non-heat mode", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("cool", "dry", "fan_only", "heat_cool", "auto"),
        async (activeMode) => {
          // Reset mocks for each iteration
          vi.restoreAllMocks();

          const callService = vi.fn().mockResolvedValue(undefined);

          // Set entity to active non-heat mode
          el.hass = createMockHass({
            states: {
              "climate.test_ac": {
                entity_id: "climate.test_ac",
                state: activeMode,
                attributes: {
                  friendly_name: "Test AC",
                  hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                  temperature: 24,
                  current_temperature: 25,
                },
              },
              "timer.test_timer": {
                entity_id: "timer.test_timer",
                state: "idle",
                attributes: {
                  duration: "00:30:00",
                  remaining: "00:00:00",
                  finishes_at: "",
                  friendly_name: "Test Timer",
                  restore: false,
                },
              },
            },
            callService,
          });
          await el.updateComplete;

          // Click start button to trigger _handleStart()
          const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
          expect(startBtn).not.toBeNull();
          startBtn.click();

          // Wait for service calls to complete
          await vi.waitFor(() => {
            expect(callService).toHaveBeenCalled();
          });

          // Assert: climate.turn_on should NOT have been called
          // The entity is already on — no climate service call should be made
          const climateTurnOnCalls = callService.mock.calls.filter(
            (call: any[]) => call[0] === "climate" && call[1] === "turn_on"
          );

          // BUG: On unfixed code, climate.turn_on IS called (overriding mode to "heat")
          // EXPECTED: climate.turn_on should NOT be called when entity is already active
          expect(climateTurnOnCalls).toHaveLength(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: For all non-heat modes, when entity is off with a tracked last-active
   * mode, _handleStart() should call `climate.set_hvac_mode` with that mode
   * (not `climate.turn_on` which defaults to "heat").
   *
   * Bug condition: entity is off, last known mode is not "heat".
   * Expected behavior: climate.set_hvac_mode called with the last known mode.
   * Actual (buggy) behavior: climate.turn_on is called, resetting mode to "heat".
   *
   * **Validates: Requirements 1.2, 1.3, 2.2**
   */
  it("should call climate.set_hvac_mode with last known mode when entity is off", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("cool", "dry", "fan_only", "heat_cool", "auto"),
        async (lastActiveMode) => {
          // Reset mocks for each iteration
          vi.restoreAllMocks();

          const callService = vi.fn().mockResolvedValue(undefined);

          // First, set entity to the active mode so the card can track it
          el.hass = createMockHass({
            states: {
              "climate.test_ac": {
                entity_id: "climate.test_ac",
                state: lastActiveMode,
                attributes: {
                  friendly_name: "Test AC",
                  hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                  temperature: 24,
                  current_temperature: 25,
                },
              },
              "timer.test_timer": {
                entity_id: "timer.test_timer",
                state: "idle",
                attributes: {
                  duration: "00:30:00",
                  remaining: "00:00:00",
                  finishes_at: "",
                  friendly_name: "Test Timer",
                  restore: false,
                },
              },
            },
            callService,
          });
          await el.updateComplete;

          // Now transition entity to "off" (simulating user turning off externally)
          // HA climate entities persist last_mode in attributes when off
          el.hass = createMockHass({
            states: {
              "climate.test_ac": {
                entity_id: "climate.test_ac",
                state: "off",
                attributes: {
                  friendly_name: "Test AC",
                  hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                  temperature: 24,
                  current_temperature: 25,
                  last_mode: lastActiveMode,
                },
              },
              "timer.test_timer": {
                entity_id: "timer.test_timer",
                state: "idle",
                attributes: {
                  duration: "00:30:00",
                  remaining: "00:00:00",
                  finishes_at: "",
                  friendly_name: "Test Timer",
                  restore: false,
                },
              },
            },
            callService,
          });
          await el.updateComplete;

          // Reset callService tracking after state transitions
          callService.mockClear();

          // Click start button to trigger _handleStart()
          const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
          expect(startBtn).not.toBeNull();
          startBtn.click();

          // Wait for service calls to complete
          await vi.waitFor(() => {
            expect(callService).toHaveBeenCalled();
          });

          // Assert: climate.set_hvac_mode should be called with the last active mode
          const setHvacModeCalls = callService.mock.calls.filter(
            (call: any[]) => call[0] === "climate" && call[1] === "set_hvac_mode"
          );

          // Assert: climate.turn_on should NOT be called
          const climateTurnOnCalls = callService.mock.calls.filter(
            (call: any[]) => call[0] === "climate" && call[1] === "turn_on"
          );

          // FIXED: climate.set_hvac_mode should be called with the mode from persistent attributes
          expect(climateTurnOnCalls).toHaveLength(0);
          expect(setHvacModeCalls).toHaveLength(1);
          expect(setHvacModeCalls[0][2]).toEqual({ hvac_mode: lastActiveMode });
        }
      ),
      { numRuns: 20 }
    );
  });
});


/**
 * Property-Based Tests: Bug Condition - Persistent Mode Resolution After Card Reload
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3**
 *
 * These tests encode the EXPECTED (correct) behavior for the card reload scenario.
 * They are designed to FAIL on unfixed code, confirming the bug exists.
 *
 * Bug Condition: When the card is freshly loaded (simulating reload/navigation) and
 * the entity is already "off", the in-memory `_lastActiveHvacMode` is null because
 * it was never populated. The system should resolve the mode from persistent sources
 * (entity attributes → mode_helper → climate.turn_on fallback) but instead always
 * calls `climate.set_hvac_mode` with hardcoded "heat".
 *
 * Key difference from "Property 1" above: those tests track mode in-memory first
 * (entity active → entity off). These tests simulate a FRESH card where entity is
 * already off at load time — in-memory state is never populated.
 */
describe("Property 1b: Bug Condition - Persistent Mode Resolution After Card Reload", () => {

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: For all HVAC modes available in entity `attributes.last_mode`, when card
   * is freshly loaded and entity is off, `_handleStart()` should call
   * `climate.set_hvac_mode` with the attribute value (not hardcoded "heat").
   *
   * Bug condition: card just loaded, entity off, attributes.last_mode has a valid mode.
   * Expected behavior: climate.set_hvac_mode called with attributes.last_mode value.
   * Actual (buggy) behavior: climate.set_hvac_mode called with "heat" because
   * _lastActiveHvacMode is null after reload, and the code does `?? "heat"`.
   *
   * **Validates: Requirements 1.1, 1.2, 2.1**
   */
  it("should resolve mode from entity attributes.last_mode on fresh card load (not hardcoded 'heat')", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("cool", "dry", "fan_only", "heat_cool", "auto"),
        async (lastMode) => {
          vi.restoreAllMocks();

          const callService = vi.fn().mockResolvedValue(undefined);

          // Create a FRESH card — simulating reload where in-memory state is gone
          const freshCard = document.createElement("climate-timer-card") as ClimateTimerCard;
          freshCard.setConfig({
            type: "custom:climate-timer-card",
            entity: "climate.test_ac",
            timer_entity: "timer.test_timer",
          });
          document.body.appendChild(freshCard);

          try {
            // Set entity to "off" with attributes.last_mode populated
            // This simulates the state HA provides after reload — entity off but
            // attributes retain the last mode used
            freshCard.hass = createMockHass({
              states: {
                "climate.test_ac": {
                  entity_id: "climate.test_ac",
                  state: "off",
                  attributes: {
                    friendly_name: "Test AC",
                    hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                    temperature: 24,
                    current_temperature: 25,
                    last_mode: lastMode,
                  },
                },
                "timer.test_timer": {
                  entity_id: "timer.test_timer",
                  state: "idle",
                  attributes: {
                    duration: "00:30:00",
                    remaining: "00:00:00",
                    finishes_at: "",
                    friendly_name: "Test Timer",
                    restore: false,
                  },
                },
              },
              callService,
            });
            await freshCard.updateComplete;

            // Click start button to trigger _handleStart()
            const startBtn = freshCard.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
            expect(startBtn).not.toBeNull();
            startBtn.click();

            // Wait for service calls to complete
            await vi.waitFor(() => {
              expect(callService).toHaveBeenCalled();
            });

            // Assert: climate.set_hvac_mode should be called with the attribute value
            const setHvacModeCalls = callService.mock.calls.filter(
              (call: any[]) => call[0] === "climate" && call[1] === "set_hvac_mode"
            );

            // EXPECTED: set_hvac_mode called with the last_mode attribute value
            // BUG: set_hvac_mode is called with "heat" because _lastActiveHvacMode is null after reload
            expect(setHvacModeCalls).toHaveLength(1);
            expect(setHvacModeCalls[0][2]).toEqual({ hvac_mode: lastMode });
          } finally {
            freshCard.remove();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: For all HVAC modes in `mode_helper` state (when no entity attributes
   * available), when card is freshly loaded and entity is off, `_handleStart()` should
   * call `climate.set_hvac_mode` with the helper state value.
   *
   * Bug condition: card just loaded, entity off, no attributes, mode_helper configured.
   * Expected behavior: climate.set_hvac_mode called with mode_helper state.
   * Actual (buggy) behavior: climate.set_hvac_mode called with "heat" — helper never consulted.
   *
   * **Validates: Requirements 1.3, 2.2**
   */
  it("should resolve mode from mode_helper when entity attributes are absent on fresh card load", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("cool", "dry", "fan_only", "heat_cool", "auto"),
        async (helperMode) => {
          vi.restoreAllMocks();

          const callService = vi.fn().mockResolvedValue(undefined);

          // Create a FRESH card with mode_helper configured
          const freshCard = document.createElement("climate-timer-card") as ClimateTimerCard;
          freshCard.setConfig({
            type: "custom:climate-timer-card",
            entity: "climate.test_ac",
            timer_entity: "timer.test_timer",
            mode_helper: "input_select.ac_last_mode",
          } as any);
          document.body.appendChild(freshCard);

          try {
            // Set entity to "off" WITHOUT last_mode/hvac_mode attributes,
            // but with mode_helper entity present in hass.states
            freshCard.hass = createMockHass({
              states: {
                "climate.test_ac": {
                  entity_id: "climate.test_ac",
                  state: "off",
                  attributes: {
                    friendly_name: "Test AC",
                    hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                    temperature: 24,
                    current_temperature: 25,
                    // No last_mode or hvac_mode attribute — simulates integrations
                    // that don't expose these attributes
                  },
                },
                "timer.test_timer": {
                  entity_id: "timer.test_timer",
                  state: "idle",
                  attributes: {
                    duration: "00:30:00",
                    remaining: "00:00:00",
                    finishes_at: "",
                    friendly_name: "Test Timer",
                    restore: false,
                  },
                },
                "input_select.ac_last_mode": {
                  entity_id: "input_select.ac_last_mode",
                  state: helperMode,
                  attributes: {
                    options: ["heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                    friendly_name: "AC Last Mode",
                  },
                },
              },
              callService,
            });
            await freshCard.updateComplete;

            // Click start button to trigger _handleStart()
            const startBtn = freshCard.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
            expect(startBtn).not.toBeNull();
            startBtn.click();

            // Wait for service calls to complete
            await vi.waitFor(() => {
              expect(callService).toHaveBeenCalled();
            });

            // Assert: climate.set_hvac_mode should be called with the helper mode
            const setHvacModeCalls = callService.mock.calls.filter(
              (call: any[]) => call[0] === "climate" && call[1] === "set_hvac_mode"
            );

            // EXPECTED: set_hvac_mode called with the mode_helper state
            // BUG: set_hvac_mode is called with "heat" — mode_helper is never consulted
            expect(setHvacModeCalls).toHaveLength(1);
            expect(setHvacModeCalls[0][2]).toEqual({ hvac_mode: helperMode });
          } finally {
            freshCard.remove();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: When no persistent source provides a mode (no entity attributes, no
   * mode_helper), `_handleStart()` should call `climate.turn_on` without specifying
   * a mode — letting Home Assistant decide the default.
   *
   * Bug condition: card just loaded, entity off, no attributes, no mode_helper.
   * Expected behavior: climate.turn_on called (no hvac_mode parameter).
   * Actual (buggy) behavior: climate.set_hvac_mode called with "heat" — hardcoded fallback.
   *
   * **Validates: Requirements 1.4, 2.3**
   */
  it("should call climate.turn_on without mode when no persistent source is available on fresh card load", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 240 }),
        async (durationMinutes) => {
          vi.restoreAllMocks();

          const callService = vi.fn().mockResolvedValue(undefined);

          // Create a FRESH card — no mode_helper configured
          const freshCard = document.createElement("climate-timer-card") as ClimateTimerCard;
          freshCard.setConfig({
            type: "custom:climate-timer-card",
            entity: "climate.test_ac",
            timer_entity: "timer.test_timer",
          });
          document.body.appendChild(freshCard);

          try {
            // Set entity to "off" WITHOUT any mode attributes and no mode_helper
            freshCard.hass = createMockHass({
              states: {
                "climate.test_ac": {
                  entity_id: "climate.test_ac",
                  state: "off",
                  attributes: {
                    friendly_name: "Test AC",
                    hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                    temperature: 24,
                    current_temperature: 25,
                    // No last_mode, no hvac_mode attributes
                  },
                },
                "timer.test_timer": {
                  entity_id: "timer.test_timer",
                  state: "idle",
                  attributes: {
                    duration: "00:30:00",
                    remaining: "00:00:00",
                    finishes_at: "",
                    friendly_name: "Test Timer",
                    restore: false,
                  },
                },
              },
              callService,
            });
            await freshCard.updateComplete;

            // Set duration
            (freshCard as any)._selectedDuration = durationMinutes;
            await freshCard.updateComplete;

            // Click start button to trigger _handleStart()
            const startBtn = freshCard.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
            expect(startBtn).not.toBeNull();
            startBtn.click();

            // Wait for service calls to complete
            await vi.waitFor(() => {
              expect(callService).toHaveBeenCalled();
            });

            // Assert: climate.turn_on should be called WITHOUT specifying a mode
            const climateTurnOnCalls = callService.mock.calls.filter(
              (call: any[]) => call[0] === "climate" && call[1] === "turn_on"
            );

            // Assert: climate.set_hvac_mode should NOT be called
            const setHvacModeCalls = callService.mock.calls.filter(
              (call: any[]) => call[0] === "climate" && call[1] === "set_hvac_mode"
            );

            // EXPECTED: climate.turn_on called (no mode), climate.set_hvac_mode NOT called
            // BUG: climate.set_hvac_mode IS called with "heat" — hardcoded fallback instead of turn_on
            expect(setHvacModeCalls).toHaveLength(0);
            expect(climateTurnOnCalls).toHaveLength(1);
            expect(climateTurnOnCalls[0][2]).toEqual({});
          } finally {
            freshCard.remove();
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});


/**
 * Property-Based Tests: Preservation - Timer Lifecycle and Active-Entity Behavior
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.5, 3.6**
 *
 * These tests capture observed baseline behavior on UNFIXED code that must be
 * preserved after the fix is implemented. They verify that:
 * - Entity already on in ANY active mode: no climate service call, only timer.start with selected duration
 * - For any valid duration: timer is always started with that exact duration formatted as HH:MM:SS
 * - When timer start fails and entity was off: rollback always calls climate.turn_off
 *
 * These tests should PASS on unfixed code and continue to PASS after the fix.
 */

import { minutesToHADuration } from "../utils/duration-utils";

describe("Property 2: Preservation - Timer Lifecycle and Active-Entity Behavior", () => {
  let el: ClimateTimerCard;

  beforeEach(() => {
    el = createCard();
    document.body.appendChild(el);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    el.remove();
  });

  /**
   * Property: For entity already on in ANY active mode (generated via fc.constantFrom),
   * _handleStart() results in only timer.start being called — no climate service call at all.
   *
   * When the entity is already on (heat, cool, dry, fan_only, heat_cool, auto),
   * the card should NOT make any climate service call — it just starts the timer.
   * This preserves the current HVAC mode by inaction.
   *
   * **Validates: Requirements 3.1, 3.2, 3.6**
   */
  it("should only call timer.start when entity is already on in ANY active mode (no climate call)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("heat", "cool", "dry", "fan_only", "heat_cool", "auto"),
        fc.integer({ min: 1, max: 240 }),
        async (activeMode, durationMinutes) => {
          vi.restoreAllMocks();

          const callService = vi.fn().mockResolvedValue(undefined);

          // Set entity to the active mode with idle timer
          el.hass = createMockHass({
            states: {
              "climate.test_ac": {
                entity_id: "climate.test_ac",
                state: activeMode,
                attributes: {
                  friendly_name: "Test AC",
                  hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                  temperature: 24,
                  current_temperature: 25,
                },
              },
              "timer.test_timer": {
                entity_id: "timer.test_timer",
                state: "idle",
                attributes: {
                  duration: "00:30:00",
                  remaining: "00:00:00",
                  finishes_at: "",
                  friendly_name: "Test Timer",
                  restore: false,
                },
              },
            },
            callService,
          });
          await el.updateComplete;

          // Set selected duration on the card
          (el as any)._selectedDuration = durationMinutes;
          await el.updateComplete;

          // Click start button
          const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
          expect(startBtn).not.toBeNull();
          startBtn.click();

          // Wait for service calls to complete (only 1 call: timer.start)
          await vi.waitFor(() => {
            expect(callService).toHaveBeenCalledTimes(1);
          });

          // Assert: only timer.start is called (entity already on, no climate call)
          const expectedDuration = minutesToHADuration(durationMinutes);
          expect(callService).toHaveBeenNthCalledWith(
            1,
            "timer",
            "start",
            { duration: expectedDuration },
            { entity_id: "timer.test_timer" }
          );

          // Assert: no climate service calls were made
          const climateCalls = callService.mock.calls.filter(
            (call: any[]) => call[0] === "climate"
          );
          expect(climateCalls).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: For any duration value (generated via fc.integer({min: 1, max: 240})),
   * the timer is always started with that exact duration formatted as HH:MM:SS.
   *
   * This verifies duration formatting consistency regardless of the mode or state.
   * When entity is off, some climate call is made first, then timer.start with the
   * correctly formatted duration.
   *
   * **Validates: Requirements 3.1, 3.3**
   */
  it("should always start timer with exact duration formatted as HH:MM:SS for any valid duration", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 240 }),
        async (durationMinutes) => {
          vi.restoreAllMocks();

          const callService = vi.fn().mockResolvedValue(undefined);

          // Set entity to "off" state (default) with idle timer
          el.hass = createMockHass({
            states: {
              "climate.test_ac": {
                entity_id: "climate.test_ac",
                state: "off",
                attributes: {
                  friendly_name: "Test AC",
                  hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                  temperature: 24,
                  current_temperature: 25,
                },
              },
              "timer.test_timer": {
                entity_id: "timer.test_timer",
                state: "idle",
                attributes: {
                  duration: "00:30:00",
                  remaining: "00:00:00",
                  finishes_at: "",
                  friendly_name: "Test Timer",
                  restore: false,
                },
              },
            },
            callService,
          });
          await el.updateComplete;

          // Set selected duration
          (el as any)._selectedDuration = durationMinutes;
          await el.updateComplete;

          // Click start
          const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
          expect(startBtn).not.toBeNull();
          startBtn.click();

          // Wait for timer.start call (second service call after climate.turn_on)
          await vi.waitFor(() => {
            expect(callService).toHaveBeenCalledTimes(2);
          });

          // Verify the timer.start call has the exact formatted duration
          const timerStartCall = callService.mock.calls.find(
            (call: any[]) => call[0] === "timer" && call[1] === "start"
          );
          expect(timerStartCall).toBeDefined();

          const expectedDuration = minutesToHADuration(durationMinutes);
          expect(timerStartCall![2]).toEqual({ duration: expectedDuration });

          // Verify format is always HH:MM:SS
          expect(expectedDuration).toMatch(/^\d{2}:\d{2}:00$/);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: When timer start fails and entity was off before start, rollback
   * always calls climate.turn_off.
   *
   * This tests that on ANY duration where timer.start rejects, the rollback
   * mechanism correctly calls climate.turn_off to undo the turn-on.
   * Observed on unfixed code: entity "off" → climate.turn_on (no persistent mode) → timer.start (fails) → climate.turn_off
   *
   * **Validates: Requirements 3.2, 3.5**
   */
  it("should always call climate.turn_off as rollback when timer.start fails", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 240 }),
        async (durationMinutes) => {
          vi.restoreAllMocks();

          // Mock: climate.set_hvac_mode succeeds, timer.start rejects
          const callService = vi.fn().mockImplementation(
            (domain: string, service: string) => {
              if (domain === "timer" && service === "start") {
                return Promise.reject(new Error("Timer service failed"));
              }
              return Promise.resolve(undefined);
            }
          );

          el.hass = createMockHass({
            states: {
              "climate.test_ac": {
                entity_id: "climate.test_ac",
                state: "off",
                attributes: {
                  friendly_name: "Test AC",
                  hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                  temperature: 24,
                  current_temperature: 25,
                },
              },
              "timer.test_timer": {
                entity_id: "timer.test_timer",
                state: "idle",
                attributes: {
                  duration: "00:30:00",
                  remaining: "00:00:00",
                  finishes_at: "",
                  friendly_name: "Test Timer",
                  restore: false,
                },
              },
            },
            callService,
          });
          await el.updateComplete;

          // Set selected duration
          (el as any)._selectedDuration = durationMinutes;
          await el.updateComplete;

          // Click start
          const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
          expect(startBtn).not.toBeNull();
          startBtn.click();

          // Wait for all service calls including rollback
          await vi.waitFor(() => {
            expect(callService).toHaveBeenCalledTimes(3);
          });

          // Assert call sequence: climate.turn_on → timer.start (fails) → climate.turn_off (rollback)
          expect(callService).toHaveBeenNthCalledWith(
            1,
            "climate",
            "turn_on",
            {},
            { entity_id: "climate.test_ac" }
          );

          const expectedDuration = minutesToHADuration(durationMinutes);
          expect(callService).toHaveBeenNthCalledWith(
            2,
            "timer",
            "start",
            { duration: expectedDuration },
            { entity_id: "timer.test_timer" }
          );

          expect(callService).toHaveBeenNthCalledWith(
            3,
            "climate",
            "turn_off",
            {},
            { entity_id: "climate.test_ac" }
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});


/**
 * Property-Based Tests: Mode Helper Sync - Cross-Device Mode Persistence
 *
 * **Validates: Requirements 2.4**
 *
 * These tests verify that when a climate entity transitions to an active HVAC mode
 * and `mode_helper` is configured, the system writes the active mode back to the
 * helper entity via `input_select.select_option`. This enables cross-device and
 * cross-reload persistence of the last-active mode.
 *
 * Key behaviors tested:
 * - Write-back occurs for all active HVAC modes when mode_helper is configured
 * - No write-back occurs when mode_helper is NOT configured
 * - Errors from input_select.select_option are swallowed (card continues normally)
 * - Various mode transitions (off→cool, heat→dry, off→auto) all trigger write-back
 */
describe("Property 3: Mode Helper Sync - Cross-Device Mode Persistence", () => {

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: For all valid HVAC modes (heat, cool, dry, fan_only, heat_cool, auto),
   * when climate transitions to that mode with mode_helper configured,
   * `input_select.select_option` is always called with the active mode.
   *
   * **Validates: Requirements 2.4**
   */
  it("should call input_select.select_option with active mode when mode_helper is configured", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("heat", "cool", "dry", "fan_only", "heat_cool", "auto"),
        async (activeMode) => {
          vi.restoreAllMocks();

          const callService = vi.fn().mockResolvedValue(undefined);

          // Create a card with mode_helper configured
          const card = document.createElement("climate-timer-card") as ClimateTimerCard;
          card.setConfig({
            type: "custom:climate-timer-card",
            entity: "climate.test_ac",
            timer_entity: "timer.test_timer",
            mode_helper: "input_select.ac_last_mode",
          } as any);
          document.body.appendChild(card);

          try {
            // Set initial state: entity is off
            card.hass = createMockHass({
              states: {
                "climate.test_ac": {
                  entity_id: "climate.test_ac",
                  state: "off",
                  attributes: {
                    friendly_name: "Test AC",
                    hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                    temperature: 24,
                    current_temperature: 25,
                  },
                },
                "timer.test_timer": {
                  entity_id: "timer.test_timer",
                  state: "idle",
                  attributes: {
                    duration: "00:30:00",
                    remaining: "00:00:00",
                    finishes_at: "",
                    friendly_name: "Test Timer",
                    restore: false,
                  },
                },
                "input_select.ac_last_mode": {
                  entity_id: "input_select.ac_last_mode",
                  state: "heat",
                  attributes: {
                    options: ["heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                    friendly_name: "AC Last Mode",
                  },
                },
              },
              callService,
            });
            await card.updateComplete;

            // Clear mock calls from initial render
            callService.mockClear();

            // Transition climate to the active mode
            card.hass = createMockHass({
              states: {
                "climate.test_ac": {
                  entity_id: "climate.test_ac",
                  state: activeMode,
                  attributes: {
                    friendly_name: "Test AC",
                    hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                    temperature: 24,
                    current_temperature: 25,
                  },
                },
                "timer.test_timer": {
                  entity_id: "timer.test_timer",
                  state: "idle",
                  attributes: {
                    duration: "00:30:00",
                    remaining: "00:00:00",
                    finishes_at: "",
                    friendly_name: "Test Timer",
                    restore: false,
                  },
                },
                "input_select.ac_last_mode": {
                  entity_id: "input_select.ac_last_mode",
                  state: "heat",
                  attributes: {
                    options: ["heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                    friendly_name: "AC Last Mode",
                  },
                },
              },
              callService,
            });
            await card.updateComplete;

            // Assert: input_select.select_option called with the active mode
            const selectOptionCalls = callService.mock.calls.filter(
              (call: any[]) => call[0] === "input_select" && call[1] === "select_option"
            );

            expect(selectOptionCalls).toHaveLength(1);
            expect(selectOptionCalls[0][2]).toEqual({ option: activeMode });
            expect(selectOptionCalls[0][3]).toEqual({ entity_id: "input_select.ac_last_mode" });
          } finally {
            card.remove();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test: When climate transitions to an active mode WITHOUT mode_helper configured,
   * NO input_select service call is made.
   *
   * **Validates: Requirements 2.4**
   */
  it("should NOT call input_select.select_option when mode_helper is NOT configured", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("heat", "cool", "dry", "fan_only", "heat_cool", "auto"),
        async (activeMode) => {
          vi.restoreAllMocks();

          const callService = vi.fn().mockResolvedValue(undefined);

          // Create a card WITHOUT mode_helper configured
          const card = document.createElement("climate-timer-card") as ClimateTimerCard;
          card.setConfig({
            type: "custom:climate-timer-card",
            entity: "climate.test_ac",
            timer_entity: "timer.test_timer",
            // No mode_helper
          });
          document.body.appendChild(card);

          try {
            // Set initial state: entity is off
            card.hass = createMockHass({
              states: {
                "climate.test_ac": {
                  entity_id: "climate.test_ac",
                  state: "off",
                  attributes: {
                    friendly_name: "Test AC",
                    hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                    temperature: 24,
                    current_temperature: 25,
                  },
                },
                "timer.test_timer": {
                  entity_id: "timer.test_timer",
                  state: "idle",
                  attributes: {
                    duration: "00:30:00",
                    remaining: "00:00:00",
                    finishes_at: "",
                    friendly_name: "Test Timer",
                    restore: false,
                  },
                },
              },
              callService,
            });
            await card.updateComplete;

            // Clear mock calls from initial render
            callService.mockClear();

            // Transition climate to the active mode
            card.hass = createMockHass({
              states: {
                "climate.test_ac": {
                  entity_id: "climate.test_ac",
                  state: activeMode,
                  attributes: {
                    friendly_name: "Test AC",
                    hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                    temperature: 24,
                    current_temperature: 25,
                  },
                },
                "timer.test_timer": {
                  entity_id: "timer.test_timer",
                  state: "idle",
                  attributes: {
                    duration: "00:30:00",
                    remaining: "00:00:00",
                    finishes_at: "",
                    friendly_name: "Test Timer",
                    restore: false,
                  },
                },
              },
              callService,
            });
            await card.updateComplete;

            // Assert: NO input_select service call was made
            const inputSelectCalls = callService.mock.calls.filter(
              (call: any[]) => call[0] === "input_select"
            );

            expect(inputSelectCalls).toHaveLength(0);
          } finally {
            card.remove();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test: When input_select.select_option fails, the card continues functioning
   * normally (error is swallowed, no exception propagated).
   *
   * **Validates: Requirements 2.4**
   */
  it("should continue functioning normally when input_select.select_option fails", async () => {
    vi.restoreAllMocks();

    const callService = vi.fn().mockImplementation(
      (domain: string, service: string) => {
        if (domain === "input_select" && service === "select_option") {
          return Promise.reject(new Error("Service call failed"));
        }
        return Promise.resolve(undefined);
      }
    );

    // Create a card with mode_helper configured
    const card = document.createElement("climate-timer-card") as ClimateTimerCard;
    card.setConfig({
      type: "custom:climate-timer-card",
      entity: "climate.test_ac",
      timer_entity: "timer.test_timer",
      mode_helper: "input_select.ac_last_mode",
    } as any);
    document.body.appendChild(card);

    try {
      // Set initial state: entity is off
      card.hass = createMockHass({
        states: {
          "climate.test_ac": {
            entity_id: "climate.test_ac",
            state: "off",
            attributes: {
              friendly_name: "Test AC",
              hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
              temperature: 24,
              current_temperature: 25,
            },
          },
          "timer.test_timer": {
            entity_id: "timer.test_timer",
            state: "idle",
            attributes: {
              duration: "00:30:00",
              remaining: "00:00:00",
              finishes_at: "",
              friendly_name: "Test Timer",
              restore: false,
            },
          },
          "input_select.ac_last_mode": {
            entity_id: "input_select.ac_last_mode",
            state: "heat",
            attributes: {
              options: ["heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
              friendly_name: "AC Last Mode",
            },
          },
        },
        callService,
      });
      await card.updateComplete;

      // Transition climate to "cool" — input_select.select_option will FAIL
      card.hass = createMockHass({
        states: {
          "climate.test_ac": {
            entity_id: "climate.test_ac",
            state: "cool",
            attributes: {
              friendly_name: "Test AC",
              hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
              temperature: 24,
              current_temperature: 25,
            },
          },
          "timer.test_timer": {
            entity_id: "timer.test_timer",
            state: "idle",
            attributes: {
              duration: "00:30:00",
              remaining: "00:00:00",
              finishes_at: "",
              friendly_name: "Test Timer",
              restore: false,
            },
          },
          "input_select.ac_last_mode": {
            entity_id: "input_select.ac_last_mode",
            state: "heat",
            attributes: {
              options: ["heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
              friendly_name: "AC Last Mode",
            },
          },
        },
        callService,
      });
      await card.updateComplete;

      // Wait a tick for async rejection to be swallowed
      await new Promise(resolve => setTimeout(resolve, 10));

      // Card should still render normally — verify start button is present
      const startBtn = card.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
      expect(startBtn).not.toBeNull();

      // Card should still be responsive — the error was swallowed
      expect(card.shadowRoot!.querySelector(".error")).toBeNull();
    } finally {
      card.remove();
    }
  });

  /**
   * Test mode change scenarios: off→cool, heat→dry, off→auto — all should write back.
   *
   * **Validates: Requirements 2.4**
   */
  it("should write-back for mode change scenarios: off→cool, heat→dry, off→auto", async () => {
    const scenarios: Array<{ from: string; to: string }> = [
      { from: "off", to: "cool" },
      { from: "heat", to: "dry" },
      { from: "off", to: "auto" },
    ];

    for (const scenario of scenarios) {
      vi.restoreAllMocks();

      const callService = vi.fn().mockResolvedValue(undefined);

      const card = document.createElement("climate-timer-card") as ClimateTimerCard;
      card.setConfig({
        type: "custom:climate-timer-card",
        entity: "climate.test_ac",
        timer_entity: "timer.test_timer",
        mode_helper: "input_select.ac_last_mode",
      } as any);
      document.body.appendChild(card);

      try {
        // Set initial state to `from`
        card.hass = createMockHass({
          states: {
            "climate.test_ac": {
              entity_id: "climate.test_ac",
              state: scenario.from,
              attributes: {
                friendly_name: "Test AC",
                hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                temperature: 24,
                current_temperature: 25,
              },
            },
            "timer.test_timer": {
              entity_id: "timer.test_timer",
              state: "idle",
              attributes: {
                duration: "00:30:00",
                remaining: "00:00:00",
                finishes_at: "",
                friendly_name: "Test Timer",
                restore: false,
              },
            },
            "input_select.ac_last_mode": {
              entity_id: "input_select.ac_last_mode",
              state: "heat",
              attributes: {
                options: ["heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                friendly_name: "AC Last Mode",
              },
            },
          },
          callService,
        });
        await card.updateComplete;

        // Clear calls from initial render (the "from" state may trigger write-back if active)
        callService.mockClear();

        // Transition to `to` state
        card.hass = createMockHass({
          states: {
            "climate.test_ac": {
              entity_id: "climate.test_ac",
              state: scenario.to,
              attributes: {
                friendly_name: "Test AC",
                hvac_modes: ["off", "heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                temperature: 24,
                current_temperature: 25,
              },
            },
            "timer.test_timer": {
              entity_id: "timer.test_timer",
              state: "idle",
              attributes: {
                duration: "00:30:00",
                remaining: "00:00:00",
                finishes_at: "",
                friendly_name: "Test Timer",
                restore: false,
              },
            },
            "input_select.ac_last_mode": {
              entity_id: "input_select.ac_last_mode",
              state: "heat",
              attributes: {
                options: ["heat", "cool", "dry", "fan_only", "heat_cool", "auto"],
                friendly_name: "AC Last Mode",
              },
            },
          },
          callService,
        });
        await card.updateComplete;

        // Assert: input_select.select_option called with the new active mode
        const selectOptionCalls = callService.mock.calls.filter(
          (call: any[]) => call[0] === "input_select" && call[1] === "select_option"
        );

        expect(selectOptionCalls.length).toBeGreaterThanOrEqual(1);
        // The last select_option call should have the target mode
        const lastCall = selectOptionCalls[selectOptionCalls.length - 1];
        expect(lastCall[2]).toEqual({ option: scenario.to });
        expect(lastCall[3]).toEqual({ entity_id: "input_select.ac_last_mode" });
      } finally {
        card.remove();
      }
    }
  });
});
