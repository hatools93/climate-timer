// Feature: ui-mode-selection, Property 8: Editor Config-Changed Event Completeness
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { ClimateTimerCardEditor } from "../components/climate-timer-card-editor";
import { ClimateTimerCardConfig } from "../types";
import { HomeAssistant } from "../ha-types";

// Register the custom element for testing
if (!customElements.get("climate-timer-card-editor")) {
  customElements.define("climate-timer-card-editor", ClimateTimerCardEditor);
}

function createMockHass(entities: Record<string, any> = {}): HomeAssistant {
  return {
    states: entities,
    callService: vi.fn().mockResolvedValue(undefined),
    connection: {},
  };
}

/**
 * **Validates: Requirements 2.2**
 *
 * Property 8: Editor Config-Changed Event Completeness
 *
 * For any valid card configuration and any UI mode selection change in the editor,
 * the fired config-changed CustomEvent's detail.config object SHALL contain all
 * existing configuration properties plus ui_mode set to the selected value,
 * with bubbles: true and composed: true.
 */

// Generator: arbitrary entity string (climate domain)
const entityArb = fc.stringMatching(/^climate\.[a-z_]{1,20}$/);

// Generator: arbitrary timer entity string (timer domain)
const timerEntityArb = fc.stringMatching(/^timer\.[a-z_]{1,20}$/);

// Generator: optional max_duration string
const maxDurationArb = fc.oneof(
  fc.constant(undefined),
  fc.constant("4h"),
  fc.constant("2h"),
  fc.constant("240m"),
  fc.constant("1h30m")
);

// Generator: optional step string
const stepArb = fc.oneof(
  fc.constant(undefined),
  fc.constant("15m"),
  fc.constant("30m"),
  fc.constant("5m"),
  fc.constant("1h")
);

// Generator: optional show_name boolean
const showNameArb = fc.oneof(
  fc.constant(undefined),
  fc.constant(true),
  fc.constant(false)
);

// Generator: optional show_state boolean
const showStateArb = fc.oneof(
  fc.constant(undefined),
  fc.constant(true),
  fc.constant(false)
);

// Generator: optional ui_mode (existing config may or may not have it)
const existingUiModeArb = fc.oneof(
  fc.constant(undefined),
  fc.constant("rotary" as const),
  fc.constant("simple" as const)
);

// Generator: the new ui_mode value to select
const newUiModeArb = fc.oneof(
  fc.constant("rotary" as const),
  fc.constant("simple" as const)
);

// Generator: full valid card config
const configArb = fc.record({
  type: fc.constant("custom:climate-timer-card"),
  entity: entityArb,
  timer_entity: timerEntityArb,
  max_duration: maxDurationArb,
  step: stepArb,
  show_name: showNameArb,
  show_state: showStateArb,
  ui_mode: existingUiModeArb,
}).map((rec) => {
  // Remove undefined keys to simulate realistic configs
  const config: Record<string, any> = {
    type: rec.type,
    entity: rec.entity,
    timer_entity: rec.timer_entity,
  };
  if (rec.max_duration !== undefined) config.max_duration = rec.max_duration;
  if (rec.step !== undefined) config.step = rec.step;
  if (rec.show_name !== undefined) config.show_name = rec.show_name;
  if (rec.show_state !== undefined) config.show_state = rec.show_state;
  if (rec.ui_mode !== undefined) config.ui_mode = rec.ui_mode;
  return config as ClimateTimerCardConfig;
});

describe("Feature: ui-mode-selection, Property 8: Editor Config-Changed Event Completeness", () => {
  let editor: ClimateTimerCardEditor;

  beforeEach(() => {
    editor = new ClimateTimerCardEditor();
    editor.hass = createMockHass({
      "climate.test": {
        entity_id: "climate.test",
        state: "off",
        attributes: { friendly_name: "Test" },
      },
      "timer.test": {
        entity_id: "timer.test",
        state: "idle",
        attributes: { friendly_name: "Test Timer" },
      },
    });
  });

  it("config-changed event contains all original properties plus ui_mode set to selected value", () => {
    fc.assert(
      fc.property(configArb, newUiModeArb, (config, newMode) => {
        editor.setConfig(config);

        const handler = vi.fn();
        editor.addEventListener("config-changed", handler as EventListener);

        // Simulate changing the ui_mode select
        (editor as any)._uiModeChanged({
          target: { value: newMode },
        } as any);

        expect(handler).toHaveBeenCalledTimes(1);
        const event = handler.mock.calls[0][0] as CustomEvent;
        const resultConfig = event.detail.config;

        // Verify all original properties are preserved
        expect(resultConfig.type).toBe(config.type);
        expect(resultConfig.entity).toBe(config.entity);
        expect(resultConfig.timer_entity).toBe(config.timer_entity);

        if (config.max_duration !== undefined) {
          expect(resultConfig.max_duration).toBe(config.max_duration);
        }
        if (config.step !== undefined) {
          expect(resultConfig.step).toBe(config.step);
        }
        if (config.show_name !== undefined) {
          expect(resultConfig.show_name).toBe(config.show_name);
        }
        if (config.show_state !== undefined) {
          expect(resultConfig.show_state).toBe(config.show_state);
        }

        // Verify ui_mode is set to the new selected value
        expect(resultConfig.ui_mode).toBe(newMode);

        // Clean up listener
        editor.removeEventListener("config-changed", handler as EventListener);
      }),
      { numRuns: 100 }
    );
  });

  it("config-changed event has bubbles: true and composed: true", () => {
    fc.assert(
      fc.property(configArb, newUiModeArb, (config, newMode) => {
        editor.setConfig(config);

        const handler = vi.fn();
        editor.addEventListener("config-changed", handler as EventListener);

        (editor as any)._uiModeChanged({
          target: { value: newMode },
        } as any);

        const event = handler.mock.calls[0][0] as CustomEvent;
        expect(event.bubbles).toBe(true);
        expect(event.composed).toBe(true);

        editor.removeEventListener("config-changed", handler as EventListener);
      }),
      { numRuns: 100 }
    );
  });

  it("config-changed event config does not lose any keys from original config", () => {
    fc.assert(
      fc.property(configArb, newUiModeArb, (config, newMode) => {
        editor.setConfig(config);

        const handler = vi.fn();
        editor.addEventListener("config-changed", handler as EventListener);

        (editor as any)._uiModeChanged({
          target: { value: newMode },
        } as any);

        const event = handler.mock.calls[0][0] as CustomEvent;
        const resultConfig = event.detail.config;

        // Every key in the original config should be present in the result
        for (const key of Object.keys(config)) {
          if (key === "ui_mode") {
            // ui_mode should be the new value
            expect(resultConfig.ui_mode).toBe(newMode);
          } else {
            expect(resultConfig[key]).toEqual((config as any)[key]);
          }
        }

        // Result must also have ui_mode
        expect(resultConfig).toHaveProperty("ui_mode");
        expect(resultConfig.ui_mode).toBe(newMode);

        editor.removeEventListener("config-changed", handler as EventListener);
      }),
      { numRuns: 100 }
    );
  });
});
