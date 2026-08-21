import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "../components/climate-timer-card";
import type { ClimateTimerCard } from "../components/climate-timer-card";
import type { HomeAssistant } from "../ha-types";

/**
 * Integration tests for the ClimateTimerCard full lifecycle.
 *
 * Validates: Requirements 3.3, 3.5, 5.1, 5.4, 6.2, 6.3, 7.2, 7.3, 7.4
 */

function createMockHass(overrides?: Partial<any>): HomeAssistant {
  return {
    states: {
      "climate.test_ac": {
        entity_id: "climate.test_ac",
        state: "off",
        attributes: {
          friendly_name: "Test AC",
          hvac_modes: ["off", "cool"],
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

describe("ClimateTimerCard Integration", () => {
  let el: ClimateTimerCard;

  beforeEach(async () => {
    el = createCard();
    document.body.appendChild(el);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    el.remove();
  });

  describe("Full start flow", () => {
    it("press start → climate.turn_on called → timer.start called → card shows countdown", async () => {
      // Set up card with idle timer and climate off
      el.hass = createMockHass();
      await el.updateComplete;

      // Verify start button is visible
      const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
      expect(startBtn).not.toBeNull();
      expect(startBtn.disabled).toBe(false);

      // Click start
      startBtn.click();

      // Wait for async service calls to complete
      await vi.waitFor(() => {
        expect(el.hass.callService).toHaveBeenCalledTimes(2);
      });

      // Verify climate.turn_on was called first (no persistent mode available, so turn_on without mode)
      expect(el.hass.callService).toHaveBeenNthCalledWith(
        1,
        "climate",
        "turn_on",
        {},
        { entity_id: "climate.test_ac" }
      );

      // Verify timer.start was called second with duration
      expect(el.hass.callService).toHaveBeenNthCalledWith(
        2,
        "timer",
        "start",
        { duration: "00:30:00" },
        { entity_id: "timer.test_timer" }
      );

      // Simulate HA state update: timer is now active
      const now = Date.now();
      const finishesAt = new Date(now + 30 * 60 * 1000).toISOString();
      el.hass = createMockHass({
        states: {
          "climate.test_ac": {
            entity_id: "climate.test_ac",
            state: "cool",
            attributes: {
              friendly_name: "Test AC",
              hvac_modes: ["off", "cool"],
              temperature: 24,
              current_temperature: 25,
            },
          },
          "timer.test_timer": {
            entity_id: "timer.test_timer",
            state: "active",
            attributes: {
              duration: "00:30:00",
              remaining: "00:30:00",
              finishes_at: finishesAt,
              friendly_name: "Test Timer",
              restore: false,
            },
          },
        },
      });
      await el.updateComplete;

      // Verify cancel button is now visible and start button is gone
      const cancelBtn = el.shadowRoot!.querySelector(".cancel-btn");
      const startBtnAfter = el.shadowRoot!.querySelector(".start-btn");
      expect(cancelBtn).not.toBeNull();
      expect(startBtnAfter).toBeNull();
    });
  });

  describe("Cancel flow", () => {
    it("press cancel → timer.cancel called → climate.turn_off called → card returns to idle", async () => {
      // Set up card with active timer
      const now = Date.now();
      const finishesAt = new Date(now + 15 * 60 * 1000).toISOString();
      el.hass = createMockHass({
        states: {
          "climate.test_ac": {
            entity_id: "climate.test_ac",
            state: "cool",
            attributes: {
              friendly_name: "Test AC",
              hvac_modes: ["off", "cool"],
              temperature: 24,
              current_temperature: 25,
            },
          },
          "timer.test_timer": {
            entity_id: "timer.test_timer",
            state: "active",
            attributes: {
              duration: "00:30:00",
              remaining: "00:15:00",
              finishes_at: finishesAt,
              friendly_name: "Test Timer",
              restore: false,
            },
          },
        },
      });
      await el.updateComplete;

      // Verify cancel button is visible
      const cancelBtn = el.shadowRoot!.querySelector(".cancel-btn") as HTMLButtonElement;
      expect(cancelBtn).not.toBeNull();

      // Click cancel
      cancelBtn.click();

      // Wait for async service calls
      await vi.waitFor(() => {
        expect(el.hass.callService).toHaveBeenCalledTimes(2);
      });

      // Verify timer.cancel was called first
      expect(el.hass.callService).toHaveBeenNthCalledWith(
        1,
        "timer",
        "cancel",
        {},
        { entity_id: "timer.test_timer" }
      );

      // Verify climate.turn_off was called second
      expect(el.hass.callService).toHaveBeenNthCalledWith(
        2,
        "climate",
        "turn_off",
        {},
        { entity_id: "climate.test_ac" }
      );

      // Simulate HA state update: timer goes idle, climate turns off
      el.hass = createMockHass();
      await el.updateComplete;

      // Verify card returns to idle state (start button visible)
      const startBtn = el.shadowRoot!.querySelector(".start-btn");
      const cancelBtnAfter = el.shadowRoot!.querySelector(".cancel-btn");
      expect(startBtn).not.toBeNull();
      expect(cancelBtnAfter).toBeNull();
    });
  });

  describe("Timer finish flow", () => {
    it("timer entity transitions to idle → card resets", async () => {
      // Set up card with active timer
      const now = Date.now();
      const finishesAt = new Date(now + 5 * 60 * 1000).toISOString();
      el.hass = createMockHass({
        states: {
          "climate.test_ac": {
            entity_id: "climate.test_ac",
            state: "cool",
            attributes: {
              friendly_name: "Test AC",
              hvac_modes: ["off", "cool"],
              temperature: 24,
              current_temperature: 25,
            },
          },
          "timer.test_timer": {
            entity_id: "timer.test_timer",
            state: "active",
            attributes: {
              duration: "00:30:00",
              remaining: "00:05:00",
              finishes_at: finishesAt,
              friendly_name: "Test Timer",
              restore: false,
            },
          },
        },
      });
      await el.updateComplete;

      // Verify card is in countdown state
      expect(el.shadowRoot!.querySelector(".cancel-btn")).not.toBeNull();

      // Simulate timer finishing (automation turns off climate, timer goes idle)
      el.hass = createMockHass({
        states: {
          "climate.test_ac": {
            entity_id: "climate.test_ac",
            state: "off",
            attributes: {
              friendly_name: "Test AC",
              hvac_modes: ["off", "cool"],
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
      });
      await el.updateComplete;

      // Verify card resets to idle state
      const startBtn = el.shadowRoot!.querySelector(".start-btn");
      const cancelBtn = el.shadowRoot!.querySelector(".cancel-btn");
      expect(startBtn).not.toBeNull();
      expect(cancelBtn).toBeNull();
    });
  });

  describe("Rollback flow", () => {
    it("climate.turn_on succeeds → timer.start fails → climate.turn_off called", async () => {
      // Set up callService to succeed for climate.turn_on but reject for timer.start
      let callCount = 0;
      const callService = vi.fn().mockImplementation(
        (domain: string, service: string) => {
          callCount++;
          if (domain === "timer" && service === "start") {
            return Promise.reject(new Error("Timer service unavailable"));
          }
          return Promise.resolve(undefined);
        }
      );

      el.hass = createMockHass({ callService });
      await el.updateComplete;

      // Click start
      const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
      startBtn.click();

      // Wait for all service calls to complete (turn_on, start fails, turn_off rollback)
      await vi.waitFor(() => {
        expect(callService).toHaveBeenCalledTimes(3);
      });

      // Verify the sequence: climate.turn_on → timer.start (fails) → climate.turn_off (rollback)
      expect(callService).toHaveBeenNthCalledWith(
        1,
        "climate",
        "turn_on",
        {},
        { entity_id: "climate.test_ac" }
      );
      expect(callService).toHaveBeenNthCalledWith(
        2,
        "timer",
        "start",
        { duration: "00:30:00" },
        { entity_id: "timer.test_timer" }
      );
      expect(callService).toHaveBeenNthCalledWith(
        3,
        "climate",
        "turn_off",
        {},
        { entity_id: "climate.test_ac" }
      );
    });
  });

  describe("External off", () => {
    it("climate state changes to 'off' during countdown → timer.cancel called → card resets", async () => {
      // Set up card with active timer
      const now = Date.now();
      const finishesAt = new Date(now + 20 * 60 * 1000).toISOString();
      el.hass = createMockHass({
        states: {
          "climate.test_ac": {
            entity_id: "climate.test_ac",
            state: "cool",
            attributes: {
              friendly_name: "Test AC",
              hvac_modes: ["off", "cool"],
              temperature: 24,
              current_temperature: 25,
            },
          },
          "timer.test_timer": {
            entity_id: "timer.test_timer",
            state: "active",
            attributes: {
              duration: "00:30:00",
              remaining: "00:20:00",
              finishes_at: finishesAt,
              friendly_name: "Test Timer",
              restore: false,
            },
          },
        },
      });
      await el.updateComplete;

      // Verify card is in countdown state
      expect(el.shadowRoot!.querySelector(".cancel-btn")).not.toBeNull();

      // Create a new callService mock for the second hass update
      const callService2 = vi.fn().mockResolvedValue(undefined);

      // Simulate climate turned off externally (state changes to "off" while timer still active)
      el.hass = createMockHass({
        states: {
          "climate.test_ac": {
            entity_id: "climate.test_ac",
            state: "off",
            attributes: {
              friendly_name: "Test AC",
              hvac_modes: ["off", "cool"],
              temperature: 24,
              current_temperature: 25,
            },
          },
          "timer.test_timer": {
            entity_id: "timer.test_timer",
            state: "active",
            attributes: {
              duration: "00:30:00",
              remaining: "00:20:00",
              finishes_at: finishesAt,
              friendly_name: "Test Timer",
              restore: false,
            },
          },
        },
        callService: callService2,
      });
      await el.updateComplete;

      // Verify timer.cancel was called due to external climate off
      expect(callService2).toHaveBeenCalledWith(
        "timer",
        "cancel",
        {},
        { entity_id: "timer.test_timer" }
      );
    });
  });

  describe("Unavailable handling", () => {
    it("entity becomes unavailable → start button disabled", async () => {
      // Set up card with climate entity unavailable
      el.hass = createMockHass({
        states: {
          "climate.test_ac": {
            entity_id: "climate.test_ac",
            state: "unavailable",
            attributes: {
              friendly_name: "Test AC",
              hvac_modes: ["off", "cool"],
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
      });
      await el.updateComplete;

      // Verify start button is disabled
      const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
      expect(startBtn).not.toBeNull();
      expect(startBtn.disabled).toBe(true);

      // Verify unavailable indicator is shown
      const unavailableIndicator = el.shadowRoot!.querySelector(".unavailable");
      expect(unavailableIndicator).not.toBeNull();
      expect(unavailableIndicator!.textContent).toContain("unavailable");
    });
  });
});


describe("ClimateTimerCard - _resolveHvacMode()", () => {
  let el: ClimateTimerCard;

  beforeEach(async () => {
    el = createCard();
    document.body.appendChild(el);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    el.remove();
  });

  it("returns attributes.last_mode when available and valid", async () => {
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
            last_mode: "cool",
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
    });
    await el.updateComplete;

    const result = (el as any)._resolveHvacMode();
    expect(result).toBe("cool");
  });

  it("skips attributes.last_mode when it is 'off'", async () => {
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
            last_mode: "off",
            hvac_mode: "heat",
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
    });
    await el.updateComplete;

    const result = (el as any)._resolveHvacMode();
    expect(result).toBe("heat");
  });

  it("skips attributes.last_mode when it is 'unavailable'", async () => {
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
            last_mode: "unavailable",
            hvac_mode: "dry",
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
    });
    await el.updateComplete;

    const result = (el as any)._resolveHvacMode();
    expect(result).toBe("dry");
  });

  it("falls through to attributes.hvac_mode when last_mode is absent", async () => {
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
            hvac_mode: "heat",
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
    });
    await el.updateComplete;

    const result = (el as any)._resolveHvacMode();
    expect(result).toBe("heat");
  });

  it("skips attributes.hvac_mode when it is 'off'", async () => {
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
            hvac_mode: "off",
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
    });
    await el.updateComplete;

    const result = (el as any)._resolveHvacMode();
    expect(result).toBeNull();
  });

  it("skips attributes.hvac_mode when it is 'unavailable'", async () => {
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
            hvac_mode: "unavailable",
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
    });
    await el.updateComplete;

    const result = (el as any)._resolveHvacMode();
    expect(result).toBeNull();
  });

  it("falls through to mode_helper state when no attributes available", async () => {
    el.setConfig({
      type: "custom:climate-timer-card",
      entity: "climate.test_ac",
      timer_entity: "timer.test_timer",
      mode_helper: "input_select.ac_mode",
    });
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
        "input_select.ac_mode": {
          entity_id: "input_select.ac_mode",
          state: "fan_only",
          attributes: { options: ["heat", "cool", "dry", "fan_only"] },
        },
      },
    });
    await el.updateComplete;

    const result = (el as any)._resolveHvacMode();
    expect(result).toBe("fan_only");
  });

  it("skips mode_helper when state is 'unknown'", async () => {
    el.setConfig({
      type: "custom:climate-timer-card",
      entity: "climate.test_ac",
      timer_entity: "timer.test_timer",
      mode_helper: "input_select.ac_mode",
    });
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
        "input_select.ac_mode": {
          entity_id: "input_select.ac_mode",
          state: "unknown",
          attributes: { options: ["heat", "cool", "dry", "fan_only"] },
        },
      },
    });
    await el.updateComplete;

    const result = (el as any)._resolveHvacMode();
    expect(result).toBeNull();
  });

  it("skips mode_helper when state is 'unavailable'", async () => {
    el.setConfig({
      type: "custom:climate-timer-card",
      entity: "climate.test_ac",
      timer_entity: "timer.test_timer",
      mode_helper: "input_select.ac_mode",
    });
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
        "input_select.ac_mode": {
          entity_id: "input_select.ac_mode",
          state: "unavailable",
          attributes: { options: ["heat", "cool", "dry", "fan_only"] },
        },
      },
    });
    await el.updateComplete;

    const result = (el as any)._resolveHvacMode();
    expect(result).toBeNull();
  });

  it("returns null when no source provides a valid mode", async () => {
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
    });
    await el.updateComplete;

    const result = (el as any)._resolveHvacMode();
    expect(result).toBeNull();
  });

  it("returns null when entity is not found in hass.states", async () => {
    el.hass = createMockHass({
      states: {
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
    });
    await el.updateComplete;

    const result = (el as any)._resolveHvacMode();
    expect(result).toBeNull();
  });

  it("priority order: last_mode takes precedence over hvac_mode which takes precedence over mode_helper", async () => {
    el.setConfig({
      type: "custom:climate-timer-card",
      entity: "climate.test_ac",
      timer_entity: "timer.test_timer",
      mode_helper: "input_select.ac_mode",
    });
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
            last_mode: "cool",
            hvac_mode: "heat",
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
        "input_select.ac_mode": {
          entity_id: "input_select.ac_mode",
          state: "dry",
          attributes: { options: ["heat", "cool", "dry", "fan_only"] },
        },
      },
    });
    await el.updateComplete;

    // last_mode should win over hvac_mode and mode_helper
    expect((el as any)._resolveHvacMode()).toBe("cool");

    // Now remove last_mode, hvac_mode should win over mode_helper
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
            hvac_mode: "heat",
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
        "input_select.ac_mode": {
          entity_id: "input_select.ac_mode",
          state: "dry",
          attributes: { options: ["heat", "cool", "dry", "fan_only"] },
        },
      },
    });
    await el.updateComplete;

    // hvac_mode should win over mode_helper
    expect((el as any)._resolveHvacMode()).toBe("heat");

    // Now remove hvac_mode too, mode_helper should be used
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
        "input_select.ac_mode": {
          entity_id: "input_select.ac_mode",
          state: "dry",
          attributes: { options: ["heat", "cool", "dry", "fan_only"] },
        },
      },
    });
    await el.updateComplete;

    // mode_helper should be used as last resort
    expect((el as any)._resolveHvacMode()).toBe("dry");
  });
});


