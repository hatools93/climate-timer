# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Persistent Mode Resolution After Card Reload
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples demonstrating that `_lastActiveHvacMode` is always `null` after card reload, causing hardcoded "heat" fallback instead of reading persistent sources
  - **Scoped PBT Approach**: Instantiate a FRESH card (simulating reload), set entity to "off" with various `attributes.last_mode` or `attributes.hvac_mode` values, configure `mode_helper` — assert that the correct mode is resolved from persistent sources instead of hardcoded "heat"
  - **Bug Condition from design**: `isBugCondition(X)` returns true when `X.entity_state = "off" AND X.card_just_loaded = true` — in-memory state is unavailable after reload
  - **Test file**: `src/__tests__/climate-timer-card.property.test.ts`
  - **Test structure**:
    - Property: For all HVAC modes in entity `attributes.last_mode`, when card is freshly loaded and entity is off, `_handleStart()` should call `climate.set_hvac_mode` with the attribute value (not hardcoded "heat")
    - Property: For all HVAC modes in `mode_helper` state (when no entity attributes available), `_handleStart()` should call `climate.set_hvac_mode` with the helper state value
    - Property: When no persistent source provides a mode, `_handleStart()` should call `climate.turn_on` without specifying a mode (not `climate.set_hvac_mode` with "heat")
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (confirms `climate.set_hvac_mode` is always called with "heat" regardless of entity attributes or helper state, because `_lastActiveHvacMode` is null after reload)
  - Document counterexamples found (e.g., "Entity off with `last_mode='cool'`: `climate.set_hvac_mode` called with 'heat' instead of 'cool'")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Timer Lifecycle and Active-Entity Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - **Test file**: `src/__tests__/climate-timer-card.property.test.ts`
  - Observe on UNFIXED code:
    - When entity is already on in any active mode (heat, cool, dry, etc.) and start is clicked: NO climate service call is made, only `timer.start` with selected duration
    - When entity is off and start is clicked: some climate call is made, then `timer.start` with selected duration
    - When `timer.start` fails and entity was off: `climate.turn_off` is called as rollback
    - Duration formatting: timer always started with exact HH:MM:SS formatted duration
  - Write property-based tests capturing observed behavior patterns:
    - Property: For entity already on in ANY active mode (generated via `fc.constantFrom`), `_handleStart()` results in only `timer.start` being called — no climate service call at all
    - Property: For any duration value (generated via `fc.integer({min: 1, max: 240})`), the timer is always started with that exact duration formatted as HH:MM:SS
    - Property: When timer start fails and entity was off before start, rollback always calls `climate.turn_off`
  - Verify tests PASS on UNFIXED code (these behaviors are already correct)
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [x] 3. Implement persistent mode resolution fix

  - [x] 3.1 Add `mode_helper` field to `ClimateTimerCardConfig` in `src/types.ts`
    - Add `mode_helper?: string;` to the config interface
    - This enables optional cross-device mode persistence via an `input_select.*` entity
    - _Requirements: 2.2, 2.6_

  - [x] 3.2 Remove `_lastActiveHvacMode` state and in-memory tracking from `climate-timer-card.ts`
    - Remove `@state() private _lastActiveHvacMode: string | null = null` property declaration
    - Remove the mode tracking block in `updated()`: the `if (currentClimateState && currentClimateState !== "off" && currentClimateState !== "unavailable") { this._lastActiveHvacMode = currentClimateState; }` lines
    - _Bug_Condition: In-memory state resets on reload, causing "heat" fallback_
    - _Preservation: External-change detection (climate off, climate unavailable) must remain_
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.3 Add `_resolveHvacMode(): string | null` method to `climate-timer-card.ts`
    - Stateless, synchronous method that reads from `this.hass.states`
    - Priority 1: Check `entity.attributes.last_mode` (skip "off"/"unavailable")
    - Priority 2: Check `entity.attributes.hvac_mode` (skip "off"/"unavailable")
    - Priority 3: Check `this._config.mode_helper` entity state (skip "unknown"/"unavailable")
    - Priority 4: Return `null` (signals caller to use `climate.turn_on`)
    - _Bug_Condition: Replaces volatile in-memory state with persistent source reads_
    - _Expected_Behavior: Mode resolved from entity attributes → helper → null (HA default)_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Update `_handleStart()` to use `_resolveHvacMode()` instead of hardcoded fallback
    - When entity is off: call `_resolveHvacMode()`
    - If result is non-null: call `climate.set_hvac_mode` with the resolved mode
    - If result is null: call `climate.turn_on` without mode parameter (let HA decide)
    - Remove the `const hvacMode = this._lastActiveHvacMode ?? "heat"` line
    - _Bug_Condition: Hardcoded "heat" fallback replaced with persistent resolution_
    - _Expected_Behavior: `_resolveHvacMode()` determines service call; null → climate.turn_on_
    - _Preservation: Entity-already-on case unchanged (no climate call); rollback unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.6_

  - [x] 3.5 Add mode helper write-back in `updated()` for cross-device sync
    - In the climate state change detection block, when climate transitions to an active mode AND `this._config.mode_helper` is configured:
    - Call `input_select.select_option` with `{ option: currentClimateState }` targeting the mode_helper entity
    - Best-effort: catch errors silently (don't break the card)
    - _Expected_Behavior: Helper entity stays in sync with active HVAC mode_
    - _Preservation: Write-back only occurs when mode_helper is configured; no side effects otherwise_
    - _Requirements: 2.4_

  - [x] 3.6 Add `mode_helper` validation in card render
    - If `this._config.mode_helper` is set but doesn't start with `input_select.`: show error message in card
    - _Requirements: 2.6_

  - [x] 3.7 Update editor to expose `mode_helper` field in `climate-timer-card-editor.ts`
    - Add a new editor row after the timer entity selector
    - Filter available entities to `input_select.*` from `this.hass.states`
    - Allow empty value (field is optional — "-- None --" option)
    - Fire `config-changed` event on selection
    - Add helper text explaining the purpose: "Optional: persists HVAC mode across reloads and devices"
    - _Requirements: 2.2, 2.6_

  - [x] 3.8 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Persistent Mode Resolution After Card Reload
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (persistent mode resolution)
    - When this test passes, it confirms: entity attributes are consulted → mode_helper is consulted → climate.turn_on used as final fallback
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.9 Verify preservation tests still pass
    - **Property 2: Preservation** - Timer Lifecycle and Active-Entity Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm entity-already-on behavior, timer lifecycle, rollback, and duration formatting are unchanged
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [x] 4. Write mode helper synchronization tests
  - **Property 3: Mode Helper Sync** - Cross-Device Mode Persistence
  - **Test file**: `src/__tests__/climate-timer-card.property.test.ts`
  - Test that when climate transitions to an active mode (heat, cool, dry, fan_only, heat_cool, auto) and `mode_helper` is configured, `input_select.select_option` is called with the active mode
  - Test that when climate transitions to an active mode without `mode_helper` configured, NO `input_select` service call is made
  - Test that when `input_select.select_option` fails, the card continues functioning normally (error is swallowed)
  - Test mode change scenarios: off→cool, heat→dry, off→auto — all should write back
  - Property-based: For all valid HVAC modes (generated via `fc.constantFrom("heat", "cool", "dry", "fan_only", "heat_cool", "auto")`), when climate transitions to that mode with helper configured, write-back always occurs
  - _Requirements: 2.4_

- [x] 5. Write unit tests for `_resolveHvacMode()` method
  - **Test file**: `src/__tests__/climate-timer-card.test.ts`
  - Test `_resolveHvacMode()` returns `attributes.last_mode` when available and valid
  - Test `_resolveHvacMode()` skips `attributes.last_mode` when it is "off" or "unavailable"
  - Test `_resolveHvacMode()` falls through to `attributes.hvac_mode` when `last_mode` is absent
  - Test `_resolveHvacMode()` skips `attributes.hvac_mode` when it is "off" or "unavailable"
  - Test `_resolveHvacMode()` falls through to `mode_helper` state when no attributes available
  - Test `_resolveHvacMode()` skips `mode_helper` when state is "unknown" or "unavailable"
  - Test `_resolveHvacMode()` returns `null` when no source provides a valid mode
  - Test `_resolveHvacMode()` returns `null` when entity is not found in hass.states
  - Test priority order: `last_mode` takes precedence over `hvac_mode` which takes precedence over `mode_helper`
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 6. Write unit tests for `_handleStart()` integration with `_resolveHvacMode()`
  - **Test file**: `src/__tests__/climate-timer-card.test.ts`
  - Test `_handleStart()` calls `climate.set_hvac_mode` when `_resolveHvacMode()` returns a mode string
  - Test `_handleStart()` calls `climate.turn_on` (without mode) when `_resolveHvacMode()` returns `null`
  - Test `_handleStart()` makes no climate call when entity is already on
  - Test `_handleStart()` rollback: turns off climate entity when timer start fails (only if entity was off)
  - Test `_handleStart()` shows error when climate service call fails
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 3.2, 3.6_

- [x] 7. Write unit tests for `mode_helper` validation and editor
  - **Test file**: `src/__tests__/editor.test.ts`
  - Test that `mode_helper` field renders in editor
  - Test that only `input_select.*` entities appear in the entity picker
  - Test that empty selection clears `mode_helper` from config
  - Test that `config-changed` event fires with correct config on selection
  - Test card render shows error when `mode_helper` doesn't start with `input_select.`
  - _Requirements: 2.6_

- [x] 8. Checkpoint - Ensure all tests pass
  - Run full test suite with `npx vitest --run`
  - Ensure all existing tests in `src/__tests__/` still pass
  - Ensure new property-based tests pass (bug condition + preservation + mode helper sync)
  - Ensure new unit tests pass (_resolveHvacMode, _handleStart, editor)
  - Ensure no TypeScript compilation errors
  - Verify editor renders correctly with new `mode_helper` field
  - Ask the user if questions arise
