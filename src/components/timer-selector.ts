import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { adjustDuration, MAX_DURATION, STEP } from "../utils/duration-utils";
import { formatDurationIdle, formatCountdown } from "../utils/format-utils";
import { computeRemainingMs, computeElapsedFraction } from "../utils/timer-utils";

/**
 * A rotary dial that serves dual purpose:
 * - Idle mode: drag/scroll to select timer duration
 * - Active mode: displays countdown with elapsed time arc animation
 *
 * Fires a "duration-changed" CustomEvent with detail: { duration: number }
 */
@customElement("timer-selector")
export class TimerSelector extends LitElement {
  @property({ type: Number })
  duration = 30;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Number, attribute: "max-duration" })
  maxDuration = MAX_DURATION;

  @property({ type: Number, attribute: "step-size" })
  stepSize = STEP;

  // Countdown properties (when timer is active)
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

  static MIN_DURATION = STEP;
  static MAX_DURATION = MAX_DURATION;
  static STEP = STEP;

  private _isDragging = false;
  private _lastAngle: number | null = null;
  private _accumulatedRotation = 0;
  private _touchStartY: number | null = null;

  private static readonly DEGREES_PER_STEP = 15;

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

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopInterval();
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.timerActive) {
      this._startInterval();
    }
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
      user-select: none;
      -webkit-user-select: none;
    }

    .dial-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      touch-action: none;
    }

    .dial-container.disabled {
      pointer-events: none;
    }

    .dial-wrapper {
      position: relative;
      width: 180px;
      height: 180px;
      cursor: grab;
    }

    .dial-wrapper.active {
      cursor: default;
    }

    .dial-wrapper:active {
      cursor: grabbing;
    }

    .dial-wrapper.active:active {
      cursor: default;
    }

    .dial-svg {
      width: 100%;
      height: 100%;
    }

    /* Outer ring track */
    .dial-track {
      fill: none;
      stroke: var(--divider-color, rgba(0, 0, 0, 0.12));
      stroke-width: 8;
    }

    /* Filled arc showing current value proportion (idle mode) */
    .dial-fill {
      fill: none;
      stroke: var(--primary-color, #03a9f4);
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.15s ease;
    }

    /* Elapsed time arc (active mode) - grows clockwise as time passes */
    .dial-elapsed {
      fill: none;
      stroke: var(--warning-color, #ff9800);
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear;
    }

    /* Remaining time arc (active mode) - shrinks as time passes */
    .dial-remaining {
      fill: none;
      stroke: var(--primary-color, #03a9f4);
      stroke-width: 8;
      stroke-linecap: round;
      opacity: 0.3;
    }

    /* Tick marks around the dial */
    .tick {
      stroke: var(--secondary-text-color, #666);
      stroke-width: 1.5;
      opacity: 0.4;
    }

    .tick.major {
      stroke-width: 2;
      opacity: 0.7;
    }

    /* Knob/grip indicator */
    .dial-knob {
      fill: var(--primary-color, #03a9f4);
      filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
      transition: transform 0.15s ease;
    }

    /* Center display */
    .dial-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .duration-text {
      font-size: 1.8rem;
      font-weight: 600;
      color: var(--primary-text-color, #333);
      line-height: 1.2;
    }

    .countdown-text {
      font-size: 2rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--primary-text-color, #333);
      line-height: 1.2;
    }

    .duration-label {
      font-size: 0.75rem;
      color: var(--secondary-text-color, #666);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }

    .countdown-label {
      font-size: 0.7rem;
      color: var(--warning-color, #ff9800);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
      font-weight: 500;
    }

    /* Rotation hint */
    .hint {
      font-size: 0.75rem;
      color: var(--secondary-text-color, #666);
      margin-top: 8px;
      opacity: 0.6;
    }
  `;

  // SVG geometry
  private static readonly RADIUS = 70;
  private static readonly CENTER = 90;
  private static readonly CIRCUMFERENCE = 2 * Math.PI * 70;

  render() {
    if (this.timerActive && this.finishesAt) {
      return this._renderCountdown();
    }
    return this._renderSelector();
  }

  private _renderCountdown() {
    // Reference _tick to ensure Lit re-renders on each interval tick
    void this._tick;
    const remainingMs = computeRemainingMs(this.finishesAt!);
    const elapsedFraction = computeElapsedFraction(this.finishesAt!, this.durationStr);
    const formattedTime = formatCountdown(remainingMs);
    const circumference = TimerSelector.CIRCUMFERENCE;

    // Elapsed arc: starts from top, grows clockwise proportional to elapsed time
    // dashoffset = circumference * (1 - elapsedFraction)
    const elapsedOffset = circumference * (1 - elapsedFraction);

    return html`
      <div class="dial-container">
        <div class="dial-wrapper active">
          <svg class="dial-svg" viewBox="0 0 180 180">
            <!-- Tick marks -->
            ${this._renderTicks()}

            <!-- Background track (full ring, dim) -->
            <circle
              class="dial-track"
              cx="${TimerSelector.CENTER}"
              cy="${TimerSelector.CENTER}"
              r="${TimerSelector.RADIUS}"
            />

            <!-- Remaining time arc (blue, transparent - shows full ring as base) -->
            <circle
              class="dial-remaining"
              cx="${TimerSelector.CENTER}"
              cy="${TimerSelector.CENTER}"
              r="${TimerSelector.RADIUS}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="0"
              transform="rotate(-90 ${TimerSelector.CENTER} ${TimerSelector.CENTER})"
            />

            <!-- Elapsed time arc (orange, animated - grows as time passes) -->
            <circle
              class="dial-elapsed"
              cx="${TimerSelector.CENTER}"
              cy="${TimerSelector.CENTER}"
              r="${TimerSelector.RADIUS}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${elapsedOffset}"
              transform="rotate(-90 ${TimerSelector.CENTER} ${TimerSelector.CENTER})"
            />
          </svg>

          <!-- Center: countdown time -->
          <div class="dial-center">
            <span class="countdown-text">${formattedTime}</span>
            <span class="countdown-label">remaining</span>
          </div>
        </div>
      </div>
    `;
  }

  private _renderSelector() {
    const minDuration = this.stepSize;
    const fraction = (this.duration - minDuration) / (this.maxDuration - minDuration);
    const circumference = TimerSelector.CIRCUMFERENCE;
    const offset = circumference * (1 - fraction);

    // Knob position
    const knobAngle = -90 + fraction * 360;
    const knobRad = (knobAngle * Math.PI) / 180;
    const knobX = TimerSelector.CENTER + TimerSelector.RADIUS * Math.cos(knobRad);
    const knobY = TimerSelector.CENTER + TimerSelector.RADIUS * Math.sin(knobRad);

    return html`
      <div class="dial-container ${this.disabled ? "disabled" : ""}">
        <div
          class="dial-wrapper"
          @mousedown=${this._handlePointerDown}
          @mousemove=${this._handlePointerMove}
          @mouseup=${this._handlePointerUp}
          @mouseleave=${this._handlePointerUp}
          @touchstart=${this._handleTouchDown}
          @touchmove=${this._handleTouchMove}
          @touchend=${this._handlePointerUp}
          @wheel=${this._handleWheel}
        >
          <svg class="dial-svg" viewBox="0 0 180 180">
            ${this._renderTicks()}

            <circle
              class="dial-track"
              cx="${TimerSelector.CENTER}"
              cy="${TimerSelector.CENTER}"
              r="${TimerSelector.RADIUS}"
            />

            <circle
              class="dial-fill"
              cx="${TimerSelector.CENTER}"
              cy="${TimerSelector.CENTER}"
              r="${TimerSelector.RADIUS}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"
              transform="rotate(-90 ${TimerSelector.CENTER} ${TimerSelector.CENTER})"
            />

            <circle
              class="dial-knob"
              cx="${knobX}"
              cy="${knobY}"
              r="8"
            />
          </svg>

          <div class="dial-center">
            <span class="duration-text">${formatDurationIdle(this.duration)}</span>
            <span class="duration-label">duration</span>
          </div>
        </div>
      </div>
    `;
  }

  private _renderTicks() {
    const ticks = [];
    const numTicks = 24;
    for (let i = 0; i < numTicks; i++) {
      const angle = (i * 360) / numTicks - 90;
      const rad = (angle * Math.PI) / 180;
      const isMajor = i % 6 === 0;
      const innerR = isMajor ? 52 : 56;
      const outerR = 62;
      const x1 = TimerSelector.CENTER + innerR * Math.cos(rad);
      const y1 = TimerSelector.CENTER + innerR * Math.sin(rad);
      const x2 = TimerSelector.CENTER + outerR * Math.cos(rad);
      const y2 = TimerSelector.CENTER + outerR * Math.sin(rad);

      ticks.push(
        html`<line class="tick ${isMajor ? "major" : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`
      );
    }
    return ticks;
  }

  private _getAngle(e: MouseEvent | Touch): number {
    const wrapper = this.shadowRoot!.querySelector(".dial-wrapper") as HTMLElement;
    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  private _handlePointerDown(e: MouseEvent): void {
    if (this.disabled) return;
    this._isDragging = true;
    this._lastAngle = this._getAngle(e);
    this._accumulatedRotation = 0;
  }

  private _handlePointerMove(e: MouseEvent): void {
    if (this.disabled || !this._isDragging || this._lastAngle === null) return;

    const currentAngle = this._getAngle(e);
    let delta = currentAngle - this._lastAngle;

    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    this._accumulatedRotation += delta;
    this._lastAngle = currentAngle;

    const degreesPerStep = TimerSelector.DEGREES_PER_STEP;
    while (this._accumulatedRotation >= degreesPerStep) {
      this._accumulatedRotation -= degreesPerStep;
      const newDuration = adjustDuration(this.duration, "up", this.maxDuration, this.stepSize);
      if (newDuration !== this.duration) {
        this._fireDurationChanged(newDuration);
      }
    }
    while (this._accumulatedRotation <= -degreesPerStep) {
      this._accumulatedRotation += degreesPerStep;
      const newDuration = adjustDuration(this.duration, "down", this.maxDuration, this.stepSize);
      if (newDuration !== this.duration) {
        this._fireDurationChanged(newDuration);
      }
    }
  }

  private _handlePointerUp(): void {
    this._isDragging = false;
    this._lastAngle = null;
    this._accumulatedRotation = 0;
  }

  private _handleTouchDown(e: TouchEvent): void {
    if (this.disabled || e.touches.length === 0) return;
    this._isDragging = true;
    this._lastAngle = this._getAngle(e.touches[0]);
    this._accumulatedRotation = 0;
    this._touchStartY = e.touches[0].clientY;
  }

  private _handleTouchMove(e: TouchEvent): void {
    if (this.disabled || !this._isDragging || e.touches.length === 0) return;
    e.preventDefault();

    const touch = e.touches[0];
    const currentAngle = this._getAngle(touch);

    if (this._lastAngle === null) {
      this._lastAngle = currentAngle;
      return;
    }

    let delta = currentAngle - this._lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    this._accumulatedRotation += delta;
    this._lastAngle = currentAngle;

    const degreesPerStep = TimerSelector.DEGREES_PER_STEP;
    while (this._accumulatedRotation >= degreesPerStep) {
      this._accumulatedRotation -= degreesPerStep;
      const newDuration = adjustDuration(this.duration, "up", this.maxDuration, this.stepSize);
      if (newDuration !== this.duration) {
        this._fireDurationChanged(newDuration);
      }
    }
    while (this._accumulatedRotation <= -degreesPerStep) {
      this._accumulatedRotation += degreesPerStep;
      const newDuration = adjustDuration(this.duration, "down", this.maxDuration, this.stepSize);
      if (newDuration !== this.duration) {
        this._fireDurationChanged(newDuration);
      }
    }
  }

  private _handleWheel(e: WheelEvent): void {
    if (this.disabled) return;
    e.preventDefault();

    const direction = e.deltaY < 0 ? "up" : "down";
    const newDuration = adjustDuration(this.duration, direction, this.maxDuration, this.stepSize);

    if (newDuration !== this.duration) {
      this._fireDurationChanged(newDuration);
    }
  }

  private _fireDurationChanged(newDuration: number): void {
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
    "timer-selector": TimerSelector;
  }
}
