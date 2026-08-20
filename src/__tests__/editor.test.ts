import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClimateTimerCardEditor } from "../components/climate-timer-card-editor";
import { HomeAssistant } from "../ha-types";
import { ClimateTimerCardConfig } from "../types";
import {
  filterClimateEntities,
  filterTimerEntities,
} from "../utils/entity-utils";

// Register the custom element for testing (the decorator may not fire in test env)
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

function createMockConfig(
  overrides: Partial<ClimateTimerCardConfig> = {}
): ClimateTimerCardConfig {
  return {
    type: "custom:climate-timer-card",
    entity: "climate.living_room_ac",
    timer_entity: "timer.climate_living_room_timer",
    ...overrides,
  };
}

describe("ClimateTimerCardEditor", () => {
  let editor: ClimateTimerCardEditor;

  beforeEach(() => {
    editor = new ClimateTimerCardEditor();
  });

  describe("setConfig", () => {
    it("stores the provided config", () => {
      const config = createMockConfig();
      editor.setConfig(config);

      // Access internal config via a known side effect: render uses it
      expect((editor as any)._config).toEqual(config);
    });

    it("creates a copy of the config (does not mutate original)", () => {
      const config = createMockConfig();
      editor.setConfig(config);

      config.entity = "climate.changed";
      expect((editor as any)._config.entity).toBe("climate.living_room_ac");
    });
  });

  describe("entity validation", () => {
    it("returns error when entity does not exist in hass.states", () => {
      editor.hass = createMockHass({
        "climate.bedroom": {
          entity_id: "climate.bedroom",
          state: "off",
          attributes: { friendly_name: "Bedroom AC" },
        },
      });
      editor.setConfig(createMockConfig({ entity: "climate.nonexistent" }));

      const error = (editor as any)._getEntityError();
      expect(error).toBe('Entity "climate.nonexistent" not found');
    });

    it("returns error when entity is not in climate domain", () => {
      editor.hass = createMockHass({
        "switch.fan": {
          entity_id: "switch.fan",
          state: "off",
          attributes: { friendly_name: "Fan" },
        },
      });
      editor.setConfig(createMockConfig({ entity: "switch.fan" }));

      const error = (editor as any)._getEntityError();
      expect(error).toBe(
        'Entity "switch.fan" is not a climate domain entity'
      );
    });

    it("returns null when entity is valid", () => {
      editor.hass = createMockHass({
        "climate.living_room_ac": {
          entity_id: "climate.living_room_ac",
          state: "off",
          attributes: { friendly_name: "Living Room AC" },
        },
      });
      editor.setConfig(createMockConfig());

      const error = (editor as any)._getEntityError();
      expect(error).toBeNull();
    });

    it("returns null when entity is empty (not yet selected)", () => {
      editor.hass = createMockHass({});
      editor.setConfig(createMockConfig({ entity: "" }));

      const error = (editor as any)._getEntityError();
      expect(error).toBeNull();
    });
  });

  describe("timer entity validation", () => {
    it("returns error when timer entity does not exist in hass.states", () => {
      editor.hass = createMockHass({
        "timer.other": {
          entity_id: "timer.other",
          state: "idle",
          attributes: { friendly_name: "Other Timer" },
        },
      });
      editor.setConfig(
        createMockConfig({ timer_entity: "timer.nonexistent" })
      );

      const error = (editor as any)._getTimerEntityError();
      expect(error).toBe('Entity "timer.nonexistent" not found');
    });

    it("returns error when timer entity is not in timer domain", () => {
      editor.hass = createMockHass({
        "input_number.duration": {
          entity_id: "input_number.duration",
          state: "30",
          attributes: { friendly_name: "Duration" },
        },
      });
      editor.setConfig(
        createMockConfig({ timer_entity: "input_number.duration" })
      );

      const error = (editor as any)._getTimerEntityError();
      expect(error).toBe(
        'Entity "input_number.duration" is not a timer domain entity'
      );
    });

    it("returns null when timer entity is valid", () => {
      editor.hass = createMockHass({
        "timer.climate_living_room_timer": {
          entity_id: "timer.climate_living_room_timer",
          state: "idle",
          attributes: { friendly_name: "Climate Timer" },
        },
      });
      editor.setConfig(createMockConfig());

      const error = (editor as any)._getTimerEntityError();
      expect(error).toBeNull();
    });

    it("returns null when timer entity is empty (not yet selected)", () => {
      editor.hass = createMockHass({});
      editor.setConfig(createMockConfig({ timer_entity: "" }));

      const error = (editor as any)._getTimerEntityError();
      expect(error).toBeNull();
    });
  });

  describe("config-changed event", () => {
    it("fires config-changed when climate entity changes", () => {
      editor.hass = createMockHass({
        "climate.living_room_ac": {
          entity_id: "climate.living_room_ac",
          state: "off",
          attributes: { friendly_name: "Living Room AC" },
        },
        "climate.bedroom": {
          entity_id: "climate.bedroom",
          state: "off",
          attributes: { friendly_name: "Bedroom AC" },
        },
      });
      editor.setConfig(createMockConfig());

      const handler = vi.fn();
      editor.addEventListener("config-changed", handler as EventListener);

      // Simulate a change event from the select element
      (editor as any)._entityChanged({
        target: { value: "climate.bedroom" },
      } as any);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.config.entity).toBe("climate.bedroom");
      expect(event.detail.config.timer_entity).toBe(
        "timer.climate_living_room_timer"
      );
    });

    it("fires config-changed when timer entity changes", () => {
      editor.hass = createMockHass({
        "timer.climate_living_room_timer": {
          entity_id: "timer.climate_living_room_timer",
          state: "idle",
          attributes: { friendly_name: "Climate Timer" },
        },
        "timer.bedroom_timer": {
          entity_id: "timer.bedroom_timer",
          state: "idle",
          attributes: { friendly_name: "Bedroom Timer" },
        },
      });
      editor.setConfig(createMockConfig());

      const handler = vi.fn();
      editor.addEventListener("config-changed", handler as EventListener);

      (editor as any)._timerEntityChanged({
        target: { value: "timer.bedroom_timer" },
      } as any);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.config.timer_entity).toBe("timer.bedroom_timer");
      expect(event.detail.config.entity).toBe("climate.living_room_ac");
    });

    it("fires config-changed with bubbles and composed", () => {
      editor.hass = createMockHass({});
      editor.setConfig(createMockConfig());

      const handler = vi.fn();
      editor.addEventListener("config-changed", handler as EventListener);

      (editor as any)._entityChanged({
        target: { value: "climate.new" },
      } as any);

      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  describe("UI mode control", () => {
    it("renders exactly two options ('Rotary' and 'Simple')", async () => {
      editor.hass = createMockHass({
        "climate.living_room_ac": {
          entity_id: "climate.living_room_ac",
          state: "off",
          attributes: { friendly_name: "Living Room AC" },
        },
        "timer.climate_living_room_timer": {
          entity_id: "timer.climate_living_room_timer",
          state: "idle",
          attributes: { friendly_name: "Climate Timer" },
        },
      });
      editor.setConfig(createMockConfig());

      // Trigger render
      document.body.appendChild(editor);
      await editor.updateComplete;

      const uiModeSelect = editor.shadowRoot!.querySelector(
        "#ui_mode"
      ) as HTMLSelectElement;
      expect(uiModeSelect).not.toBeNull();

      const options = uiModeSelect.querySelectorAll("option");
      expect(options.length).toBe(2);
      expect(options[0].textContent!.trim()).toBe("Rotary");
      expect(options[0].value).toBe("rotary");
      expect(options[1].textContent!.trim()).toBe("Simple");
      expect(options[1].value).toBe("simple");

      document.body.removeChild(editor);
    });

    it("defaults selection to 'rotary' when ui_mode is undefined", async () => {
      editor.hass = createMockHass({
        "climate.living_room_ac": {
          entity_id: "climate.living_room_ac",
          state: "off",
          attributes: { friendly_name: "Living Room AC" },
        },
        "timer.climate_living_room_timer": {
          entity_id: "timer.climate_living_room_timer",
          state: "idle",
          attributes: { friendly_name: "Climate Timer" },
        },
      });
      // Config without ui_mode
      editor.setConfig(createMockConfig());

      document.body.appendChild(editor);
      await editor.updateComplete;

      const uiModeSelect = editor.shadowRoot!.querySelector(
        "#ui_mode"
      ) as HTMLSelectElement;
      expect(uiModeSelect.value).toBe("rotary");

      document.body.removeChild(editor);
    });

    it("reflects 'simple' when config has ui_mode set to 'simple'", async () => {
      editor.hass = createMockHass({
        "climate.living_room_ac": {
          entity_id: "climate.living_room_ac",
          state: "off",
          attributes: { friendly_name: "Living Room AC" },
        },
        "timer.climate_living_room_timer": {
          entity_id: "timer.climate_living_room_timer",
          state: "idle",
          attributes: { friendly_name: "Climate Timer" },
        },
      });
      editor.setConfig(createMockConfig({ ui_mode: "simple" }));

      document.body.appendChild(editor);
      await editor.updateComplete;

      const uiModeSelect = editor.shadowRoot!.querySelector(
        "#ui_mode"
      ) as HTMLSelectElement;
      expect(uiModeSelect.value).toBe("simple");

      document.body.removeChild(editor);
    });

    it("fires config-changed with correct ui_mode when selection changes", () => {
      editor.hass = createMockHass({
        "climate.living_room_ac": {
          entity_id: "climate.living_room_ac",
          state: "off",
          attributes: { friendly_name: "Living Room AC" },
        },
        "timer.climate_living_room_timer": {
          entity_id: "timer.climate_living_room_timer",
          state: "idle",
          attributes: { friendly_name: "Climate Timer" },
        },
      });
      editor.setConfig(createMockConfig());

      const handler = vi.fn();
      editor.addEventListener("config-changed", handler as EventListener);

      // Simulate changing ui_mode to "simple"
      (editor as any)._uiModeChanged({
        target: { value: "simple" },
      } as any);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.config.ui_mode).toBe("simple");
      // Ensure other config properties are preserved
      expect(event.detail.config.entity).toBe("climate.living_room_ac");
      expect(event.detail.config.timer_entity).toBe(
        "timer.climate_living_room_timer"
      );
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it("fires config-changed with 'rotary' when switching back from 'simple'", () => {
      editor.hass = createMockHass({
        "climate.living_room_ac": {
          entity_id: "climate.living_room_ac",
          state: "off",
          attributes: { friendly_name: "Living Room AC" },
        },
        "timer.climate_living_room_timer": {
          entity_id: "timer.climate_living_room_timer",
          state: "idle",
          attributes: { friendly_name: "Climate Timer" },
        },
      });
      editor.setConfig(createMockConfig({ ui_mode: "simple" }));

      const handler = vi.fn();
      editor.addEventListener("config-changed", handler as EventListener);

      // Simulate changing ui_mode back to "rotary"
      (editor as any)._uiModeChanged({
        target: { value: "rotary" },
      } as any);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.config.ui_mode).toBe("rotary");
    });
  });

  describe("entity dropdown filtering", () => {
    it("only lists climate entities in the climate dropdown", () => {
      editor.hass = createMockHass({
        "climate.ac": {
          entity_id: "climate.ac",
          state: "off",
          attributes: { friendly_name: "AC" },
        },
        "light.lamp": {
          entity_id: "light.lamp",
          state: "on",
          attributes: { friendly_name: "Lamp" },
        },
        "climate.heater": {
          entity_id: "climate.heater",
          state: "heat",
          attributes: { friendly_name: "Heater" },
        },
        "timer.my_timer": {
          entity_id: "timer.my_timer",
          state: "idle",
          attributes: { friendly_name: "My Timer" },
        },
      });
      editor.setConfig(createMockConfig({ entity: "" }));

      const result = filterClimateEntities(editor.hass.states);
      expect(result).toEqual(["climate.ac", "climate.heater"]);
    });

    it("only lists timer entities in the timer dropdown", () => {
      editor.hass = createMockHass({
        "climate.ac": {
          entity_id: "climate.ac",
          state: "off",
          attributes: { friendly_name: "AC" },
        },
        "timer.timer1": {
          entity_id: "timer.timer1",
          state: "idle",
          attributes: { friendly_name: "Timer 1" },
        },
        "timer.timer2": {
          entity_id: "timer.timer2",
          state: "idle",
          attributes: { friendly_name: "Timer 2" },
        },
      });
      editor.setConfig(createMockConfig({ timer_entity: "" }));

      const result = filterTimerEntities(editor.hass.states);
      expect(result).toEqual(["timer.timer1", "timer.timer2"]);
    });
  });
});
