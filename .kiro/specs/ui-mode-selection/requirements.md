# Requirements Document

## Introduction

This feature adds a UI mode selection option to the Climate Timer Card, allowing users to choose between the existing Rotary UI (dial-based timer selector) and a new Simple UI (button-based timer selector with + and - controls). The configuration option is exposed in the card editor and persisted in the Lovelace YAML config. Both UI modes follow Home Assistant Lovelace UI design standards and support dark and light themes.

## Glossary

- **Card_Editor**: The visual configuration panel (`climate-timer-card-editor`) shown when editing the card in Home Assistant's Lovelace editor.
- **Card**: The main Climate Timer Card component (`climate-timer-card`) that renders the timer interface.
- **Rotary_UI**: The existing dial-based timer selector that uses drag/scroll gestures to adjust duration and displays a circular countdown arc when active.
- **Simple_UI**: A new button-based timer selector that uses + and - buttons flanking a duration/remaining display to adjust the timer value.
- **UI_Mode**: A configuration property (`ui_mode`) that determines which timer selector interface the card renders. Valid values are `"rotary"` and `"simple"`.
- **Duration_Display**: The text element in the Simple UI that shows the selected duration (idle state) or remaining countdown time (active state).
- **Step**: The configured increment/decrement amount applied when the user presses + or - buttons (same value used by the Rotary UI).
- **HA_Theme_Variables**: CSS custom properties provided by Home Assistant (e.g., `--primary-color`, `--primary-text-color`, `--card-background-color`) that enable theme-aware styling.

## Requirements

### Requirement 1: UI Mode Configuration Property

**User Story:** As a user, I want to choose between Rotary UI and Simple UI when configuring my card, so that I can use the interaction style I prefer.

#### Acceptance Criteria

1. THE Card SHALL accept a `ui_mode` configuration property with valid values `"rotary"` and `"simple"`.
2. IF the `ui_mode` property is not specified in the configuration, THEN THE Card SHALL default to `"rotary"`.
3. IF `ui_mode` is set to a value other than `"rotary"` or `"simple"`, THEN THE Card SHALL fall back to `"rotary"` and render the Rotary_UI timer selector.
4. WHEN `ui_mode` is set to `"rotary"`, THE Card SHALL render the Rotary_UI timer selector.
5. WHEN `ui_mode` is set to `"simple"`, THE Card SHALL render the Simple_UI timer selector.
6. THE Card Editor SHALL provide a selection control for the `ui_mode` property, presenting `"rotary"` and `"simple"` as the available options.

### Requirement 2: Card Editor UI Mode Selection

**User Story:** As a user, I want to select the UI mode from the card editor, so that I can configure the interface without editing YAML directly.

#### Acceptance Criteria

1. THE Card_Editor SHALL display a UI mode selection control with exactly two options labeled "Rotary" and "Simple", corresponding to configuration values `rotary` and `simple` respectively.
2. WHEN the user changes the UI mode selection, THE Card_Editor SHALL fire a `config-changed` CustomEvent whose `detail.config` object contains the complete card configuration with `ui_mode` set to the selected value (`rotary` or `simple`), with `bubbles: true` and `composed: true`.
3. THE Card_Editor SHALL display the option whose value matches the current `ui_mode` property in the card configuration as the selected option.
4. IF the card configuration does not include a `ui_mode` property or `ui_mode` is undefined, THEN THE Card_Editor SHALL display "Rotary" (value `rotary`) as the selected option.

### Requirement 3: Simple UI Idle State Layout

**User Story:** As a user, I want to see + and - buttons with the duration displayed between them, so that I can easily adjust the timer value.

#### Acceptance Criteria

1. WHILE the timer entity state is `"idle"` AND `ui_mode` is `"simple"`, THE Simple_UI SHALL render a decrement button, a Duration_Display, and an increment button in a horizontal row, in that left-to-right order.
2. WHILE the timer is idle, THE Duration_Display SHALL show the currently selected duration formatted as: `"{m}m"` when the duration is less than 60 minutes (e.g., "15m", "30m"), or `"{h}h {r}m"` when the duration is 60 minutes or greater, where h is the whole hours and r is the remaining minutes (e.g., "1h 0m", "1h 15m", "4h 0m").
3. WHEN the user activates the increment button, THE Simple_UI SHALL increase the duration by one Step (as defined by the `step` configuration value, default 15 minutes) and fire a `duration-changed` CustomEvent with `detail.duration` set to the new duration value in minutes.
4. WHEN the user activates the decrement button, THE Simple_UI SHALL decrease the duration by one Step (as defined by the `step` configuration value, default 15 minutes) and fire a `duration-changed` CustomEvent with `detail.duration` set to the new duration value in minutes.
5. WHEN the current duration equals the maximum configured duration (as defined by the `max_duration` configuration value, default 240 minutes), THE Simple_UI SHALL disable the increment button so that it is not activatable.
6. WHEN the current duration equals one Step (the minimum allowed duration), THE Simple_UI SHALL disable the decrement button so that it is not activatable.
7. IF the duration would exceed the maximum configured duration after an increment, THEN THE Simple_UI SHALL clamp the duration to the maximum configured duration.
8. IF the duration would go below one Step after a decrement, THEN THE Simple_UI SHALL clamp the duration to one Step (the minimum).

