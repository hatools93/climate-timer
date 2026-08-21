import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../components/timer-selector";
import { TimerSelector } from "../components/timer-selector";

describe("TimerSelector", () => {
  let el: TimerSelector;

  beforeEach(async () => {
    el = document.createElement("timer-selector") as TimerSelector;
    el.duration = 30;
    el.disabled = false;
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  describe("scroll up increments duration by 15", () => {
    it("should fire duration-changed with duration increased by 15 on scroll up", async () => {
      el.duration = 30;
      await el.updateComplete;

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        el.addEventListener("duration-changed", (e) => resolve(e as CustomEvent), { once: true });
      });

      const wheelEvent = new WheelEvent("wheel", { deltaY: -1, bubbles: true });
      el.shadowRoot!.querySelector(".dial-wrapper")!.dispatchEvent(wheelEvent);

      const event = await eventPromise;
      expect(event.detail.duration).toBe(45);
    });
  });

  describe("scroll down decrements duration by 15", () => {
    it("should fire duration-changed with duration decreased by 15 on scroll down", async () => {
      el.duration = 30;
      await el.updateComplete;

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        el.addEventListener("duration-changed", (e) => resolve(e as CustomEvent), { once: true });
      });

      const wheelEvent = new WheelEvent("wheel", { deltaY: 1, bubbles: true });
      el.shadowRoot!.querySelector(".dial-wrapper")!.dispatchEvent(wheelEvent);

      const event = await eventPromise;
      expect(event.detail.duration).toBe(15);
    });
  });

  describe("clamping at min (15) and max (240) boundaries", () => {
    it("should not fire duration-changed when at minimum (15) and scrolling down", async () => {
      el.duration = 15;
      await el.updateComplete;

      let eventFired = false;
      el.addEventListener("duration-changed", () => {
        eventFired = true;
      });

      const wheelEvent = new WheelEvent("wheel", { deltaY: 1, bubbles: true });
      el.shadowRoot!.querySelector(".dial-wrapper")!.dispatchEvent(wheelEvent);

      // Give a tick for any async event dispatch
      await new Promise((r) => setTimeout(r, 0));
      expect(eventFired).toBe(false);
    });

    it("should not fire duration-changed when at maximum (240) and scrolling up", async () => {
      el.duration = 240;
      await el.updateComplete;

      let eventFired = false;
      el.addEventListener("duration-changed", () => {
        eventFired = true;
      });

      const wheelEvent = new WheelEvent("wheel", { deltaY: -1, bubbles: true });
      el.shadowRoot!.querySelector(".dial-wrapper")!.dispatchEvent(wheelEvent);

      await new Promise((r) => setTimeout(r, 0));
      expect(eventFired).toBe(false);
    });

    it("should allow scrolling up from minimum", async () => {
      el.duration = 15;
      await el.updateComplete;

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        el.addEventListener("duration-changed", (e) => resolve(e as CustomEvent), { once: true });
      });

      const wheelEvent = new WheelEvent("wheel", { deltaY: -1, bubbles: true });
      el.shadowRoot!.querySelector(".dial-wrapper")!.dispatchEvent(wheelEvent);

      const event = await eventPromise;
      expect(event.detail.duration).toBe(30);
    });

    it("should allow scrolling down from maximum", async () => {
      el.duration = 240;
      await el.updateComplete;

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        el.addEventListener("duration-changed", (e) => resolve(e as CustomEvent), { once: true });
      });

      const wheelEvent = new WheelEvent("wheel", { deltaY: 1, bubbles: true });
      el.shadowRoot!.querySelector(".dial-wrapper")!.dispatchEvent(wheelEvent);

      const event = await eventPromise;
      expect(event.detail.duration).toBe(225);
    });
  });

  describe("disabled state prevents interaction", () => {
    it("should not fire duration-changed when disabled and scrolling up", async () => {
      el.duration = 30;
      el.disabled = true;
      await el.updateComplete;

      let eventFired = false;
      el.addEventListener("duration-changed", () => {
        eventFired = true;
      });

      const wheelEvent = new WheelEvent("wheel", { deltaY: -1, bubbles: true });
      el.shadowRoot!.querySelector(".dial-wrapper")!.dispatchEvent(wheelEvent);

      await new Promise((r) => setTimeout(r, 0));
      expect(eventFired).toBe(false);
    });

    it("should not fire duration-changed when disabled and scrolling down", async () => {
      el.duration = 30;
      el.disabled = true;
      await el.updateComplete;

      let eventFired = false;
      el.addEventListener("duration-changed", () => {
        eventFired = true;
      });

      const wheelEvent = new WheelEvent("wheel", { deltaY: 1, bubbles: true });
      el.shadowRoot!.querySelector(".dial-wrapper")!.dispatchEvent(wheelEvent);

      await new Promise((r) => setTimeout(r, 0));
      expect(eventFired).toBe(false);
    });
  });

  describe("duration-changed event fires with correct detail", () => {
    it("should emit a CustomEvent with bubbles and composed flags", async () => {
      el.duration = 60;
      await el.updateComplete;

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        el.addEventListener("duration-changed", (e) => resolve(e as CustomEvent), { once: true });
      });

      const wheelEvent = new WheelEvent("wheel", { deltaY: -1, bubbles: true });
      el.shadowRoot!.querySelector(".dial-wrapper")!.dispatchEvent(wheelEvent);

      const event = await eventPromise;
      expect(event.detail).toEqual({ duration: 75 });
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it("should emit correct duration when scrolling down", async () => {
      el.duration = 120;
      await el.updateComplete;

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        el.addEventListener("duration-changed", (e) => resolve(e as CustomEvent), { once: true });
      });

      const wheelEvent = new WheelEvent("wheel", { deltaY: 1, bubbles: true });
      el.shadowRoot!.querySelector(".dial-wrapper")!.dispatchEvent(wheelEvent);

      const event = await eventPromise;
      expect(event.detail).toEqual({ duration: 105 });
    });
  });
});
