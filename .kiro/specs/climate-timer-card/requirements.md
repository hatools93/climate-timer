# Requirements Document

## Introduction

The Climate Timer Card is a custom Home Assistant Lovelace UI card that allows users to run any climate entity for a specified duration. Users configure a timer using a scroll-wheel-like interface, start the climate entity with its current settings, and the card automatically stops the entity when the countdown reaches zero. This enables energy-efficient climate control by preventing systems from running indefinitely.

## Glossary

- **Climate_Timer_Card**: The custom Lovelace card component that provides timer-based climate entity control
- **Climate_Entity**: A Home Assistant entity of the `climate` domain that controls heating, cooling, or HVAC systems
- **Timer_Display**: The visual countdown element showing remaining time in minutes and seconds
- **Timer_Selector**: The scroll-wheel-like UI control used to increase or decrease the timer duration
- **Start_Button**: The centrally positioned button that initiates the climate entity and begins the countdown
- **Card_Editor**: The visual configuration UI shown in the Home Assistant card editor for selecting the climate entity
- **Timer_Duration**: The user-selected amount of time (in minutes) the climate entity should run
- **Countdown_Animation**: The visual animation indicating time remaining during an active countdown

## Requirements

### Requirement 1: Card Configuration

**User Story:** As a Home Assistant user, I want to configure the Climate Timer Card with my climate entity, so that I can control which climate device the timer operates.

#### Acceptance Criteria

1. THE Card_Editor SHALL display a dropdown list of all entities from the `climate` domain registered in Home Assistant
2. WHEN a user selects a Climate_Entity in the Card_Editor, THE Climate_Timer_Card SHALL store the selected entity identifier in the card configuration
3. IF no Climate_Entity is configured, THEN THE Climate_Timer_Card SHALL display a configuration message in place of the normal card content instructing the user to select a climate entity
4. THE Card_Editor SHALL accept a YAML configuration with an `entity` field specifying the Climate_Entity identifier
5. IF the `entity` field in the YAML configuration references an entity that does not exist or is not in the `climate` domain, THEN THE Card_Editor SHALL display an error indication identifying the invalid entity value

### Requirement 2: Timer Duration Selection

**User Story:** As a Home Assistant user, I want to set a timer duration using a scroll-wheel-like interface, so that I can quickly and intuitively choose how long my climate system should run.

#### Acceptance Criteria

1. THE Climate_Timer_Card SHALL display a Timer_Selector with a scroll-wheel-like interface for adjusting the Timer_Duration
2. WHEN the user scrolls up or swipes up on the Timer_Selector, THE Climate_Timer_Card SHALL increase the Timer_Duration by 5 minutes per step
3. WHEN the user scrolls down or swipes down on the Timer_Selector, THE Climate_Timer_Card SHALL decrease the Timer_Duration by 5 minutes per step
4. THE Climate_Timer_Card SHALL enforce a minimum Timer_Duration of 5 minutes
5. THE Climate_Timer_Card SHALL enforce a maximum Timer_Duration of 480 minutes
6. IF the user attempts to increase the Timer_Duration beyond 480 minutes, THEN THE Climate_Timer_Card SHALL keep the Timer_Duration at 480 minutes
7. IF the user attempts to decrease the Timer_Duration below 5 minutes, THEN THE Climate_Timer_Card SHALL keep the Timer_Duration at 5 minutes
8. THE Climate_Timer_Card SHALL display the currently selected Timer_Duration in the format "Xh Ym" where X is hours and Y is remaining minutes, omitting the hours portion when the duration is less than 60 minutes
9. WHEN the Climate_Timer_Card is first rendered with no countdown active, THE Climate_Timer_Card SHALL display a default Timer_Duration of 30 minutes
10. WHILE no countdown is active, THE Timer_Selector SHALL be interactive and allow duration adjustments

### Requirement 3: Start Climate Entity with Timer

**User Story:** As a Home Assistant user, I want to press a start button to activate my climate entity and begin the countdown, so that the system runs only for my chosen duration.

#### Acceptance Criteria

1. THE Climate_Timer_Card SHALL display a Start_Button in the center of the card
2. WHILE a Timer_Duration greater than zero is selected and no countdown is active, THE Start_Button SHALL be enabled
3. WHEN the user presses the Start_Button, THE Climate_Timer_Card SHALL call the `climate.turn_on` service for the configured Climate_Entity and, upon successful service call, start the countdown using the selected Timer_Duration
4. WHEN the user presses the Start_Button, THE Climate_Timer_Card SHALL use the Climate_Entity's current settings (mode, target temperature, fan speed) without modification
5. IF the `climate.turn_on` service call fails when the user presses the Start_Button, THEN THE Climate_Timer_Card SHALL not start the countdown, SHALL keep the Start_Button enabled, and SHALL display an error message indicating the climate entity could not be activated
6. WHILE a countdown is active, THE Start_Button SHALL be hidden

