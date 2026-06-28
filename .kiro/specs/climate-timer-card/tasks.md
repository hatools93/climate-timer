# Implementation Plan: Climate Timer Card

## Overview

Build a custom Home Assistant Lovelace card with TypeScript + Lit + Rollup that uses a hybrid timer architecture: a server-side HA Timer helper for reliable countdown and a client-side animated display synced from the timer entity's `finishes_at` attribute. Includes a scroll-wheel duration selector, companion automation for climate shutdown, and a card editor for entity configuration.

## Tasks

- [x] 1. Set up project structure, build tooling, and core types
  - [x] 1.1 Initialize project with package.json, TypeScript config, and Rollup build
    - Create `package.json` with dependencies: lit, rollup, @rollup/plugin-typescript, @rollup/plugin-node-resolve, rollup-plugin-terser, typescript
    - Create `tsconfig.json` targeting ES2021 with strict mode, decorators enabled for Lit
    - Create `rollup.config.js` bundling `src/main.ts` → `dist/climate-timer-card.js` as a single IIFE bundle
    - Create `src/` directory structure matching design: `src/main.ts`, `src/components/`, `src/utils/`, `src/__tests__/`
    - _Requirements: N/A (infrastructure)_

  - [x] 1.2 Define TypeScript interfaces and type definitions
    - Create `src/types.ts` with `ClimateTimerCardConfig`, `TimerEntityState`, `ClimateEntityState`, `CountdownDisplayState` interfaces as specified in the design
    - Add Home Assistant type stubs (`HomeAssistant` interface with `hass.states`, `hass.callService`, `hass.connection`) in `src/ha-types.ts`
    - _Requirements: 1.2, 1.4_

  - [x] 1.3 Set up Vitest testing framework with fast-check
    - Add dev dependencies: vitest, @vitest/coverage-v8, fast-check, @open-wc/testing, @lit-labs/testing
    - Create `vitest.config.ts` configured for TypeScript and Lit component testing
    - Add test scripts to `package.json`: `test`, `test:run`, `test:coverage`
    - _Requirements: N/A (infrastructure)_

- [x] 2. Implement utility functions
  - [x] 2.1 Implement duration utilities
    - Create `src/utils/duration-utils.ts` with: `clampDuration(minutes)`, `adjustDuration(current, direction)`, `minutesToHADuration(minutes)`, `parseDurationToMs(duration)`
    - `clampDuration`: ensures MIN_DURATION (5) ≤ result ≤ MAX_DURATION (480), snapped to STEP (5)
    - `adjustDuration`: adds/subtracts STEP, returns clamped result
    - `minutesToHADuration`: converts minutes → "HH:MM:SS" string (e.g., 90 → "01:30:00")
    - `parseDurationToMs`: parses "HH:MM:SS" → milliseconds
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.2 Write property test for duration adjustment (Property 2)
    - **Property 2: Duration adjustment with clamping**
    - Generate random durations [5..480, step 5] × direction (up/down)
    - Verify result is always in [5, 480], multiple of 5, and delta is correct or clamped at boundary
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

  - [x] 2.3 Implement format utilities
    - Create `src/utils/format-utils.ts` with: `formatDurationIdle(minutes)`, `formatCountdown(ms)`
    - `formatDurationIdle`: 5 → "5m", 60 → "1h 0m", 90 → "1h 30m"
    - `formatCountdown`: ms → "MM:SS" zero-padded (e.g., 61000 → "01:01")
    - _Requirements: 2.8, 4.1_

  - [x] 2.4 Write property tests for format utilities (Properties 3 and 4)
    - **Property 3: Idle duration formatting**
    - Generate random durations [5..480, step 5], verify format matches "Xh Ym" or "Ym" rule
    - **Property 4: Countdown time formatting**
    - Generate random ms [0..28800000], verify output is "MM:SS" and round-trips at second precision
    - **Validates: Requirements 2.8, 4.1**

  - [x] 2.5 Implement entity utility functions
    - Create `src/utils/entity-utils.ts` with: `filterClimateEntities(entities)`, `filterTimerEntities(entities)`
    - Filter entities by domain prefix ("climate." and "timer." respectively)
    - _Requirements: 1.1_

  - [x] 2.6 Write property test for entity filtering (Property 1)
    - **Property 1: Climate entity filtering**
    - Generate random entity maps with mixed domains (climate.*, timer.*, light.*, etc.)
    - Verify only climate.* returned and all climate.* entities in input are included
    - **Validates: Requirements 1.1**

  - [x] 2.7 Implement timer computation utilities
    - Create `src/utils/timer-utils.ts` with: `computeRemainingMs(finishesAt)`, `computeElapsedFraction(finishesAt, durationStr)`
    - `computeRemainingMs`: returns max(0, Date.parse(finishesAt) - Date.now())
    - `computeElapsedFraction`: returns clamped (totalMs - remainingMs) / totalMs
    - _Requirements: 4.3, 4.5_

  - [x] 2.8 Write property test for elapsed fraction computation (Property 5)
    - **Property 5: Elapsed fraction computation from timer entity**
    - Generate random (finishesAt, duration, now) tuples
    - Verify fraction in [0, 1], matches formula, remaining ≥ 0
    - **Validates: Requirements 4.3, 4.5**

