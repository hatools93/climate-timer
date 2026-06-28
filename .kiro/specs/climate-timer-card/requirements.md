# Requirements Document

## Introduction

The Climate Timer Card is a custom Home Assistant Lovelace UI card that allows users to run any climate entity for a specified duration. Users configure a timer using a rotary dial interface, start the climate entity with its current settings, and the card automatically stops the entity when the countdown reaches zero. This enables energy-efficient climate control by preventing systems from running indefinitely.

The card uses a hybrid timer architecture: a server-side HA Timer helper for reliable countdown and a client-side animated display synced from the timer entity's `finishes_at` attribute.

## Glossary

- **Climate_Timer_Card**: The custom Lovelace card component that provides timer-based climate entity control
- **Climate_Entity**: A Home Assistant entity of the `climate` domain that controls heating, cooling, or HVAC systems
- **Timer_Helper**: A Home Assistant Timer helper entity (`timer.*`) used as the server-side countdown source of truth
- **Rotary_Dial**: The circular dial UI control used to increase or decrease the timer duration by dragging, scrolling, or swiping
- **Start_Button**: The centrally positioned button that initiates the climate entity and begins the countdown
- **Card_Editor**: The visual configuration UI shown in the Home Assistant card editor for selecting entities and configuring options
- **Timer_Duration**: The user-selected amount of time (in minutes) the climate entity should run
- **Elapsed_Arc**: The orange arc on the dial that grows clockwise during countdown showing elapsed time
- **Companion_Automation**: A Home Assistant automation (or blueprint) that turns off the climate entity when the timer finishes

## Requirements

### Requirement 1: Card Configuration

**User Story:** As a Home Assistant user, I want to configure the Climate Timer Card with my climate entity and timer helper, so that I can control which climate device the timer operates.

#### Acceptance Criteria

1. THE Card_Editor SHALL display a dropdown list of all entities from the `climate` domain registered in Home Assistant
2. THE Card_Editor SHALL display a dropdown list of all entities from the `timer` domain for selecting the Timer_Helper
3. WHEN a user selects a Climate_Entity in the Card_Editor, THE Climate_Timer_Card SHALL store the selected entity identifier in the card configuration
4. IF no Climate_Entity or Timer_Helper is configured, THEN THE Climate_Timer_Card SHALL display a configuration message instructing the user to select entities
5. IF the `entity` field references an entity not in the `climate` domain, THEN THE Card_Editor SHALL display a validation error
6. IF the `timer_entity` field references an entity not in the `timer` domain, THEN THE Card_Editor SHALL display a validation error
7. THE Card_Editor SHALL provide a "Max Duration" text input accepting human-friendly duration strings (e.g., "4h", "240m", "2h30m") with a default of "4h"
8. THE Card_Editor SHALL provide a "Step" text input accepting human-friendly duration strings (e.g., "15m", "30m", "1h") with a default of "15m"
9. THE Card_Editor SHALL validate that the step value does not exceed the max duration value
10. THE Card_Editor SHALL validate that max duration is at least 5m, step is at least 1m, and max duration does not exceed 24h
11. THE Card_Editor SHALL provide a "Show Name" toggle (default: on) to show or hide the entity friendly name
12. THE Card_Editor SHALL provide a "Show State" toggle (default: on) to show or hide the climate entity state
13. THE Climate_Timer_Card SHALL support HA layout options (grid resizing) without displaying the "does not support resizing" warning

### Requirement 2: Timer Duration Selection

**User Story:** As a Home Assistant user, I want to set a timer duration using a rotary dial interface, so that I can quickly and intuitively choose how long my climate system should run.

#### Acceptance Criteria

1. THE Climate_Timer_Card SHALL display a Rotary_Dial for adjusting the Timer_Duration
2. WHEN the user drags the dial clockwise, THE Climate_Timer_Card SHALL increase the Timer_Duration by the configured step value per rotation increment
3. WHEN the user drags the dial counter-clockwise, THE Climate_Timer_Card SHALL decrease the Timer_Duration by the configured step value per rotation increment
4. WHEN the user scrolls up on the dial, THE Timer_Duration SHALL increase by one step
5. WHEN the user scrolls down on the dial, THE Timer_Duration SHALL decrease by one step
6. THE Climate_Timer_Card SHALL enforce a minimum Timer_Duration equal to the configured step value
7. THE Climate_Timer_Card SHALL enforce a maximum Timer_Duration equal to the configured max duration value
8. IF the user attempts to adjust beyond boundaries, THE Timer_Duration SHALL remain at the boundary value
9. THE Rotary_Dial SHALL display a filled arc proportional to the selected duration relative to the max duration
10. THE Rotary_Dial SHALL display a draggable knob indicator at the position corresponding to the current duration
11. THE Rotary_Dial SHALL display the currently selected Timer_Duration in the center in the format "Xh Ym" (hours omitted when less than 60 minutes)
12. THE Rotary_Dial SHALL support touch drag gestures for mobile devices
13. WHILE a countdown is active, THE Rotary_Dial SHALL be non-interactive for duration selection