describe("ClimateTimerCard - _handleStart() with _resolveHvacMode()", () => {
  let el: ClimateTimerCard;

  beforeEach(async () => {
    el = createCard();
    document.body.appendChild(el);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    el.remove();
  });

  it("entity off + attributes.last_mode = 'cool' → climate.set_hvac_mode called with 'cool' + timer.start called", async () => {
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
            last_mode: "cool",
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
    });
    await el.updateComplete;

    const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
    startBtn.click();

    await vi.waitFor(() => {
      expect(el.hass.callService).toHaveBeenCalledTimes(2);
    });

    // climate.set_hvac_mode called with resolved mode "cool"
    expect(el.hass.callService).toHaveBeenNthCalledWith(
      1,
      "climate",
      "set_hvac_mode",
      { hvac_mode: "cool" },
      { entity_id: "climate.test_ac" }
    );

    // timer.start called with duration
    expect(el.hass.callService).toHaveBeenNthCalledWith(
      2,
      "timer",
      "start",
      { duration: "00:30:00" },
      { entity_id: "timer.test_timer" }
    );
  });

  it("entity off + no attributes + no helper → climate.turn_on called (no mode) + timer.start called", async () => {
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "off",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
    });
    await el.updateComplete;

    const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
    startBtn.click();

    await vi.waitFor(() => {
      expect(el.hass.callService).toHaveBeenCalledTimes(2);
    });

    // climate.turn_on called without mode
    expect(el.hass.callService).toHaveBeenNthCalledWith(
      1,
      "climate",
      "turn_on",
      {},
      { entity_id: "climate.test_ac" }
    );

    // timer.start called with duration
    expect(el.hass.callService).toHaveBeenNthCalledWith(
      2,
      "timer",
      "start",
      { duration: "00:30:00" },
      { entity_id: "timer.test_timer" }
    );
  });

  it("entity already on ('cool') → only timer.start called (no climate call)", async () => {
    el.hass = createMockHass({
      states: {
        "climate.test_ac": {
          entity_id: "climate.test_ac",
          state: "cool",
          attributes: {
            friendly_name: "Test AC",
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
    });
    await el.updateComplete;

    const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
    startBtn.click();

    await vi.waitFor(() => {
      expect(el.hass.callService).toHaveBeenCalledTimes(1);
    });

    // Only timer.start called — no climate service call
    expect(el.hass.callService).toHaveBeenNthCalledWith(
      1,
      "timer",
      "start",
      { duration: "00:30:00" },
      { entity_id: "timer.test_timer" }
    );
  });

  it("entity off → climate.turn_on succeeds → timer.start fails → climate.turn_off called as rollback", async () => {
    const callService = vi.fn().mockImplementation(
      (domain: string, service: string) => {
        if (domain === "timer" && service === "start") {
          return Promise.reject(new Error("Timer service unavailable"));
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
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
      callService,
    });
    await el.updateComplete;

    const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
    startBtn.click();

    await vi.waitFor(() => {
      expect(callService).toHaveBeenCalledTimes(3);
    });

    // climate.turn_on succeeds
    expect(callService).toHaveBeenNthCalledWith(
      1,
      "climate",
      "turn_on",
      {},
      { entity_id: "climate.test_ac" }
    );

    // timer.start fails
    expect(callService).toHaveBeenNthCalledWith(
      2,
      "timer",
      "start",
      { duration: "00:30:00" },
      { entity_id: "timer.test_timer" }
    );

    // climate.turn_off called as rollback
    expect(callService).toHaveBeenNthCalledWith(
      3,
      "climate",
      "turn_off",
      {},
      { entity_id: "climate.test_ac" }
    );
  });

  it("entity off → climate.set_hvac_mode fails → error message shown, no timer.start call", async () => {
    const callService = vi.fn().mockImplementation(
      (domain: string, service: string) => {
        if (domain === "climate" && service === "set_hvac_mode") {
          return Promise.reject(new Error("Climate service unavailable"));
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
            hvac_modes: ["off", "cool", "heat"],
            temperature: 24,
            current_temperature: 25,
            last_mode: "cool",
          },
        },
        "timer.test_timer": {
          entity_id: "timer.test_timer",
          state: "idle",
          attributes: { duration: "00:30:00", remaining: "00:00:00", finishes_at: "", friendly_name: "Test Timer", restore: false },
        },
      },
      callService,
    });
    await el.updateComplete;

    const startBtn = el.shadowRoot!.querySelector(".start-btn") as HTMLButtonElement;
    startBtn.click();

    // Wait for the climate call to fail
    await vi.waitFor(() => {
      expect(callService).toHaveBeenCalledTimes(1);
    });

    // Only the climate.set_hvac_mode was called (and it failed)
    expect(callService).toHaveBeenNthCalledWith(
      1,
      "climate",
      "set_hvac_mode",
      { hvac_mode: "cool" },
      { entity_id: "climate.test_ac" }
    );

    // timer.start was never called
    expect(callService).not.toHaveBeenCalledWith(
      "timer",
      "start",
      expect.anything(),
      expect.anything()
    );

    // Error message is displayed
    await el.updateComplete;
    const errorEl = el.shadowRoot!.querySelector(".error");
    expect(errorEl).not.toBeNull();
    expect(errorEl!.textContent).toContain("Failed to turn on climate entity");
  });
});


