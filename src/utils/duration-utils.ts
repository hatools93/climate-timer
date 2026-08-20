/**
 * Duration utility functions for the Climate Timer Card.
 *
 * Handles duration clamping, adjustment, and conversion between
 * minutes and Home Assistant timer duration format ("HH:MM:SS").
 */

import type { ClimateTimerCardConfig } from "../types";

/** Minimum allowed timer duration in minutes. */
export const MIN_DURATION = 15;

/** Maximum allowed timer duration in minutes (default). */
export const MAX_DURATION = 240;

/** Step size for duration adjustments in minutes (default). */
export const STEP = 15;

/**
 * Parses a human-friendly duration string (e.g., "4h", "30m", "1h30m", "240m")
 * into minutes. Returns null if the format is invalid.
 */
export function parseDurationString(input: string): number | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  // Match patterns like "4h", "30m", "1h30m", "2h 15m"
  const match = trimmed.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/);
  if (!match) return null;

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  // Must have at least one component
  if (hours === 0 && minutes === 0 && !match[1] && !match[2]) return null;

  const total = hours * 60 + minutes;
  return total > 0 ? total : null;
}

/**
 * Formats minutes into a human-friendly duration string.
 * e.g., 240 → "4h", 90 → "1h 30m", 15 → "15m"
 */
export function formatDurationString(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Validates max_duration and step config values.
 * Returns an error message string, or null if valid.
 */
export function validateDurationConfig(maxDuration: string, step: string): string | null {
  const maxMinutes = parseDurationString(maxDuration);
  if (maxMinutes === null) {
    return `Invalid max duration "${maxDuration}". Use format like "4h" or "240m"`;
  }

  const stepMinutes = parseDurationString(step);
  if (stepMinutes === null) {
    return `Invalid step "${step}". Use format like "15m" or "1h"`;
  }

  if (stepMinutes > maxMinutes) {
    return `Step (${step}) must not exceed max duration (${maxDuration})`;
  }

  if (maxMinutes < 5) {
    return `Max duration must be at least 5m`;
  }

  if (stepMinutes < 1) {
    return `Step must be at least 1m`;
  }

  if (maxMinutes > 1440) {
    return `Max duration cannot exceed 24h`;
  }

  return null;
}

/**
 * Clamps a duration value to [MIN_DURATION, maxDuration] and snaps to the nearest multiple of step.
 *
 * @param minutes - The raw duration in minutes to clamp.
 * @param maxDuration - Maximum allowed duration (default: MAX_DURATION).
 * @param step - Step size to snap to (default: STEP).
 * @returns The clamped and snapped duration in minutes.
 */
export function clampDuration(minutes: number, maxDuration = MAX_DURATION, step = STEP): number {
  const minDuration = step; // Minimum is always one step
  const snapped = Math.round(minutes / step) * step;
  // Ensure the result respects maxDuration while staying a multiple of step
  const maxSnapped = Math.floor(maxDuration / step) * step;
  const effectiveMax = Math.max(minDuration, maxSnapped);
  return Math.max(minDuration, Math.min(effectiveMax, snapped));
}

/**
 * Adjusts the current duration by one step in the given direction, then clamps.
 *
 * @param current - The current duration in minutes.
 * @param direction - "up" to increase, "down" to decrease.
 * @param maxDuration - Maximum allowed duration (default: MAX_DURATION).
 * @param step - Step size (default: STEP).
 * @returns The new clamped duration in minutes.
 */
export function adjustDuration(current: number, direction: "up" | "down", maxDuration = MAX_DURATION, step = STEP): number {
  const delta = direction === "up" ? step : -step;
  return clampDuration(current + delta, maxDuration, step);
}

/**
 * Converts a duration in minutes to a Home Assistant timer duration string "HH:MM:SS".
 *
 * @param minutes - The duration in minutes.
 * @returns A string in "HH:MM:SS" format (e.g., 90 → "01:30:00").
 */
export function minutesToHADuration(minutes: number): string {
  const totalMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const hh = String(hours).padStart(2, "0");
  const mm = String(mins).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

/**
 * Parses a Home Assistant duration string "HH:MM:SS" to milliseconds.
 *
 * @param duration - A string in "HH:MM:SS" format.
 * @returns The duration in milliseconds.
 */
export function parseDurationToMs(duration: string): number {
  const parts = duration.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const seconds = parseInt(parts[2], 10) || 0;
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

/**
 * Resolves the UI mode from config, defaulting to "rotary" for any
 * value other than "simple" (including undefined, null, or invalid strings).
 *
 * @param config - The card configuration object.
 * @returns "simple" if explicitly configured, otherwise "rotary".
 */
export function resolveUiMode(config: ClimateTimerCardConfig): "rotary" | "simple" {
  if (config.ui_mode === "simple") return "simple";
  return "rotary";
}