- [x] 3. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement TimerSelector component
  - [x] 4.1 Create TimerSelector scroll-wheel component
    - Create `src/components/timer-selector.ts` as a LitElement
    - Accept `duration` (number, minutes) and `disabled` (boolean) properties
    - Implement `_handleWheel(e: WheelEvent)` to adjust duration by STEP on scroll up/down
    - Implement `_handleTouchStart` and `_handleTouchMove` for swipe support
    - Fire `duration-changed` CustomEvent with `{ duration: number }` detail
    - Render the currently selected duration using `formatDurationIdle`
    - Display adjacent values (current ± step) with reduced opacity for scroll-wheel visual effect
    - When `disabled` is true, suppress all interactions and apply dimmed styling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 4.2 Write unit tests for TimerSelector
    - Test scroll up increments duration by 5
    - Test scroll down decrements duration by 5
    - Test clamping at min (5) and max (480) boundaries
    - Test disabled state prevents interaction
    - Test duration-changed event fires with correct detail
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.10_

- [x] 5. Implement TimerDisplay component
  - [x] 5.1 Create TimerDisplay countdown component
    - Create `src/components/timer-display.ts` as a LitElement
    - Accept `finishesAt` (string | null), `durationStr` (string), and `active` (boolean) properties
    - When active: compute remaining time from `finishesAt`, display in "MM:SS" format using `formatCountdown`
    - Render a circular or linear progress animation representing elapsed fraction using `computeElapsedFraction`
    - Use CSS animations/transitions for smooth progress visualization
    - Handle edge case where `finishesAt` is in the past (display "00:00", fraction = 1.0)
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 5.2 Write unit tests for TimerDisplay
    - Test displays "MM:SS" format when active with a future finishesAt
    - Test displays "00:00" when finishesAt is in the past
    - Test progress animation fraction updates correctly
    - Test inactive state renders nothing or idle state
    - _Requirements: 4.1, 4.3_

