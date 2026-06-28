# Design Document: Climate Timer Card

## Overview

The Climate Timer Card is a custom Home Assistant Lovelace card built as a web component using TypeScript and Lit. It provides a rotary dial timer interface to run any climate entity for a user-specified duration, automatically turning the entity on at timer start and off when the countdown reaches zero.

The card uses a **hybrid timer architecture**: the actual countdown lives server-side as a Home Assistant Timer helper entity (`timer.*`), while the card provides a real-time animated display by reading the timer entity's `finishes_at` attribute. This means the timer continues running even if the browser tab or entire browser is closed.

A companion Home Assistant automation (provided as a blueprint) listens for the `timer.finished` event and calls `climate.turn_off`, ensuring reliable shutdown regardless of client connectivity.

## Architecture

```
┌─────────────────────────────────────────────┐
│           Home Assistant Frontend            │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │        ClimateTimerCard               │  │
│  │  ┌─────────────┐ ┌────────────────┐  │  │
│  │  │TimerSelector │ │  CardEditor    │  │  │
│  │  │(Rotary Dial) │ │               │  │  │
│  │  │ - Idle mode  │ │ - Entity select│  │  │
│  │  │ - Countdown  │ │ - Max/Step cfg │  │  │
│  │  │   mode       │ │ - Toggles     │  │  │
│  │  └─────────────┘ └────────────────┘  │  │
│  └───────────────────────────────────────┘  │
│                    │                         │
│     callService    │    state updates        │
│                    ▼                         │
│  ┌───────────────────────────────────────┐  │
│  │         Home Assistant Core           │  │
│  │  - climate.turn_on / turn_off         │  │
│  │  - timer.start / cancel               │  │
│  │  - Timer Helper (finishes_at)         │  │
│  │  - Automation (timer.finished →       │  │
│  │    climate.turn_off)                  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Key Design Decisions

- **Lit (LitElement)** for reactive rendering and web component lifecycle
- **TypeScript** for type safety
- **Rollup** (ES module output) for bundling into a single `.js` file
- **Server-side Timer helper** for reliable countdown that survives browser disconnects
- **Unified rotary dial** that shows both duration selection (idle) and countdown display (active) in one component
- **Internal 1-second interval** in the timer-selector for real-time countdown animation
- **connectedCallback/disconnectedCallback** for proper interval lifecycle when navigating views
- **Companion automation blueprint** for guaranteed shutdown

## Components

### 1. `ClimateTimerCard` (main card)

Implements the HA custom card interface. Orchestrates the timer lifecycle.

```typescript
interface ClimateTimerCardConfig {
  type: string;
  entity: string;        // climate.* entity_id
  timer_entity: string;  // timer.* entity_id
  max_duration?: string; // "4h", "240m" — default "4h"
  step?: string;         // "15m", "1h" — default "15m"
  show_name?: boolean;   // default true
  show_state?: boolean;  // default true
}
```

Key methods:
- `static getConfigElement()` → returns editor element
- `static getStubConfig()` → default config
- `setConfig(config)` → validates entity + timer_entity required
- `getCardSize()` → 3
- `getLayoutOptions()` → grid sizing support
- `_handleStart()` → climate.turn_on → timer.start (with rollback)
- `_handleCancel()` → timer.cancel → climate.turn_off
- `connectedCallback()` / `disconnectedCallback()` → interval lifecycle

### 2. `TimerSelector` (rotary dial)

A unified component that handles both idle (duration selection) and active (countdown display) modes.

**Idle mode:**
- Circular SVG dial with filled arc showing proportion of max
- Draggable knob indicator
- Duration text in center ("1h 30m")
- Scroll wheel, mouse drag, touch drag support
- Configurable `maxDuration` and `stepSize`

**Active mode (countdown):**
- Orange elapsed arc grows clockwise from top (animated with 1s CSS transition)
- Faint blue background ring for context
- MM:SS countdown text in center with "remaining" label
- Internal `setInterval` increments `_tick` state every 1s to force re-renders
- Syncs from `finishesAt` timestamp (not local timekeeping)

### 3. `ClimateTimerCardEditor`

Configuration UI with:
- Climate entity dropdown (filtered to `climate.*`)
- Timer entity dropdown (filtered to `timer.*`)
- Max Duration text input with validation
- Step text input with validation
- Show Name toggle
- Show State toggle
- Inline validation error messages

### 4. Utility Functions

| Function | Purpose |
|---|---|
| `clampDuration(min, max, step)` | Clamp and snap to step |
| `adjustDuration(current, dir, max, step)` | ±step with clamping |
| `minutesToHADuration(min)` | Minutes → "HH:MM:SS" |
| `parseDurationToMs(str)` | "HH:MM:SS" → milliseconds |
| `parseDurationString(str)` | "4h", "30m" → minutes |
| `validateDurationConfig(max, step)` | Config validation |
| `formatDurationIdle(min)` | Minutes → "1h 30m" |
| `formatCountdown(ms)` | Milliseconds → "MM:SS" |
| `computeRemainingMs(finishesAt)` | Timestamp → remaining ms |
| `computeElapsedFraction(finishesAt, dur)` | Elapsed [0,1] fraction |
| `filterClimateEntities(states)` | Filter to climate.* |
| `filterTimerEntities(states)` | Filter to timer.* |

## Data Flow

### Start Flow
1. User selects duration on dial → `_selectedDuration` updated
2. User presses Start → `climate.turn_on` → `timer.start` with "HH:MM:SS"
3. Timer helper goes active, sets `finishes_at`
4. Card observes state change → passes `finishesAt` and `timerActive` to dial
5. Dial starts internal interval → renders countdown every second

### Cancel Flow
1. User presses Cancel → `timer.cancel` → `climate.turn_off`
2. Timer helper goes idle
3. Card observes state change → dial returns to selector mode

### Timer Finish Flow
1. Timer helper fires `timer.finished` event
2. Companion automation calls `climate.turn_off`
3. Timer helper goes idle, climate goes off
4. Card observes state changes → dial returns to selector mode

### View Navigation Resilience
1. User navigates away → `disconnectedCallback` stops intervals
2. User returns → `connectedCallback` checks `timerActive`, restarts interval
3. Dial re-syncs from `finishesAt` — no drift

## Error Handling

| Scenario | Behavior |
|---|---|
| `climate.turn_on` fails on start | Timer not started. Error shown 5s. |
| `timer.start` fails after climate on | Rollback: `climate.turn_off`. Error shown 5s. |
| `timer.cancel` fails on cancel | Error shown, continue with `climate.turn_off`. |
| Climate turned off externally | Timer cancelled, card resets to idle. |
| Climate becomes unavailable | Timer cancelled, start button disabled. |
| Invalid config (step > max, bad format) | Validation error in editor. |

## Companion Automation Blueprint

Provided as `automation/climate-timer-blueprint.yaml`:

```yaml
blueprint:
  name: "Climate Timer - Turn off when timer finishes"
  domain: automation
  input:
    timer_entity:
      selector:
        entity:
          domain: timer
    climate_entity:
      selector:
        entity:
          domain: climate

triggers:
  - trigger: event
    event_type: timer.finished
    event_data:
      entity_id: !input timer_entity

actions:
  - action: climate.turn_off
    target:
      entity_id: !input climate_entity
```

## Build & Bundle

- **Build tool**: Rollup with TypeScript plugin
- **Output**: `dist/climate-timer-card.js` (ES module format)
- **Installation**: Copy to HA `config/www/`, add as resource with `type: module`
- **Test framework**: Vitest + fast-check (property-based testing)
