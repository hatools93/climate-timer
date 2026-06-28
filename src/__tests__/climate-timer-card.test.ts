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

      // Verify climate.turn_on was called first
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
