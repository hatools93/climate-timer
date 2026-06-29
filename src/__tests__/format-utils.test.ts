import { describe, it, expect } from "vitest";
import { formatDurationIdle, formatCountdown } from "../utils/format-utils";

describe("formatDurationIdle", () => {
  it("formats minutes below 60 as Xm", () => {
    expect(formatDurationIdle(5)).toBe("5m");
    expect(formatDurationIdle(30)).toBe("30m");
    expect(formatDurationIdle(59)).toBe("59m");
  });

  it("formats 60 minutes as 1h 0m", () => {
    expect(formatDurationIdle(60)).toBe("1h 0m");
  });

  it("formats minutes above 60 with hours and remainder", () => {
    expect(formatDurationIdle(90)).toBe("1h 30m");
    expect(formatDurationIdle(120)).toBe("2h 0m");
    expect(formatDurationIdle(480)).toBe("8h 0m");
  });
});

describe("formatCountdown", () => {
  it("formats 0 ms as 00:00", () => {
    expect(formatCountdown(0)).toBe("00:00");
  });

  it("formats milliseconds to zero-padded MM:SS", () => {
    expect(formatCountdown(61000)).toBe("01:01");
    expect(formatCountdown(300000)).toBe("05:00");
  });

  it("handles minutes exceeding 59", () => {
    expect(formatCountdown(3600000)).toBe("60:00");
    expect(formatCountdown(28800000)).toBe("480:00");
  });

  it("truncates sub-second remainders", () => {
    expect(formatCountdown(61999)).toBe("01:01");
    expect(formatCountdown(500)).toBe("00:00");
  });
});
