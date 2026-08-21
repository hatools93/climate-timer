# Preserve HVAC Mode on Start - Bugfix Design

## Overview

The current implementation tracks the last-active HVAC mode in an in-memory `@state()` property (`_lastActiveHvacMode`) that resets on card reload, is not shared across devices/tabs, and falls back to a hardcoded "heat" mode. The fix replaces this with a stateless `_resolveHvacMode(): string | null` method that reads the mode from persistent sources at call time: first from the climate entity's attributes (`last_mode` or `hvac_mode` when off), then from an optional `input_select` helper entity (`mode_helper`), and finally returns `null` to signal the caller should use `climate.turn_on` without specifying a mode. The in-memory state tracking and hardcoded "heat" fallback are removed entirely.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — the card reloads while the climate entity is off, causing loss of the in-memory HVAC mode and defaulting to "heat"
- **Property (P)**: The desired behavior — mode is resolved from persistent sources (entity attributes → mode helper → HA default) instead of volatile in-memory state
- **Preservation**: Timer start/cancel lifecycle, error handling, rollback behavior, external-change detection, and UI rendering must remain unchanged
- **`_resolveHvacMode()`**: New stateless method that reads `this.hass.states` to determine the HVAC mode to restore, returning `string | null`
- **`mode_helper`**: Optional `input_select.*` entity configured in the card that persists the last-active HVAC mode across reloads and devices
- **`_handleStart()`**: The method in `climate-timer-card.ts` that turns on the climate entity and starts the timer helper
- **Active HVAC mode**: Any climate entity state that is not "off" and not "unavailable" (e.g., "heat", "cool", "dry", "fan_only", "heat_cool", "auto")

## Bug Details

### Bug Condition

The bug manifests when the card reloads (page refresh, dashboard navigation, or access from another device/tab) while the climate entity is off. The `_lastActiveHvacMode` in-memory state resets to `null`, causing the system to fall back to hardcoded "heat" instead of resolving the actual last-used mode from persistent sources.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type StartTimerInput { entity_state, entity_attributes, mode_helper_state, card_just_loaded }
  OUTPUT: boolean
  
  // The bug triggers when the entity is off and the card relies on
  // in-memory state that has been lost due to reload/navigation,
  // OR when cross-device usage means the in-memory state is unavailable
  RETURN input.entity_state = "off" AND input.card_just_loaded = true