describe("ClimateTimerCard - UI Mode Rendering", () => {
  let el: ClimateTimerCard;

  function createCardWithMode(uiMode?: string): ClimateTimerCard {
    const card = document.createElement("climate-timer-card") as ClimateTimerCard;
    const config: any = {
      type: "custom:climate-timer-card",
      entity: "climate.test_ac",
      timer_entity: "timer.test_timer",
    };
    if (uiMode !== undefined) {
      config.ui_mode = uiMode;
    }
    card.setConfig(config);
    return card;
  }

  afterEach(() => {
    if (el) el.remove();
    vi.restoreAllMocks();
  });

  it("renders <timer-selector> when ui_mode is 'rotary'", async () => {
    el = createCardWithMode("rotary");
    document.body.appendChild(el);
    el.hass = createMockHass();
    await el.updateComplete;

    const timerSelector = el.shadowRoot!.querySelector("timer-selector");
    const simpleSelector = el.shadowRoot!.querySelector("simple-timer-selector");
    expect(timerSelector).not.toBeNull();
    expect(simpleSelector).toBeNull();
  });

  it("renders <timer-selector> when ui_mode is undefined (not set)", async () => {
    el = createCardWithMode(undefined);
    document.body.appendChild(el);
    el.hass = createMockHass();
    await el.updateComplete;

    const timerSelector = el.shadowRoot!.querySelector("timer-selector");
    const simpleSelector = el.shadowRoot!.querySelector("simple-timer-selector");
    expect(timerSelector).not.toBeNull();
    expect(simpleSelector).toBeNull();
  });

  it("renders <simple-timer-selector> when ui_mode is 'simple'", async () => {
    el = createCardWithMode("simple");
    document.body.appendChild(el);
    el.hass = createMockHass();
    await el.updateComplete;

    const simpleSelector = el.shadowRoot!.querySelector("simple-timer-selector");
    const timerSelector = el.shadowRoot!.querySelector("timer-selector");
    expect(simpleSelector).not.toBeNull();
    expect(timerSelector).toBeNull();
  });

  it("renders <timer-selector> when ui_mode is an invalid value (fallback)", async () => {
    el = createCardWithMode("invalid-value");
    document.body.appendChild(el);
    el.hass = createMockHass();
    await el.updateComplete;

    const timerSelector = el.shadowRoot!.querySelector("timer-selector");
    const simpleSelector = el.shadowRoot!.querySelector("simple-timer-selector");
    expect(timerSelector).not.toBeNull();
    expect(simpleSelector).toBeNull();
  });
});
