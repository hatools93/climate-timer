import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../components/simple-timer-selector";
import { SimpleTimerSelector } from "../components/simple-timer-selector";

describe("SimpleTimerSelector - Idle State", () => {
  let el: SimpleTimerSelector;

  beforeEach(async () => {
    el = document.createElement("simple-timer-selector") as SimpleTimerSelector;
    el.duration = 30;
    el.maxDuration = 240;
    el.stepSize = 15;
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  describe("layout rendering", () => {
    it("should render a horizontal row with decrement, display, and increment", async () => {
      const container = el.shadowRoot!.querySelector(".capsule");
      expect(container).not.toBeNull();

      const buttons = el.shadowRoot!.querySelectorAll("button");
      expect(buttons.length).toBe(2);

      const display = el.shadowRoot!.querySelector(".duration-display");
      expect(display).not.toBeNull();
    });

    it("should display formatted duration using formatDurationIdle", async () => {
      el.duration = 30;
      await el.updateComplete;
      const display = el.shadowRoot!.querySelector(".duration-display");
      expect(display!.textContent).toBe("30m");
    });

    it("should display hours format for durations >= 60", async () => {
      el.duration = 90;
      await el.updateComplete;
      const display = el.shadowRoot!.querySelector(".duration-display");
      expect(display!.textContent).toBe("1h 30m");
    });

    it("should render decrement button with − symbol", async () => {
      const buttons = el.shadowRoot!.querySelectorAll("button");
      expect(buttons[0].textContent).toBe("−");
    });

    it("should render increment button with + symbol", async () => {
      const buttons = el.shadowRoot!.querySelectorAll("button");
      expect(buttons[1].textContent).toBe("+");
    });
  });

  describe("button disabled states", () => {
    it("should disable decrement button when duration <= stepSize", async () => {
      el.duration = 15;
      el.stepSize = 15;
      await el.updateComplete;

      const buttons = el.shadowRoot!.querySelectorAll("button");
      expect(buttons[0].disabled).toBe(true);
    });

    it("should disable increment button when duration >= maxDuration", async () => {
      el.duration = 240;
      el.maxDuration = 240;
      await el.updateComplete;

      const buttons = el.shadowRoot!.querySelectorAll("button");
      expect(buttons[1].disabled).toBe(true);
    });

    it("should enable both buttons when duration is between bounds", async () => {
      el.duration = 60;
      await el.updateComplete;

      const buttons = el.shadowRoot!.querySelectorAll("button");
      expect(buttons[0].disabled).toBe(false);
      expect(buttons[1].disabled).toBe(false);
    });
  });

  describe("increment click handler", () => {
    it("should fire duration-changed with incremented value", async () => {
      el.duration = 30;
      await el.updateComplete;

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        el.addEventListener("duration-changed", (e) => resolve(e as CustomEvent), { once: true });
      });

      const buttons = el.shadowRoot!.querySelectorAll("button");
      buttons[1].click();

      const event = await eventPromise;
      expect(event.detail.duration).toBe(45);
    });

    it("should clamp at maxDuration when near upper bound", async () => {
      el.duration = 225;
      el.maxDuration = 240;
      el.stepSize = 15;
      await el.updateComplete;

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        el.addEventListener("duration-changed", (e) => resolve(e as CustomEvent), { once: true });
      });

      const buttons = el.shadowRoot!.querySelectorAll("button");
      buttons[1].click();

      const event = await eventPromise;
      expect(event.detail.duration).toBe(240);
    });
  });

  describe("decrement click handler", () => {
    it("should fire duration-changed with decremented value", async () => {
      el.duration = 60;
      await el.updateComplete;

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        el.addEventListener("duration-changed", (e) => resolve(e as CustomEvent), { once: true });
      });

      const buttons = el.shadowRoot!.querySelectorAll("button");
      buttons[0].click();

      const event = await eventPromise;
      expect(event.detail.duration).toBe(45);
    });

    it("should clamp at stepSize when near lower bound", async () => {
      el.duration = 30;
      el.stepSize = 15;
      await el.updateComplete;

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        el.addEventListener("duration-changed", (e) => resolve(e as CustomEvent), { once: true });
      });

      const buttons = el.shadowRoot!.querySelectorAll("button");
      buttons[0].click();

      const event = await eventPromise;
      expect(event.detail.duration).toBe(15);
    });
  });

  describe("event contract", () => {
    it("should fire duration-changed with bubbles: true and composed: true", async () => {
      el.duration = 60;
      await el.updateComplete;

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        el.addEventListener("duration-changed", (e) => resolve(e as CustomEvent), { once: true });
      });

      const buttons = el.shadowRoot!.querySelectorAll("button");
      buttons[1].click();

      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
      expect(event.detail).toHaveProperty("duration");
      expect(typeof event.detail.duration).toBe("number");
    });
  });
});


