/**
 * Utility functions for filtering Home Assistant entities by domain.
 */

/**
 * Filter entities to the climate domain.
 * Returns entity_ids starting with "climate."
 */
export function filterClimateEntities(entities: Record<string, any>): string[] {
  return Object.keys(entities).filter((id) => id.startsWith("climate."));
}

/**
 * Filter entities to the timer domain.
 * Returns entity_ids starting with "timer."
 */
export function filterTimerEntities(entities: Record<string, any>): string[] {
  return Object.keys(entities).filter((id) => id.startsWith("timer."));
}

/**
 * Filter entities to the input_select domain.
 * Returns entity_ids starting with "input_select."
 */
export function filterInputSelectEntities(entities: Record<string, any>): string[] {
  return Object.keys(entities).filter((id) => id.startsWith("input_select."));
}
