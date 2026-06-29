import { describe, it, expect } from "vitest";
import {
  filterClimateEntities,
  filterTimerEntities,
} from "../utils/entity-utils";

describe("filterClimateEntities", () => {
  it("returns only climate entity ids", () => {
    const entities = {
      "climate.living_room": { state: "cool" },
      "light.kitchen": { state: "on" },
      "climate.bedroom": { state: "heat" },
      "timer.my_timer": { state: "idle" },
    };
    expect(filterClimateEntities(entities)).toEqual([
      "climate.living_room",
      "climate.bedroom",
    ]);
  });

  it("returns an empty array when no climate entities exist", () => {
    const entities = {
      "light.kitchen": { state: "on" },
      "timer.my_timer": { state: "idle" },
    };
    expect(filterClimateEntities(entities)).toEqual([]);
  });

  it("returns an empty array for an empty entities record", () => {
    expect(filterClimateEntities({})).toEqual([]);
  });

  it("does not include entities with climate in the name but wrong domain", () => {
    const entities = {
      "sensor.climate_temperature": { state: "22" },
      "climate.office": { state: "off" },
    };
    expect(filterClimateEntities(entities)).toEqual(["climate.office"]);
  });
});

describe("filterTimerEntities", () => {
  it("returns only timer entity ids", () => {
    const entities = {
      "timer.climate_timer": { state: "idle" },
      "climate.living_room": { state: "cool" },
      "timer.sleep_timer": { state: "active" },
      "light.bedroom": { state: "off" },
    };
    expect(filterTimerEntities(entities)).toEqual([
      "timer.climate_timer",
      "timer.sleep_timer",
    ]);
  });

  it("returns an empty array when no timer entities exist", () => {
    const entities = {
      "climate.bedroom": { state: "heat" },
      "light.kitchen": { state: "on" },
    };
    expect(filterTimerEntities(entities)).toEqual([]);
  });

  it("returns an empty array for an empty entities record", () => {
    expect(filterTimerEntities({})).toEqual([]);
  });

  it("does not include entities with timer in the name but wrong domain", () => {
    const entities = {
      "sensor.timer_remaining": { state: "300" },
      "timer.kitchen": { state: "idle" },
    };
    expect(filterTimerEntities(entities)).toEqual(["timer.kitchen"]);
  });
});
