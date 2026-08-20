# Implementation Plan: UI Mode Selection

## Overview

This plan implements the UI mode selection feature for the Climate Timer Card. It adds a `ui_mode` configuration property, creates a new `<simple-timer-selector>` LitElement component with button-based controls, extends the card editor with a mode selection dropdown, and modifies the main card to conditionally render based on the configured mode. All tasks use TypeScript with Lit and follow the existing project patterns.

## Tasks

- [x] 1. Extend configuration type and add UI mode resolution
  - [x] 1.1 Add `ui_mode` property to `ClimateTimerCardConfig` interface
    - In `src/types.ts`, add `ui_mode?: "rotary" | "simple"` to the `ClimateTimerCardConfig` interface
    - _Requirements: 1.1_

  - [x] 1.2 Add `resolveUiMode` utility function
    - Create a helper function in `src/utils/duration-utils.ts` (or inline in the card) that returns `"simple"` only when `ui_mode === "simple"`, otherwise returns `"rotary"`
    - This centralizes the fallback logic for invalid/missing values
    - _Requirements: 1.2, 1.3_

- [x] 2. Implement the Simple Timer Selector component
  - [x] 2.1 Create `<simple-timer-selector>` component shell
    - Create `src/components/simple-timer-selector.ts`
    - Implement a LitElement with reactive properties: `duration`, `disabled`, `maxDuration`, `stepSize`, `finishesAt`, `durationStr`, `timerActive`
    - Import `adjustDuration`, `clampDuration` from `duration-utils` and `formatDurationIdle`, `formatCountdown` from `format-utils`
    - Import `computeRemainingMs` from `timer-utils`
    - _Requirements: 3.1, 7.1, 7.2_

  - [x] 2.2 Implement idle state rendering for Simple UI
    - Render a horizontal row: decrement button (`−`), duration display (`formatDurationIdle(duration)`), increment button (`+`)
    - Disable increment button when `duration >= maxDuration`
    - Disable decrement button when `duration <= stepSize`
    - On increment click: call `adjustDuration(duration, "up", maxDuration, stepSize)` and fire `duration-changed` event
    - On decrement click: call `adjustDuration(duration, "down", maxDuration, stepSize)` and fire `duration-changed` event
    - Fire `duration-changed` CustomEvent with `{ detail: { duration }, bubbles: true, composed: true }`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 7.1_

  - [x] 2.3 Implement active state (countdown) rendering for Simple UI
    - When `timerActive` is true and `finishesAt` is not null, show countdown in the display area using `formatCountdown(computeRemainingMs(finishesAt))`
    - Disable both buttons during active state
    - Set up a 1-second interval (same pattern as `timer-selector.ts`) to tick and trigger re-renders
    - Show "00:00" when remaining reaches 0
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.4 Add theme-aware styling to Simple UI
    - Use only HA CSS custom properties with fallback values for all colors
    - Use `--primary-color` for enabled button icon color
    - Use `--primary-text-color` for duration display text
    - Set disabled button opacity to 0.5 with `cursor: not-allowed`
    - No hardcoded color literals except as `var()` fallbacks
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 2.5 Add accessibility attributes to Simple UI
    - Add `aria-label="Increase duration"` to increment button
    - Add `aria-label="Decrease duration"` to decrement button
    - Ensure buttons are focusable and activate on Enter/Space (native `<button>` behavior)
    - Set `aria-disabled="true"` on disabled buttons
    - Add a live region (`aria-live="polite"`) around the duration display that updates when the value changes
    - Ensure buttons expose `button` role (native)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 2.6 Write property test for UI mode resolution (Property 1)
    - **Property 1: UI Mode Resolution Always Produces Valid Mode**
    - Generate arbitrary strings/undefined/null and verify the resolved mode is always `"rotary"` or `"simple"`, and is `"rotary"` for any value other than `"simple"`
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [x] 2.7 Write property test for duration adjustment correctness (Property 2)
    - **Property 2: Duration Adjustment Correctness**
    - Generate valid (duration, step, maxDuration, direction) tuples and verify post-conditions: result is a multiple of step within [step, maxDuration]
    - **Validates: Requirements 3.3, 3.4, 3.7, 3.8**

  - [x] 2.8 Write property test for duration boundary clamping (Property 3)
    - **Property 3: Duration Boundary Clamping Invariant**
    - Generate arbitrary (duration, step, maxDuration) and verify result is always a positive multiple of step in [step, maxDuration]
    - **Validates: Requirements 3.5, 3.6, 3.7, 3.8, 7.2**

