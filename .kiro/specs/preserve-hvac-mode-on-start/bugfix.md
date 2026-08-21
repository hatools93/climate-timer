# Bugfix Requirements Document

## Introduction

The `_lastActiveHvacMode` in-memory state used to track the previous HVAC mode resets on card reload (page refresh, dashboard navigation). When the AC is off at card load time, the card loses track of the previous mode entirely. Additionally, the in-memory approach is not shared across devices or browser tabs. This fix replaces the in-memory tracking with a stateless, persistent, cross-device mode resolution strategy using a defined priority order: climate entity attributes → optional `input_select` helper → `climate.turn_on` fallback.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the card reloads (page refresh or dashboard navigation) and the climate entity is off THEN the system loses the previously tracked HVAC mode because `_lastActiveHvacMode` resets to `null`

1.2 WHEN the climate entity is off and the card has just loaded THEN the system falls back to hardcoded "heat" mode instead of resolving the actual last-used mode

1.3 WHEN the user starts the timer from a different device or browser tab THEN the system cannot access the HVAC mode tracked in-memory on another client

1.4 WHEN the climate entity is off and no in-memory mode is available THEN the system hardcodes "heat" as the fallback instead of letting Home Assistant decide the default mode naturally

### Expected Behavior (Correct)

2.1 WHEN the climate entity is off and the entity's attributes contain a last known HVAC mode (e.g., `attributes.last_mode` or `attributes.hvac_mode`) THEN the system SHALL use that attribute value as the mode to restore via `climate.set_hvac_mode`

2.2 WHEN the climate entity is off, no usable mode is found in entity attributes, and a `mode_helper` entity is configured THEN the system SHALL read the mode from the configured `input_select` helper entity's state

2.3 WHEN the climate entity is off and neither entity attributes nor `mode_helper` provide a usable mode THEN the system SHALL call `climate.turn_on` without specifying a mode, letting Home Assistant decide the default

2.4 WHEN the climate entity transitions to an active HVAC mode and a `mode_helper` entity is configured THEN the system SHALL write the active mode to the `mode_helper` entity via `input_select.select_option` to keep it in sync

2.5 WHEN the climate entity is already on in any active mode and the user starts the timer THEN the system SHALL start the timer without changing the HVAC mode

2.6 WHEN the `mode_helper` config field is provided THEN the system SHALL validate that it belongs to the `input_select.*` domain

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user starts the timer THEN the system SHALL CONTINUE TO start the timer helper with the selected duration

3.2 WHEN the timer helper fails to start THEN the system SHALL CONTINUE TO roll back by turning off the climate entity (only if it was off before the start action)

3.3 WHEN the climate entity is unavailable THEN the system SHALL CONTINUE TO disable the start button

3.4 WHEN the user cancels an active timer THEN the system SHALL CONTINUE TO cancel the timer and turn off the climate entity

3.5 WHEN the climate entity is turned off externally during an active countdown THEN the system SHALL CONTINUE TO cancel the timer helper

3.6 WHEN the climate entity is already on and the user starts the timer THEN the system SHALL CONTINUE TO skip any climate service call (mode preserved by inaction)

---

## Bug Condition (Formal)

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type StartTimerInput (entity_state, entity_attributes, mode_helper_state, card_just_loaded)
  OUTPUT: boolean
  
  // The bug triggers when the entity is off and the card relies on
  // in-memory state that has been lost due to reload/navigation,
  // OR when cross-device usage means the in-memory state is unavailable
  RETURN X.entity_state = "off" AND X.card_just_loaded = true
END FUNCTION
```

### Fix Checking Property

```pascal
// Property: Fix Checking - Persistent Mode Resolution
FOR ALL X WHERE isBugCondition(X) DO
  result ← handleStart'(X)
  
  IF X.entity_attributes.last_mode != null OR X.entity_attributes.hvac_mode != null THEN
    // Primary: use entity attribute
    mode := X.entity_attributes.last_mode ?? X.entity_attributes.hvac_mode
    ASSERT climate.set_hvac_mode was called WITH hvac_mode = mode
    
  ELSE IF X.mode_helper_state != null AND X.mode_helper_state != "" THEN
    // Secondary: use input_select helper
    ASSERT climate.set_hvac_mode was called WITH hvac_mode = X.mode_helper_state
    
  ELSE
    // Final fallback: let HA decide
    ASSERT climate.turn_on was called WITHOUT hvac_mode parameter
  END IF
END FOR
```

### Preservation Checking Property

```pascal
// Property: Preservation Checking - Timer Lifecycle and Active-Entity Behavior Unchanged
FOR ALL X WHERE NOT isBugCondition(X) DO
  // When entity is already on, or when entity is off but card has tracked mode
  // in the same session, the timer lifecycle behavior is unchanged
  ASSERT F(X) = F'(X)
END FOR
```

### Mode Helper Sync Property

```pascal
// Property: Mode Helper Synchronization
FOR ALL X WHERE X.mode_helper IS configured DO
  WHEN climate_entity transitions from any state TO active_hvac_mode DO
    ASSERT input_select.select_option was called WITH 
      entity_id = X.mode_helper AND option = active_hvac_mode
  END WHEN
END FOR
```
