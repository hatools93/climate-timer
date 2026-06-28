import { describe, it, expect } from "vitest";
import {
  MIN_DURATION,
  MAX_DURATION,
  STEP,
  clampDuration,
  adjustDuration,
  minutesToHADuration,
  parseDurationToMs,
} from "../utils/duration-utils";

describe("duration-utils constants", () => {
  it("has correct constant values", () => {
    expect(MIN_DURATION).toBe(15);
    expect(MAX_DURATION).toBe(240);
    expect(STEP).toBe(15);
  });
});

describe("clampDuration", () => {
  it("returns the value unchanged when within bounds and already a multiple of STEP", () => {
    expect(clampDuration(30)).toBe(30);
    expect(clampDuration(15)).toBe(15);
    expect(clampDuration(240)).toBe(240);
  });

  it("clamps values below MIN_DURATION to MIN_DURATION", () => {
    expect(clampDuration(0)).toBe(MIN_DURATION);
    expect(clampDuration(1)).toBe(MIN_DURATION);
    expect(clampDuration(-10)).toBe(MIN_DURATION);
  });

  it("clamps values above MAX_DURATION to MAX_DURATION", () => {
    expect(clampDuration(300)).toBe(MAX_DURATION);
    expect(clampDuration(1000)).toBe(MAX_DURATION);
  });

  it("snaps to nearest multiple of STEP", () => {
    expect(clampDuration(20)).toBe(15);
    expect(clampDuration(23)).toBe(30);
    expect(clampDuration(37)).toBe(30);
    expect(clampDuration(38)).toBe(45);
    expect(clampDuration(50)).toBe(45);
    expect(clampDuration(53)).toBe(60);
  });
});

describe("adjustDuration", () => {
  it("increases by STEP when direction is up", () => {
    expect(adjustDuration(30, "up")).toBe(45);
    expect(adjustDuration(15, "up")).toBe(30);
  });

  it("decreases by STEP when direction is down", () => {
    expect(adjustDuration(30, "down")).toBe(15);
    expect(adjustDuration(45, "down")).toBe(30);
  });

  it("clamps at MAX_DURATION when adjusting up at the boundary", () => {
    expect(adjustDuration(240, "up")).toBe(240);
    expect(adjustDuration(225, "up")).toBe(240);
  });

  it("clamps at MIN_DURATION when adjusting down at the boundary", () => {
    expect(adjustDuration(15, "down")).toBe(15);
    expect(adjustDuration(30, "down")).toBe(15);
  });
});

describe("minutesToHADuration", () => {
  it("converts minutes less than 60 to HH:MM:SS format", () => {
    expect(minutesToHADuration(5)).toBe("00:05:00");
    expect(minutesToHADuration(30)).toBe("00:30:00");
    expect(minutesToHADuration(59)).toBe("00:59:00");
  });

  it("converts minutes equal to or greater than 60", () => {
    expect(minutesToHADuration(60)).toBe("01:00:00");
    expect(minutesToHADuration(90)).toBe("01:30:00");
    expect(minutesToHADuration(120)).toBe("02:00:00");
    expect(minutesToHADuration(480)).toBe("08:00:00");
  });

  it("handles zero and negative by flooring to 0", () => {
    expect(minutesToHADuration(0)).toBe("00:00:00");
    expect(minutesToHADuration(-5)).toBe("00:00:00");
  });
});

describe("parseDurationToMs", () => {
  it("parses standard HH:MM:SS durations to milliseconds", () => {
    expect(parseDurationToMs("00:30:00")).toBe(1800000);
    expect(parseDurationToMs("01:30:00")).toBe(5400000);
    expect(parseDurationToMs("00:05:00")).toBe(300000);
    expect(parseDurationToMs("08:00:00")).toBe(28800000);
  });

  it("handles seconds in the duration", () => {
    expect(parseDurationToMs("00:00:01")).toBe(1000);
    expect(parseDurationToMs("00:01:30")).toBe(90000);
    expect(parseDurationToMs("01:01:01")).toBe(3661000);
  });

  it("handles zero duration", () => {
    expect(parseDurationToMs("00:00:00")).toBe(0);
  });
});
