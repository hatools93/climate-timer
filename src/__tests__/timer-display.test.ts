import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "../components/timer-display";
import type { TimerDisplay } from "../components/timer-display";

/**
 * Unit tests for the TimerDisplay component.
 *
 * Validates: Requirements 4.1, 4.3
 */

describe("TimerDisplay", () => {
  let el: TimerDisplay;

  beforeEach(() => {
    el = document.createElement("timer-display") as TimerDisplay;
    document.body.appendChild(el);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.removeChild(el);
  });

  describe("active with future finishesAt", () => {
    it('displays remaining time in "MM:SS" format', async () => {
      const now = 1700000000000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      // Set finishesAt 5 minutes (300000ms) in the future
      el.active = true;
      el.finishesAt = new Date(now + 300000).toISOString();
      el.durationStr = "00:05:00";

      await el.updateComplete;

      const countdownText = el.shadowRoot!.querySelector(".countdown-text");
      expect(countdownText).not.toBeNull();
      // Should match MM:SS format (e.g. "05:00" or "04:59" depending on ms precision)
      expect(countdownText!.textContent).toMatch(/^\d{2}:\d{2}$/);
      // Should show approximately 5 minutes remaining
      expect(countdownText!.textContent).toBe("05:00");
    });

    it("displays correct time for a partial countdown", async () => {
      const now = 1700000000000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      // Timer started 2 minutes ago, total duration is 5 minutes, 3 minutes remain
      el.active = true;
      el.finishesAt = new Date(now + 180000).toISOString(); // 3 minutes from now
      el.durationStr = "00:05:00";

      await el.updateComplete;

      const countdownText = el.shadowRoot!.querySelector(".countdown-text");
      expect(countdownText).not.toBeNull();
      expect(countdownText!.textContent).toBe("03:00");
    });
  });

  describe("finishesAt in the past", () => {
    it('displays "00:00" when finishesAt is in the past', async () => {
      const now = 1700000000000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      el.active = true;
      el.finishesAt = new Date(now - 60000).toISOString(); // 1 minute in the past
      el.durationStr = "00:05:00";

      await el.updateComplete;

      const countdownText = el.shadowRoot!.querySelector(".countdown-text");
      expect(countdownText).not.toBeNull();
      expect(countdownText!.textContent).toBe("00:00");
    });
  });

  describe("progress animation fraction", () => {
    it("shows full ring offset when timer just started (fraction ≈ 0)", async () => {
      const now = 1700000000000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      // Timer just started: finishesAt is exactly the full duration away
      el.active = true;
      el.finishesAt = new Date(now + 300000).toISOString(); // 5 min from now
      el.durationStr = "00:05:00"; // total = 5 min

      await el.updateComplete;

      const progressCircle = el.shadowRoot!.querySelector(
        ".progress-ring__progress"
      );
      expect(progressCircle).not.toBeNull();

      const offset = parseFloat(
        progressCircle!.getAttribute("stroke-dashoffset")!
      );
      const circumference = 2 * Math.PI * 44; // RADIUS = 44

      // fraction = 0 → offset = circumference * (1 - 0) = circumference
      expect(offset).toBeCloseTo(circumference, 1);
    });

    it("shows reduced offset when timer is halfway through", async () => {
      const now = 1700000000000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      // Timer is halfway through: 2.5 min remaining out of 5 min total
      el.active = true;
      el.finishesAt = new Date(now + 150000).toISOString(); // 2.5 min from now
      el.durationStr = "00:05:00"; // total = 5 min

      await el.updateComplete;

      const progressCircle = el.shadowRoot!.querySelector(
        ".progress-ring__progress"
      );
      expect(progressCircle).not.toBeNull();

      const offset = parseFloat(
        progressCircle!.getAttribute("stroke-dashoffset")!
      );
      const circumference = 2 * Math.PI * 44;

      // fraction = 0.5 → offset = circumference * (1 - 0.5) = circumference / 2
      expect(offset).toBeCloseTo(circumference / 2, 1);
    });

    it("shows zero offset when timer is finished (fraction = 1)", async () => {
      const now = 1700000000000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      // Timer is finished: finishesAt is in the past
      el.active = true;
      el.finishesAt = new Date(now - 60000).toISOString(); // 1 min in past
      el.durationStr = "00:05:00";

      await el.updateComplete;

      const progressCircle = el.shadowRoot!.querySelector(
        ".progress-ring__progress"
      );
      expect(progressCircle).not.toBeNull();

      const offset = parseFloat(
        progressCircle!.getAttribute("stroke-dashoffset")!
      );

      // fraction = 1 → offset = circumference * (1 - 1) = 0
      expect(offset).toBeCloseTo(0, 1);
    });
  });

  describe("inactive state", () => {
    it("renders nothing when active is false", async () => {
      el.active = false;
      el.finishesAt = new Date(Date.now() + 300000).toISOString();
      el.durationStr = "00:05:00";

      await el.updateComplete;

      // When inactive, nothing should be rendered in the shadow root content
      const timerDisplay = el.shadowRoot!.querySelector(".timer-display");
      expect(timerDisplay).toBeNull();
    });

    it("renders nothing when finishesAt is null even if active is true", async () => {
      el.active = true;
      el.finishesAt = null;
      el.durationStr = "00:05:00";

      await el.updateComplete;

      const timerDisplay = el.shadowRoot!.querySelector(".timer-display");
      expect(timerDisplay).toBeNull();
    });
  });
});
