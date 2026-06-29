// Feature: climate-timer-card, Property 1: Climate entity filtering
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { filterClimateEntities, filterTimerEntities } from '../utils/entity-utils';

/**
 * Validates: Requirements 1.1
 *
 * Property 1: Climate entity filtering
 * For any set of Home Assistant entities across arbitrary domains, the filter
 * function SHALL return only entity identifiers that belong to the `climate`
 * domain (i.e., start with "climate."), and SHALL include every climate entity
 * present in the input.
 */

const DOMAINS = ['climate', 'timer', 'light', 'switch', 'sensor', 'fan', 'cover', 'media_player', 'automation', 'script'];

/**
 * Generates a random entity ID with a domain prefix from the DOMAINS list
 * and a random suffix.
 */
const entityIdArb = fc.tuple(
  fc.constantFrom(...DOMAINS),
  fc.stringMatching(/^[a-z][a-z0-9_]{0,20}$/)
).map(([domain, suffix]) => `${domain}.${suffix}`);

/**
 * Generates a random entity map with mixed domains.
 * Keys are entity IDs and values are arbitrary objects (representing HA entity state).
 */
const entityMapArb = fc.uniqueArray(entityIdArb, { minLength: 0, maxLength: 50, selector: (v) => v })
  .map((ids) => {
    const map: Record<string, any> = {};
    for (const id of ids) {
      map[id] = { state: 'on', attributes: {} };
    }
    return map;
  });

describe('Entity filtering property tests', () => {
  describe('filterClimateEntities', () => {
    it('should return only entity IDs starting with "climate."', () => {
      fc.assert(
        fc.property(entityMapArb, (entities) => {
          const result = filterClimateEntities(entities);
          // All returned IDs must start with "climate."
          return result.every((id) => id.startsWith('climate.'));
        }),
        { numRuns: 100 }
      );
    });

    it('should include every climate entity present in the input', () => {
      fc.assert(
        fc.property(entityMapArb, (entities) => {
          const result = filterClimateEntities(entities);
          const expectedClimateIds = Object.keys(entities).filter((id) => id.startsWith('climate.'));
          // Every climate entity in the input must be in the result
          return expectedClimateIds.every((id) => result.includes(id));
        }),
        { numRuns: 100 }
      );
    });

    it('should return a subset of the input keys', () => {
      fc.assert(
        fc.property(entityMapArb, (entities) => {
          const result = filterClimateEntities(entities);
          const inputKeys = Object.keys(entities);
          // Every returned ID must be a key in the original input
          return result.every((id) => inputKeys.includes(id));
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('filterTimerEntities', () => {
    it('should return only entity IDs starting with "timer."', () => {
      fc.assert(
        fc.property(entityMapArb, (entities) => {
          const result = filterTimerEntities(entities);
          // All returned IDs must start with "timer."
          return result.every((id) => id.startsWith('timer.'));
        }),
        { numRuns: 100 }
      );
    });

    it('should include every timer entity present in the input', () => {
      fc.assert(
        fc.property(entityMapArb, (entities) => {
          const result = filterTimerEntities(entities);
          const expectedTimerIds = Object.keys(entities).filter((id) => id.startsWith('timer.'));
          // Every timer entity in the input must be in the result
          return expectedTimerIds.every((id) => result.includes(id));
        }),
        { numRuns: 100 }
      );
    });

    it('should return a subset of the input keys', () => {
      fc.assert(
        fc.property(entityMapArb, (entities) => {
          const result = filterTimerEntities(entities);
          const inputKeys = Object.keys(entities);
          // Every returned ID must be a key in the original input
          return result.every((id) => inputKeys.includes(id));
        }),
        { numRuns: 100 }
      );
    });
  });
});
