/**
 * Card configuration stored in Lovelace YAML.
 */
export interface ClimateTimerCardConfig {
  type: string;          // "custom:climate-timer-card"
  entity: string;        // e.g. "climate.living_room_ac"
  timer_entity: string;  // e.g. "timer.climate_living_room_timer"
  max_duration?: string; // e.g. "4h", "240m" — default "4h"
  step?: string;         // e.g. "15m", "1h" — default "15m"
  show_name?: boolean;   // show entity friendly name — default true
  show_state?: boolean;  // show entity state — default true
}

/**
 * Timer helper entity state as provided by Home Assistant.
 */
export interface TimerEntityState {
  entity_id: string;
  state: "idle" | "active" | "paused";
  attributes: {
    duration: string;          // "HH:MM:SS"
    remaining: string;         // "HH:MM:SS" (when paused)
    finishes_at: string;       // ISO timestamp (when active)
    friendly_name: string;
    restore: boolean;
  };
}

/**
 * Climate entity state as provided by Home Assistant.
 */
export interface ClimateEntityState {
  entity_id: string;
  state: string; // "off" | "heat" | "cool" | "idle" | "dry" | "fan_only" | "unavailable"
  attributes: {
    friendly_name: string;
    hvac_modes: string[];
    temperature: number;
    current_temperature: number;
    fan_mode?: string;
  };
}

/**
 * Computed client-side countdown display state derived from the timer entity.
 */
export interface CountdownDisplayState {
  isActive: boolean;
  remainingMs: number;       // computed from finishes_at - now()
  totalMs: number;           // computed from duration attribute
  elapsedFraction: number;   // (totalMs - remainingMs) / totalMs, clamped [0, 1]
  formattedRemaining: string; // "MM:SS" format
}
