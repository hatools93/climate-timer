// Climate Timer Card - Entry Point
// Imports and registers all custom elements for the Climate Timer Card

import "./components/climate-timer-card";
import "./components/climate-timer-card-editor";

// Register the card in the HA card picker
// This makes the card discoverable when users add a new card in Lovelace
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "climate-timer-card",
  name: "Climate Timer Card",
  description: "A timer-based climate entity controller that automatically turns off after a set duration.",
  preview: false,
});