describe("SimpleTimerSelector - Active State (Countdown)", () => {
  let el: SimpleTimerSelector;

  beforeEach(async () => {
    vi.useFakeTimers();
    el = document.createElement("simple-timer-selector") as SimpleTimerSelector;
    el.duration = 30;
    el.maxDuration = 240;
    el.stepSize = 15;
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
    vi.useRealTimers();
  });

  it("should show countdown when timerActive is true and finishesAt is set", async () => {
    // Set finishesAt to 5 minutes from now
    const finishesAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    el.timerActive = true;
    el.finishesAt = finishesAt;
    await el.updateComplete;

    const display = el.shadowRoot!.querySelector(".duration-display");
    // Should show countdown format (MM:SS), e.g., "05:00" or "04:59"
    expect(display!.textContent).toMatch(/^\d{2}:\d{2}$/);
  });

  it("should show '00:00' when remaining time reaches 0", async () => {
    // Set finishesAt to the past
    const finishesAt = new Date(Date.now() - 1000).toISOString();
    el.timerActive = true;
    el.finishesAt = finishesAt;
    await el.updateComplete;

    const display = el.shadowRoot!.querySelector(".duration-display");
    expect(display!.textContent).toBe("00:00");
  });

  it("should disable both buttons when timerActive is true", async () => {
    el.timerActive = true;
    el.finishesAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    el.duration = 60; // middle of range so boundary wouldn't disable
    await el.updateComplete;

    const buttons = el.shadowRoot!.querySelectorAll("button");
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
  });

  it("should show idle display when timerActive is true but finishesAt is null", async () => {
    el.timerActive = true;
    el.finishesAt = null;
    el.duration = 30;
    await el.updateComplete;

    const display = el.shadowRoot!.querySelector(".duration-display");
    expect(display!.textContent).toBe("30m");
  });

  it("should start interval when timerActive becomes true", async () => {
    el.timerActive = true;
    el.finishesAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await el.updateComplete;

    // Advance time by 1 second — should trigger re-render
    const displayBefore = el.shadowRoot!.querySelector(".duration-display")!.textContent;
    vi.advanceTimersByTime(1000);
    await el.updateComplete;

    // The display should still be valid countdown format
    const displayAfter = el.shadowRoot!.querySelector(".duration-display")!.textContent;
    expect(displayAfter).toMatch(/^\d{2}:\d{2}$/);
  });

  it("should stop interval when timerActive becomes false", async () => {
    el.timerActive = true;
    el.finishesAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await el.updateComplete;

    // Deactivate timer
    el.timerActive = false;
    el.finishesAt = null;
    await el.updateComplete;

    // Display should revert to idle format
    const display = el.shadowRoot!.querySelector(".duration-display");
    expect(display!.textContent).toBe("30m");
  });
});


describe("SimpleTimerSelector - Accessibility", () => {
  let el: SimpleTimerSelector;

  beforeEach(async () => {
    el = document.createElement("simple-timer-selector") as SimpleTimerSelector;
    el.duration = 60;
    el.maxDuration = 240;
    el.stepSize = 15;
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  it("should have aria-label='Decrease duration' on decrement button", async () => {
    const buttons = el.shadowRoot!.querySelectorAll("button");
    expect(buttons[0].getAttribute("aria-label")).toBe("Decrease duration");
  });

  it("should have aria-label='Increase duration' on increment button", async () => {
    const buttons = el.shadowRoot!.querySelectorAll("button");
    expect(buttons[1].getAttribute("aria-label")).toBe("Increase duration");
  });

  it("should set aria-disabled='true' on decrement button when disabled", async () => {
    el.duration = 15;
    el.stepSize = 15;
    await el.updateComplete;

    const buttons = el.shadowRoot!.querySelectorAll("button");
    expect(buttons[0].getAttribute("aria-disabled")).toBe("true");
  });

  it("should set aria-disabled='false' on decrement button when enabled", async () => {
    el.duration = 60;
    await el.updateComplete;

    const buttons = el.shadowRoot!.querySelectorAll("button");
    expect(buttons[0].getAttribute("aria-disabled")).toBe("false");
  });

  it("should set aria-disabled='true' on increment button when disabled", async () => {
    el.duration = 240;
    el.maxDuration = 240;
    await el.updateComplete;

    const buttons = el.shadowRoot!.querySelectorAll("button");
    expect(buttons[1].getAttribute("aria-disabled")).toBe("true");
  });

  it("should set aria-disabled='false' on increment button when enabled", async () => {
    el.duration = 60;
    await el.updateComplete;

    const buttons = el.shadowRoot!.querySelectorAll("button");
    expect(buttons[1].getAttribute("aria-disabled")).toBe("false");
  });

  it("should set aria-disabled='true' on both buttons when timer is active", async () => {
    el.timerActive = true;
    el.finishesAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    el.duration = 60;
    await el.updateComplete;

    const buttons = el.shadowRoot!.querySelectorAll("button");
    expect(buttons[0].getAttribute("aria-disabled")).toBe("true");
    expect(buttons[1].getAttribute("aria-disabled")).toBe("true");
  });

  it("should have aria-live='polite' on the duration display", async () => {
    const display = el.shadowRoot!.querySelector(".duration-display");
    expect(display!.getAttribute("aria-live")).toBe("polite");
  });

  it("should use native button elements (exposing button role)", async () => {
    const buttons = el.shadowRoot!.querySelectorAll("button");
    expect(buttons.length).toBe(2);
    // Native <button> elements expose "button" role by default
    expect(buttons[0].tagName).toBe("BUTTON");
    expect(buttons[1].tagName).toBe("BUTTON");
  });
});