### Requirement 4: Simple UI Active State (Countdown)

**User Story:** As a user, I want to see the remaining time during an active countdown in Simple UI mode, so that I know how much time is left.

#### Acceptance Criteria

1. WHILE the timer entity state is `"active"` AND `ui_mode` is `"simple"`, THE Simple_UI SHALL display the remaining countdown time (computed as `finishes_at` minus current time, floored to whole seconds) in the Duration_Display area, replacing the idle duration value.
2. WHILE the timer entity state is `"active"`, THE Simple_UI SHALL update the displayed remaining time every 1000 milliseconds (±100ms tolerance).
3. WHILE the timer entity state is `"active"`, THE Simple_UI SHALL disable both the increment and decrement buttons such that pointer events (click, touch, scroll) on those controls produce no change to the duration value.
4. WHILE the timer entity state is `"active"`, THE Duration_Display SHALL show the remaining time in "MM:SS" format where MM is total remaining minutes zero-padded to at least 2 digits and SS is remaining seconds zero-padded to 2 digits (e.g., "05:00", "120:30", "00:00").
5. IF the computed remaining time reaches 0 milliseconds while the timer entity state is `"active"`, THEN THE Simple_UI SHALL display "00:00" in the Duration_Display area until the timer entity transitions out of the `"active"` state.

### Requirement 5: Simple UI Theme Support

**User Story:** As a user, I want the Simple UI to look correct in both dark and light themes, so that it integrates seamlessly with my Home Assistant dashboard.

#### Acceptance Criteria

1. THE Simple_UI SHALL reference only HA CSS custom properties (with hardcoded fallback values) for all color-affecting CSS declarations, including `--primary-color`, `--primary-text-color`, `--secondary-text-color`, `--disabled-text-color`, `--divider-color`, `--error-color`, `--warning-color`, and `--card-background-color`.
2. THE Simple_UI SHALL use `--primary-color` for the increment and decrement button icon color when enabled.
3. THE Simple_UI SHALL use `--primary-text-color` for the Duration_Display text.
4. WHILE a button is disabled, THE Simple_UI SHALL reduce the button opacity to 0.5 and set cursor to not-allowed, providing a visually distinct disabled appearance.
5. THE Simple_UI SHALL provide a CSS fallback value for every HA CSS custom property reference so that the card remains legible if a custom property is undefined.
6. THE Simple_UI SHALL contain no hardcoded color literals (hex, rgb, rgba, hsl, or named colors) in any CSS rule except as fallback values within `var()` expressions.

### Requirement 6: Simple UI Accessibility

**User Story:** As a user, I want the Simple UI buttons to be accessible, so that I can interact with the card using assistive technologies.

#### Acceptance Criteria

1. THE Simple_UI increment button SHALL have an accessible label of "Increase duration".
2. THE Simple_UI decrement button SHALL have an accessible label of "Decrease duration".
3. THE Simple_UI buttons SHALL be reachable via sequential keyboard navigation (Tab key) and SHALL activate when the user presses Enter or Space.
4. IF a button is disabled, THEN THE Simple_UI SHALL set the `aria-disabled` attribute to "true" on that button.
5. THE Simple_UI buttons SHALL expose a `button` role to assistive technologies.
6. WHEN the duration value changes as a result of button activation, THE Simple_UI SHALL expose the updated duration value to assistive technologies via a live region with `aria-live` set to "polite".

### Requirement 7: Consistent Behavior Between UI Modes

**User Story:** As a user, I want both UI modes to control the timer identically, so that switching modes does not change the timer behavior.

#### Acceptance Criteria

1. THE Simple_UI SHALL fire `duration-changed` CustomEvents with event detail `{ duration: number }` (duration in seconds), with `bubbles: true` and `composed: true`, matching the Rotary_UI event contract.
2. THE Simple_UI SHALL constrain selectable duration values to multiples of the configured `step` within the range from `step` (minimum) to `max_duration` (maximum), identical to the Rotary_UI constraints.
3. WHEN the user changes `ui_mode` in the Card_Editor, THE Card SHALL preserve the currently selected duration value if it is a valid multiple of `step` and within the range from `step` to `max_duration`.
4. IF the preserved duration value is not a valid multiple of the new `step` or exceeds the new `max_duration` after a `ui_mode` switch, THEN THE Card SHALL round the duration to the nearest valid multiple of `step` that does not exceed `max_duration`, with a minimum value of `step`.
