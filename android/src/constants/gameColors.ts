/**
 * UNIVERSAL PLAYER & BOARD COLOR CONSTANTS
 *
 * To change player colors in the future, just edit the two player definitions below!
 * - `body`: Stronger/darker version of the color used for player dots and body trails.
 * - `region`: Lighter/softer version of the same color used for colored captured hexes.
 * - `REGION_BORDER`: Thin white border for colored territory hexes.
 */

export const PLAYER_COLORS = {
  // Player 1: Warm Sunset Tangerine (light, fun, vibrant)
  P1: {
    name: 'Sunset Tangerine',
    body: '#EA580C',                    // Stronger/darker shade for player dot & trail body
    hand: '#FB923C',                    // Mid-tone shade for hand (lighter than body, stronger than region)
    region: 'rgba(249, 115, 22, 0.42)', // Lighter version for colored captured hexes
    accent: '#F97316',                  // Bright accent
    light: '#FED7AA',
  },

  // Player 2 / Bot: Playful Electric Violet (fun, contrasting, royal - user approved)
  P2: {
    name: 'Electric Violet',
    body: '#7C3AED',                    // Stronger/darker shade for player dot & trail body
    hand: '#A78BFA',                    // Mid-tone shade for hand (lighter than body, stronger than region)
    region: 'rgba(139, 92, 246, 0.58)', // Richer, slightly darker purple for captured hexes
    accent: '#8B5CF6',                  // Bright accent
    light: '#DDD6FE',
  },

  // White border for colored regions (matching the body hex white border)
  REGION_BORDER: '#FFFFFF',
  REGION_BORDER_WIDTH: 1.5,
};

