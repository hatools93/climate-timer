/**
 * Minimal Home Assistant type stubs for custom card development.
 */

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService(
    domain: string,
    service: string,
    data?: Record<string, any>,
    target?: { entity_id: string | string[] }
  ): Promise<void>;
  connection: any;
}