### Requirement 4: Animated Countdown Display

**User Story:** As a Home Assistant user, I want to see an animated countdown while the climate is running, so that I know how much time remains.

#### Acceptance Criteria

1. WHILE a countdown is active, THE Timer_Display SHALL show the remaining time in "MM:SS" format, where MM is zero-padded minutes and SS is zero-padded seconds
2. WHILE a countdown is active, THE Timer_Display SHALL update every 1 second, decrementing the displayed remaining time by one second per update
3. WHILE a countdown is active, THE Climate_Timer_Card SHALL display a Countdown_Animation that visually represents the proportion of elapsed time to the total Timer_Duration, progressing from full at the start to empty at zero
4. WHILE a countdown is active, THE Timer_Selector SHALL be disabled and non-interactive, preventing any scroll or swipe input from modifying the Timer_Duration
5. IF the browser tab becomes hidden or inactive during an active countdown, THEN THE Climate_Timer_Card SHALL maintain accurate remaining time by calculating elapsed time from the countdown start timestamp rather than relying solely on interval ticks

### Requirement 5: Automatic Climate Entity Shutdown

**User Story:** As a Home Assistant user, I want the climate entity to automatically stop when the timer reaches zero, so that I save energy and don't need to remember to turn it off.

#### Acceptance Criteria

1. WHEN the Timer_Display reaches zero, THE Climate_Timer_Card SHALL call the `climate.turn_off` service for the configured Climate_Entity
2. WHEN the Timer_Display reaches zero, THE Climate_Timer_Card SHALL reset the Timer_Display to show the previously selected Timer_Duration and stop the Countdown_Animation
3. WHEN the Timer_Display reaches zero, THE Timer_Selector SHALL become interactive again
4. IF the `climate.turn_off` service call fails when the Timer_Display reaches zero, THEN THE Climate_Timer_Card SHALL still reset to the idle state and display an error indicator for at least 5 seconds

### Requirement 6: Manual Timer Cancellation

**User Story:** As a Home Assistant user, I want to cancel a running timer, so that I can stop the climate entity early or change my mind.

#### Acceptance Criteria

1. WHILE a countdown is active, THE Climate_Timer_Card SHALL display a cancel button in place of the Start_Button
2. WHEN the user presses the cancel button, THE Climate_Timer_Card SHALL call the `climate.turn_off` service for the configured Climate_Entity
3. WHEN the user presses the cancel button, THE Climate_Timer_Card SHALL stop the countdown and reset the Timer_Display to the idle state
4. WHEN the user presses the cancel button, THE Timer_Selector SHALL become interactive again

### Requirement 7: Entity State Awareness

**User Story:** As a Home Assistant user, I want the card to reflect the current state of my climate entity, so that I have accurate information even if the entity is controlled externally.

#### Acceptance Criteria

1. THE Climate_Timer_Card SHALL display the current state of the configured Climate_Entity (off, heating, cooling, idle, drying, fan running, or any other state reported by the Home Assistant climate domain)
2. IF the Climate_Entity becomes unavailable while no countdown is active, THEN THE Climate_Timer_Card SHALL disable the Start_Button and display an unavailable indicator
3. IF the Climate_Entity becomes unavailable while a countdown is active, THEN THE Climate_Timer_Card SHALL stop the countdown, disable the Start_Button, display an unavailable indicator, and restore the Timer_Selector to an interactive state
4. IF the Climate_Entity is turned off externally while a countdown is active, THEN THE Climate_Timer_Card SHALL stop the countdown, reset the Timer_Display to the idle state, and restore the Timer_Selector to an interactive state
5. WHEN the Climate_Entity state changes, THE Climate_Timer_Card SHALL update the displayed state within 2 seconds of receiving the state change event from Home Assistant

### Requirement 8: Card Visual Structure

**User Story:** As a Home Assistant user, I want the card to have a clear and organized layout, so that I can easily read the timer and interact with controls.

#### Acceptance Criteria

1. THE Climate_Timer_Card SHALL render within a standard Home Assistant card container with rounded corners and shadow
2. THE Climate_Timer_Card SHALL display the Climate_Entity friendly name at the top of the card
3. THE Climate_Timer_Card SHALL arrange elements in vertical order from top to bottom: entity name, entity state, Timer_Selector, Start_Button
4. THE Climate_Timer_Card SHALL position the Timer_Selector as the largest visual element by area, positioned between the entity name and the Start_Button
5. THE Climate_Timer_Card SHALL position the Start_Button centrally below the Timer_Selector
6. THE Climate_Timer_Card SHALL not overflow, clip, or render elements unreadable at minimum 1-column Home Assistant dashboard grid width