END FUNCTION
```

### Examples

- **Card reloads, entity off, `attributes.last_mode` = "cool"**: Expected — timer starts in "cool" mode. Actual (current) — starts in "heat" because in-memory state is lost.
- **Card reloads, entity off, `attributes.hvac_mode` = "dry"**: Expected — timer starts in "dry" mode. Actual — starts in "heat".
- **Different device, entity off, `mode_helper` state = "fan_only"**: Expected — timer starts in "fan_only" mode. Actual — starts in "heat" because in-memory state is per-client.
- **Card reloads, entity off, no attributes, no mode_helper**: Expected — `climate.turn_on` called without mode (HA decides default). Actual — `climate.set_hvac_mode` called with hardcoded "heat".
- **Entity already on in "cool" mode, card reloads**: Expected — timer starts without changing mode. Actual — same (no bug for this case, entity is already on).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Timer helper starts with the user-selected duration via `timer.start`
- If the timer helper fails to start, the climate entity is rolled back to "off" (only if it was off before start)
- The start button is disabled when the climate entity is unavailable
- The cancel button cancels the timer and turns off the climate entity
- Climate turned off externally during countdown cancels the timer helper
- Climate becoming unavailable during countdown cancels the timer helper
- Duration selection, display interval management, and UI rendering are unaffected
- If the climate entity is already on, no climate service call is made on start

**Scope:**
All inputs where the entity is already on should produce behavior identical to the current implementation (no climate service call, just start the timer). The timer lifecycle (start, cancel, rollback) and external-change detection logic must not be modified.

## Hypothesized Root Cause

Based on the bug description, the root causes are:

1. **Volatile in-memory state**: `_lastActiveHvacMode` is a `@state()` property that resets to `null` on every card instantiation (page reload, dashboard navigation). It has no persistence mechanism.

2. **Single-client scope**: In-memory state is per browser tab. Other devices or tabs have no access to the tracked mode.

3. **Hardcoded "heat" fallback**: When `_lastActiveHvacMode` is `null` (always after reload with entity off), the code falls back to `"heat"` via `this._lastActiveHvacMode ?? "heat"` instead of consulting persistent sources.

4. **Ignoring available persistent data**: The climate entity often exposes `attributes.last_mode` or retains `attributes.hvac_mode` even when off. These are already available in `this.hass.states` but are never consulted.

The fix requires:
- Removing `_lastActiveHvacMode` state and its tracking in `updated()`
- Adding a stateless `_resolveHvacMode()` method that reads persistent sources
- Adding optional `mode_helper` config for cross-device persistence
- Writing back to `mode_helper` when climate transitions to an active mode
- Replacing the hardcoded "heat" fallback with `climate.turn_on` (no mode specified)

## Correctness Properties

Property 1: Bug Condition - Persistent Mode Resolution on Start

_For any_ start action where the climate entity is off and the card has just loaded (in-memory state unavailable), the fixed `_handleStart()` function SHALL resolve the HVAC mode from persistent sources in priority order: (1) climate entity `attributes.last_mode` or `attributes.hvac_mode`, (2) configured `mode_helper` entity state, (3) call `climate.turn_on` without a mode parameter if no source provides a mode.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Timer Lifecycle and Active-Entity Behavior Unchanged

_For any_ start action where the entity is already on, OR where the entity is off and a mode is successfully resolved, the fixed `_handleStart()` function SHALL produce the same observable timer lifecycle behavior as the original: timer starts with selected duration, rollback occurs on timer failure (only if entity was off), and active entities are not modified.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

Property 3: Mode Helper Synchronization

_For any_ climate entity state transition to an active HVAC mode, when a `mode_helper` entity is configured, the system SHALL write the active mode to the helper via `input_select.select_option`, enabling cross-device and cross-reload persistence.

**Validates: Requirements 2.4**

## Fix Implementation

### Changes Required

**File**: `src/types.ts`

**Change**: Add optional `mode_helper` field to `ClimateTimerCardConfig`

```typescript
mode_helper?: string;  // e.g. "input_select.ac_last_mode" — optional cross-device mode persistence
```

---

**File**: `src/components/climate-timer-card.ts`

**Removals**:
1. Remove `@state() private _lastActiveHvacMode: string | null = null` property declaration
2. Remove the mode tracking block in `updated()`:
   ```typescript
   // Remove this:
   if (currentClimateState && currentClimateState !== "off" && currentClimateState !== "unavailable") {
     this._lastActiveHvacMode = currentClimateState;
   }
   ```

**Additions**:

1. **Add `_resolveHvacMode(): string | null` method** — stateless, synchronous, reads from `this.hass.states`:
   ```typescript
   private _resolveHvacMode(): string | null {
     const entity = this.hass?.states[this._config?.entity];
     if (!entity) return null;

     // Priority 1: Climate entity attributes (persistent across reloads)
     const lastMode = entity.attributes.last_mode;
     if (lastMode && lastMode !== "off" && lastMode !== "unavailable") {
       return lastMode;
     }
     const hvacMode = entity.attributes.hvac_mode;
     if (hvacMode && hvacMode !== "off" && hvacMode !== "unavailable") {
       return hvacMode;
     }

     // Priority 2: mode_helper entity (cross-device persistence)
     if (this._config?.mode_helper) {
       const helperState = this.hass.states[this._config.mode_helper]?.state;
       if (helperState && helperState !== "unknown" && helperState !== "unavailable") {
         return helperState;
       }
     }

     // Priority 3: No mode found — caller should use climate.turn_on
     return null;
   }
   ```

2. **Add mode helper write-back in `updated()`** — when climate transitions to active mode:
   ```typescript
   // In the climate state change detection block:
   if (
     currentClimateState &&
     currentClimateState !== "off" &&
     currentClimateState !== "unavailable" &&
     this._config?.mode_helper
   ) {
     // Best-effort write-back to mode helper for cross-device sync
     this.hass
       .callService("input_select", "select_option", {
         option: currentClimateState,
       }, { entity_id: this._config.mode_helper })
       .catch(() => { /* best-effort, don't break the card */ });
   }
   ```

3. **Update `_handleStart()` logic** — replace hardcoded fallback:
   ```typescript
   if (!entityAlreadyOn) {
     try {
       const resolvedMode = this._resolveHvacMode();
       if (resolvedMode) {
         await this.hass.callService('climate', 'set_hvac_mode', { hvac_mode: resolvedMode }, { entity_id: this._config.entity });
       } else {
         await this.hass.callService('climate', 'turn_on', {}, { entity_id: this._config.entity });
       }
     } catch (e) {
       this._showError('Failed to turn on climate entity');
       return;
     }
   }
   ```

4. **Add `mode_helper` validation in `render()`** — show error if configured incorrectly:
   ```typescript
   if (this._config.mode_helper && !this._config.mode_helper.startsWith("input_select.")) {
     // Render error: "Invalid mode_helper: must be an input_select entity"
   }
   ```

---

**File**: `src/components/climate-timer-card-editor.ts`

**Addition**: Add an optional `mode_helper` field (text input or entity picker filtered to `input_select.*`):
- Add a new editor row after the timer entity selector
- Filter to `input_select.*` entities from `this.hass.states`
- Allow empty value (field is optional)
- Fire `config-changed` on selection

---

### Summary of Approach

| Aspect | Old (in-memory) | New (stateless) |
|--------|-----------------|-----------------|
| Mode source | `_lastActiveHvacMode` state property | `_resolveHvacMode()` reads entity attributes + helper |
| Persistence | None (resets on reload) | Climate attributes + optional `input_select` |
| Cross-device | No | Yes (via `mode_helper`) |
| Fallback | Hardcoded "heat" | `climate.turn_on` (HA decides) |
| State tracking | `updated()` writes to state | `updated()` writes to `mode_helper` (best-effort) |

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that mock `hass.callService` and assert which service calls are made when `_handleStart()` is invoked after a simulated card reload (fresh instantiation) with the entity off and various attribute states. Run these tests on the UNFIXED code to observe that `climate.set_hvac_mode` is always called with "heat".

**Test Cases**:
1. **Reload with `last_mode` attribute**: Instantiate card fresh, entity off, `attributes.last_mode = "cool"` — assert `set_hvac_mode` called with "heat" not "cool" (demonstrates bug on unfixed code)
2. **Reload with `hvac_mode` attribute**: Instantiate card fresh, entity off, `attributes.hvac_mode = "dry"` — assert "heat" is used (demonstrates bug)
3. **Reload with `mode_helper` configured**: Instantiate card fresh, entity off, `mode_helper` state = "fan_only" — assert "heat" is used (demonstrates bug, helper not consulted)
4. **Reload with no persistent source**: Instantiate card fresh, entity off, no attributes, no helper — assert "heat" is hardcoded instead of `climate.turn_on`

**Expected Counterexamples**:
- `climate.set_hvac_mode` is always called with "heat" regardless of entity attributes or helper state
- Root cause confirmed: `_lastActiveHvacMode` is `null` after reload, `?? "heat"` fallback kicks in

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := handleStart_fixed(input)
  
  IF input.entity_attributes.last_mode != null THEN
    ASSERT climate.set_hvac_mode called WITH hvac_mode = input.entity_attributes.last_mode
  ELSE IF input.entity_attributes.hvac_mode != null THEN
    ASSERT climate.set_hvac_mode called WITH hvac_mode = input.entity_attributes.hvac_mode
  ELSE IF input.mode_helper_state != null THEN
    ASSERT climate.set_hvac_mode called WITH hvac_mode = input.mode_helper_state
  ELSE
    ASSERT climate.turn_on called WITHOUT hvac_mode parameter
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleStart_original(input).service_calls = handleStart_fixed(input).service_calls
  // Timer start, rollback on failure, error display — all unchanged
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for entity-already-on cases and timer lifecycle, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Entity Already On Preservation**: Verify that when entity is on in any mode, no climate service call is made — behavior identical before and after fix
2. **Timer Start Preservation**: Verify timer helper is started with selected duration regardless of mode resolution
3. **Rollback Preservation**: Verify that if timer start fails and entity was off, climate entity is turned off
4. **Cancel Preservation**: Verify cancel still cancels timer and turns off entity
5. **External Off Preservation**: Verify external climate-off during countdown still cancels timer

### Mode Helper Sync Checking

**Goal**: Verify that mode_helper write-back occurs correctly on climate state transitions.

**Test Cases**:
1. **Write-back on activation**: Climate transitions from "off" to "cool" with `mode_helper` configured — assert `input_select.select_option` called with "cool"
2. **Write-back on mode change**: Climate transitions from "heat" to "dry" with `mode_helper` configured — assert `input_select.select_option` called with "dry"
3. **No write-back without config**: Climate transitions to active mode without `mode_helper` configured — assert no `input_select` service call
4. **Error resilience**: `input_select.select_option` call fails — assert card continues functioning normally

### Unit Tests

- Test `_resolveHvacMode()` returns `attributes.last_mode` when available
- Test `_resolveHvacMode()` falls through to `attributes.hvac_mode` when `last_mode` absent
- Test `_resolveHvacMode()` falls through to `mode_helper` state when no attributes available
- Test `_resolveHvacMode()` returns `null` when no source provides a mode
- Test `_resolveHvacMode()` skips "off" and "unavailable" values in attributes
- Test `_handleStart()` calls `climate.set_hvac_mode` when `_resolveHvacMode()` returns a mode
- Test `_handleStart()` calls `climate.turn_on` when `_resolveHvacMode()` returns `null`
- Test `_handleStart()` makes no climate call when entity is already on
- Test `mode_helper` validation: error shown if value doesn't start with `input_select.`
- Test rollback only occurs when entity was off before start

### Property-Based Tests

- Generate random HVAC modes and attribute combinations, verify `_resolveHvacMode()` respects priority order (last_mode > hvac_mode > helper > null)
- Generate random entity states and verify entity-already-on case never makes a climate service call
- Generate random helper states and verify write-back occurs only when `mode_helper` is configured and climate transitions to active mode
- Generate sequences of card reload + start scenarios and verify correct mode resolution without "heat" hardcode

### Integration Tests

- Test full flow: entity off with `attributes.last_mode = "cool"` → fresh card load → start timer → verify `climate.set_hvac_mode` called with "cool"
- Test full flow: entity off, no attributes, `mode_helper` = "dry" → start → verify "dry" mode used
- Test full flow: entity off, no attributes, no helper → start → verify `climate.turn_on` called (no mode)
- Test mode helper sync: entity transitions "off" → "cool" with helper configured → verify helper updated → reload card → start → verify "cool" resolved from helper
- Test editor: configure `mode_helper` field → verify config-changed event fires with correct value
