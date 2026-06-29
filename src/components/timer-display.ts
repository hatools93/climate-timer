import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { computeRemainingMs, computeElapsedFraction } from "../utils/timer-utils";
import { formatCountdown } from "../utils/format-utils";

/**
 * TimerDisplay component renders the countdown timer with a circular
 * SVG progress ring showing elapsed fraction and MM:SS remaining time.
 *
 * The parent component triggers re-renders every 1 second; this component
 * simply computes the display from the current time on each render.
 */
@customElement("timer-display")
export class TimerDisplay extends LitElement {
  /**
   * ISO timestamp of when the timer finishes. Null when no timer is active.
   */
  @property({ type: String, attribute: "finishes-at" })
  finishesAt: string | null = null;

  /**
   * The total duration of the timer in "HH:MM:SS" format.
   */
  @property({ type: String, attribute: "duration-str" })
  durationStr = "00:30:00";

  /**
   * Whether the timer is currently active.
   */
  @property({ type: Boolean })
  active = false;

  // SVG circle geometry constants
  private static readonly RADIUS = 44;
  private static readonly CIRCUMFERENCE = 2 * Math.PI * TimerDisplay.RADIUS;

  static styles = css`
    :host {
      display: block;
    }

    .timer-display {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      max-width: 200px;
      margin: 0 auto;
    }

    .progress-ring {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .progress-ring__background {
      fill: none;
      stroke: var(--divider-color, rgba(0, 0, 0, 0.12));
      stroke-width: 4;
    }

    .progress-ring__progress {
      fill: none;
      stroke: var(--primary-color, #03a9f4);
      stroke-width: 4;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear;
    }

    .countdown-text {
      font-size: 2rem;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      color: var(--primary-text-color, #212121);
      z-index: 1;
    }

    .hidden {
      display: none;
    }
  `;

  protected render() {
    if (!this.active || !this.finishesAt) {
      return nothing;
    }

    const remainingMs = computeRemainingMs(this.finishesAt);
    const fraction = computeElapsedFraction(this.finishesAt, this.durationStr);
    const formattedTime = formatCountdown(remainingMs);

    // Calculate the stroke-dashoffset for the progress ring.
    // fraction=0 means just started (full ring remaining), fraction=1 means finished (empty ring).
    const circumference = TimerDisplay.CIRCUMFERENCE;
    const offset = circumference * (1 - fraction);

    return html`
      <div class="timer-display">
        <svg class="progress-ring" viewBox="0 0 100 100">
          <circle
            class="progress-ring__background"
            cx="50"
            cy="50"
            r="${TimerDisplay.RADIUS}"
          />
          <circle
            class="progress-ring__progress"
            cx="50"
            cy="50"
            r="${TimerDisplay.RADIUS}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
          />
        </svg>
        <span class="countdown-text">${formattedTime}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "timer-display": TimerDisplay;
  }
}