### Requirement 3: Start Climate Entity with Timer

**User Story:** As a Home Assistant user, I want to press a start button to activate my climate entity and begin the countdown, so that the system runs only for my chosen duration.

#### Acceptance Criteria

1. THE Climate_Timer_Card SHALL display a Start_Button centered below the dial
2. WHEN the user presses the Start_Button, THE Climate_Timer_Card SHALL call `climate.turn_on` then `timer.start` with the selected duration
3. IF `climate.turn_on` fails, THE Climate_Timer_Card SHALL not start the timer and SHALL display an error message
4. IF `timer.start` fails after `climate.turn_on` succeeds, THE Climate_Timer_Card SHALL roll back by calling `climate.turn_off`
5. WHILE a countdown is active, THE Start_Button SHALL be hidden and replaced by a Cancel button
6. IF the Climate_Entity or Timer_Helper is unavailable, THE Start_Button SHALL be disabled

### Requirement 4: Animated Countdown Display

**User Story:** As a Home Assistant user, I want to see an animated countdown inside the dial while the climate is running, so that I know how much time remains.

#### Acceptance Criteria

1. WHILE a countdown is active, THE Rotary_Dial center SHALL display the remaining time in "MM:SS" format
2. THE countdown display SHALL update every 1 second with smooth animation
3. WHILE a countdown is active, THE Rotary_Dial SHALL display an Elapsed_Arc in orange color that grows clockwise from the top as time passes
4. THE Elapsed_Arc SHALL animate smoothly with a 1-second CSS transition between updates
5. A faint blue background ring SHALL remain visible under the Elapsed_Arc to provide context
6. IF the browser tab is hidden or the user navigates to a different view and returns, THE countdown SHALL resume correctly by re-syncing from the timer entity's `finishes_at` timestamp
7. THE countdown SHALL use the timer entity's `finishes_at` attribute (not local timekeeping) to maintain accuracy

### Requirement 5: Automatic Climate Entity Shutdown

**User Story:** As a Home Assistant user, I want the climate entity to automatically stop when the timer reaches zero, so that I save energy.

#### Acceptance Criteria

1. A companion Home Assistant automation or blueprint SHALL call `climate.turn_off` when the Timer_Helper fires a `timer.finished` event
2. THE Climate_Timer_Card SHALL observe the Timer_Helper transitioning to "idle" and reset the UI to idle state
3. WHEN the timer finishes, THE Rotary_Dial SHALL return to duration selection mode

### Requirement 6: Manual Timer Cancellation

**User Story:** As a Home Assistant user, I want to cancel a running timer, so that I can stop the climate entity early.

#### Acceptance Criteria

1. WHILE a countdown is active, THE Climate_Timer_Card SHALL display a Cancel button (red) in place of the Start_Button
2. WHEN the user presses the Cancel button, THE Climate_Timer_Card SHALL call `timer.cancel` then `climate.turn_off`
3. WHEN cancelled, THE Rotary_Dial SHALL return to duration selection mode
4. Error messages from service call failures SHALL auto-dismiss after 5 seconds

### Requirement 7: Entity State Awareness

**User Story:** As a Home Assistant user, I want the card to reflect the current state of my climate entity, so that I have accurate information even if the entity is controlled externally.

#### Acceptance Criteria

1. THE Climate_Timer_Card SHALL display the current state of the Climate_Entity (when Show State is enabled)
2. IF the Climate_Entity becomes unavailable, THE Start_Button SHALL be disabled and an unavailable indicator shown
3. IF the Climate_Entity is turned off externally during a countdown, THE Climate_Timer_Card SHALL cancel the Timer_Helper and reset to idle
4. IF the Climate_Entity becomes unavailable during a countdown, THE Climate_Timer_Card SHALL cancel the Timer_Helper and reset to idle
5. WHEN the Climate_Entity state changes, THE display SHALL update within the next render cycle

### Requirement 8: Card Visual Structure

**User Story:** As a Home Assistant user, I want the card to have a clear and organized layout.

#### Acceptance Criteria

1. THE Climate_Timer_Card SHALL render within a standard Home Assistant card container (ha-card)
2. WHEN Show Name is enabled, THE card SHALL display the Climate_Entity friendly name at the top
3. WHEN Show State is enabled, THE card SHALL display the Climate_Entity state below the name
4. WHEN both Show Name and Show State are disabled, THE card SHALL remove top padding for a compact layout
5. THE Rotary_Dial SHALL be the central visual element of the card
6. THE Start/Cancel button SHALL appear centered below the dial
7. THE card SHALL support HA grid layout resizing (min 2 columns, min 2 rows)
