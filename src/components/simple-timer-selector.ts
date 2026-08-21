import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { adjustDuration, clampDuration, MAX_DURATION, STEP } from "../utils/duration-utils";
import { formatDurationIdle, formatCountdown } from "../utils/format-utils";
import { computeRemainingMs } from "../utils/timer-utils";

/**
 * A simple button-based timer selector with [−] [duration] [+] controls.
 *
 * Fires a "duration-changed" CustomEvent with detail: { duration: number }
 */
@customElement("simple-timer-selector")
export class SimpleTimerSelector extends LitElement {
  @property({ type: Number })
  duration = 30;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Number, attribute: "max-duration" })
  maxDuration = MAX_DURATION;

  @property({ type: Number, attribute: "step-size" })
  stepSize = STEP;

  @property({ type: String, attribute: "finishes-at" })
  finishesAt: string | null = null;

  @property({ type: String, attribute: "duration-str" })
  durationStr = "00:30:00";

  @property({ type: Boolean, attribute: "timer-active" })
  timerActive = false;

  // Internal tick counter to force re-renders every second during countdown
  @state()
  private _tick = 0;

  private _intervalId: number | null = null;

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has("timerActive")) {
      if (this.timerActive) {
        this._startInterval();
      } else {
        this._stopInterval();
      }
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.timerActive) {
      this._startInterval();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopInterval();
  }

  private _startInterval(): void {
    this._stopInterval();
    this._intervalId = window.setInterval(() => {
      this._tick++;
    }, 1000);
  }

  private _stopInterval(): void {
    if (this._intervalId !== null) {
      window.clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      padding-top: 16px;
    }

    .capsule {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 10px 20px;
      border-radius: 999px;
      border: 1.5px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      background: var(--card-background-color, transparent);
      width: fit-content;
      max-width: 100%;
      box-sizing: border-box;
      margin: 0 auto;
    }

    .duration-display {
      font-size: 1.4rem;
      font-weight: 600;
      min-width: 64px;
      text-align: center;
      color: var(--primary-text-color, #333);
      user-select: none;
    }

    button {
      font-size: 1.2rem;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: var(--primary-color, #03a9f4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: opacity 0.15s ease;
    }

    button:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      color: var(--disabled-text-color, #bdbdbd);
    }
  `;

  render() {
    // Reference _tick to ensure Lit re-renders on each interval tick
    void this._tick;

    const isActive = this.timerActive && this.finishesAt !== null;
    const displayText = isActive
      ? formatCountdown(computeRemainingMs(this.finishesAt!))
      : formatDurationIdle(this.duration);

    const decrementDisabled = this.timerActive || this.duration <= this.stepSize;
    const incrementDisabled = this.timerActive || this.duration >= this.maxDuration;

    return html`
      <div class="capsule">
        <button
          @click=${this._handleDecrement}
          ?disabled=${decrementDisabled}
          aria-label="Decrease duration"
          aria-disabled="${decrementDisabled ? 'true' : 'false'}"
        >−</button>
        <span class="duration-display" aria-live="polite">${displayText}</span>
        <button
          @click=${this._handleIncrement}
          ?disabled=${incrementDisabled}
          aria-label="Increase duration"
          aria-disabled="${incrementDisabled ? 'true' : 'false'}"
        >+</button>
      </div>
    `;
  }

  private _handleIncrement(): void {
    const newDuration = adjustDuration(this.duration, "up", this.maxDuration, this.stepSize);
    this.dispatchEvent(
      new CustomEvent("duration-changed", {
        detail: { duration: newDuration },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleDecrement(): void {
    const newDuration = adjustDuration(this.duration, "down", this.maxDuration, this.stepSize);
    this.dispatchEvent(
      new CustomEvent("duration-changed", {
        detail: { duration: newDuration },
        bubbles: true,
        composed: true,
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "simple-timer-selector": SimpleTimerSelector;
  }
}