- [x] 6. Implement main ClimateTimerCard component
  - [x] 6.1 Create ClimateTimerCard with HA custom card interface
    - Create `src/components/climate-timer-card.ts` as a LitElement
    - Implement HA custom card interface: `static getConfigElement()`, `static getStubConfig()`, `setConfig(config)`, `getCardSize()`
    - Manage internal state: `_selectedDuration` (default 30), `_errorMessage`, `_displayIntervalId`
    - Implement computed getters: `_isTimerActive` (timer entity state === "active"), `_timerFinishesAt`, `_timerDuration`
    - Set up 1-second display interval when timer is active (for countdown refresh)
    - Clean up interval in `disconnectedCallback`
    - _Requirements: 1.2, 1.3, 1.4, 2.9, 4.2_

  - [x] 6.2 Implement start and cancel actions
    - `_handleStart()`: call `climate.turn_on` for configured entity, then `timer.start` with duration in "HH:MM:SS" format. If `climate.turn_on` fails, show error and don't start timer. If `timer.start` fails, roll back with `climate.turn_off`.
    - `_handleCancel()`: call `timer.cancel` for timer entity, then `climate.turn_off` for climate entity. Reset to idle state regardless of service call outcomes.
    - Display error messages for 5 seconds then auto-dismiss
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.1, 5.4, 6.1, 6.2, 6.3, 6.4_

  - [x] 6.3 Implement entity state awareness and external change handling
    - In `hass` property setter or `updated` lifecycle, detect state changes to both climate and timer entities
    - Handle climate entity unavailable: disable start button, show unavailable indicator
    - Handle climate entity turned off externally during countdown: cancel timer helper, reset to idle
    - Handle timer entity state transitions (active → idle): stop display interval, reset to idle
    - Update displayed climate state within render cycle
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 6.4 Implement card rendering and layout
    - Render card within HA card container (`ha-card` element) with proper structure
    - Display climate entity friendly name at top
    - Display current climate entity state below the name
    - Render TimerSelector between name and button
    - Render Start button (centered, below selector) when idle; Cancel button when timer active
    - Hide Start button during countdown, show Cancel button instead
    - Show configuration message when entity or timer_entity is not configured
    - Show validation errors for invalid entities
    - Apply styles for minimum 1-column grid width compatibility
    - _Requirements: 1.3, 1.5, 3.1, 3.6, 5.2, 5.3, 6.1, 7.1, 7.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 7. Implement ClimateTimerCardEditor component
  - [x] 7.1 Create card editor with entity dropdowns
    - Create `src/components/climate-timer-card-editor.ts` as a LitElement
    - Implement `setConfig(config)` for receiving current config
    - Render dropdown for climate entity selection (filtered from `hass.states` using `filterClimateEntities`)
    - Render dropdown for timer entity selection (filtered using `filterTimerEntities`)
    - Fire `config-changed` CustomEvent when either entity selection changes
    - Show validation error if selected entity doesn't exist or is wrong domain
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 7.2 Write unit tests for card editor
    - Test entity dropdown shows only climate domain entities
    - Test timer entity dropdown shows only timer domain entities
    - Test config-changed fires with correct config on entity selection
    - Test validation error shown for invalid entity
    - _Requirements: 1.1, 1.5_

- [x] 8. Checkpoint - Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Wire components together and create entry point
  - [x] 9.1 Create main.ts entry point with custom element registration
    - Create `src/main.ts` that imports and registers all custom elements:
      - `climate-timer-card` → ClimateTimerCard
      - `climate-timer-card-editor` → ClimateTimerCardEditor
    - Register card in `window.customCards` array for HA card picker with name, description, and preview flag
    - _Requirements: 1.2, 1.4_

  - [x] 9.2 Create companion automation blueprint YAML
    - Create `automation/climate-timer-automation.yaml` with the example automation from the design
    - Trigger on `timer.finished` event with configurable `entity_id`
    - Action: `climate.turn_off` targeting the associated climate entity
    - Include comments explaining how to adapt entity IDs
    - _Requirements: 5.1_

  - [x] 9.3 Write integration tests for full card lifecycle
    - Test full start flow: press start → climate.turn_on called → timer.start called → card shows countdown
    - Test cancel flow: press cancel → timer.cancel called → climate.turn_off called → card returns to idle
    - Test timer finish flow: timer entity transitions to idle → card resets
    - Test rollback: climate.turn_on succeeds → timer.start fails → climate.turn_off called
    - Test external off: climate state changes to "off" during countdown → timer.cancel called → card resets
    - Test unavailable handling: entity becomes unavailable → start button disabled
    - _Requirements: 3.3, 3.5, 5.1, 5.4, 6.2, 6.3, 7.2, 7.3, 7.4_

- [x] 10. Final checkpoint - Ensure all tests pass and bundle builds
  - Ensure all tests pass, ask the user if questions arise.
  - Run `npm run build` to verify Rollup produces `dist/climate-timer-card.js` without errors.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The hybrid timer architecture means the card reads state from HA entities — no local timer state management needed
- The companion automation is the mechanism for reliable shutdown; the card only needs to observe entity state changes

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.3", "2.5", "2.7"] },
    { "id": 3, "tasks": ["2.2", "2.4", "2.6", "2.8"] },
    { "id": 4, "tasks": ["4.1", "5.1"] },
    { "id": 5, "tasks": ["4.2", "5.2", "7.1"] },
    { "id": 6, "tasks": ["6.1"] },
    { "id": 7, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 8, "tasks": ["7.2", "9.1", "9.2"] },
    { "id": 9, "tasks": ["9.3"] }
  ]
}
```