- [x] 3. Checkpoint - Ensure Simple UI component compiles and basic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Modify the main card to support UI mode switching
  - [x] 4.1 Update `<climate-timer-card>` to conditionally render based on `ui_mode`
    - Import `./simple-timer-selector` in the card component
    - Resolve `ui_mode` from config (default `"rotary"`)
    - When mode is `"simple"`, render `<simple-timer-selector>` instead of `<timer-selector>`
    - Pass the same properties to both: `duration`, `disabled`, `maxDuration`, `stepSize`, `finishesAt`, `durationStr`, `timerActive`
    - Both listen to `@duration-changed` event with the same handler
    - _Requirements: 1.4, 1.5, 7.1, 7.3, 7.4_

  - [x] 4.2 Write property test for duration preservation on mode switch (Property 7)
    - **Property 7: Duration Preservation on Mode Switch**
    - Generate (duration, step, maxDuration) tuples and verify the preserved duration equals `clampDuration(currentDuration, maxDuration, step)`
    - **Validates: Requirements 7.3, 7.4**

  - [x] 4.3 Write unit tests for card mode rendering
    - Test that card renders `<timer-selector>` when `ui_mode` is `"rotary"` or undefined
    - Test that card renders `<simple-timer-selector>` when `ui_mode` is `"simple"`
    - Test that invalid `ui_mode` values fall back to rotary
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 5. Extend the card editor with UI mode selection
  - [x] 5.1 Add UI mode dropdown to `<climate-timer-card-editor>`
    - Add a `<select>` control with two `<option>` elements: "Rotary" (value `rotary`) and "Simple" (value `simple`)
    - Default selected value to `"rotary"` when `ui_mode` is undefined in config
    - On change, update `_config.ui_mode` and fire `config-changed` CustomEvent with the full config
    - Place the control in the editor layout (before or after existing controls)
    - _Requirements: 1.6, 2.1, 2.2, 2.3, 2.4_

  - [x] 5.2 Write property test for editor config-changed event completeness (Property 8)
    - **Property 8: Editor Config-Changed Event Completeness**
    - Generate valid card configs and simulate mode change, verify the fired event's `detail.config` contains all existing properties plus `ui_mode` set to the selected value
    - **Validates: Requirements 2.2**

  - [x] 5.3 Write unit tests for editor UI mode control
    - Test that editor renders exactly two options ("Rotary", "Simple")
    - Test that default selection is "Rotary" when `ui_mode` is undefined
    - Test that changing selection fires `config-changed` with correct `ui_mode` value
    - _Requirements: 2.1, 2.3, 2.4_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Add remaining property tests and integration wiring
  - [x] 7.1 Write property test for idle duration format (Property 4)
    - **Property 4: Idle Duration Format Correctness**
    - Generate durations 1–1440, verify format matches `"{m}m"` pattern (< 60) or `"{h}h {r}m"` pattern (>= 60)
    - **Validates: Requirements 3.2**

  - [x] 7.2 Write property test for countdown format (Property 5)
    - **Property 5: Countdown Format Correctness**
    - Generate ms values 0–86400000, verify "MM:SS" format with correct zero-padding and numeric values
    - **Validates: Requirements 4.4**

  - [x] 7.3 Write property test for event contract consistency (Property 6)
    - **Property 6: Event Contract Consistency**
    - Generate random durations, simulate button interactions on Simple UI, verify emitted event has `detail.duration` as number, `bubbles: true`, `composed: true`
    - **Validates: Requirements 7.1**

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation language is TypeScript (matching the existing project)
- fast-check is already available in devDependencies for property-based tests
- vitest is the test runner (already configured)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5"] },
    { "id": 3, "tasks": ["2.6", "2.7", "2.8", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "7.1", "7.2", "7.3"] }
  ]
}
```
