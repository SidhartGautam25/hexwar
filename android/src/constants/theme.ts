export interface GameTheme {
  id: string;
  name: string;
  dark: boolean;
  colors: {
    background: string;       // Screen background
    boardBackground: string;  // Grid canvas background
    gridLine: string;         // ruled grid lines
    gridDot: string;          // grid intersection points
    p1Shades: [string, string, string]; // Dot 1 (Solid), Dot 2 (Dashed), Dot 3 (Glow)
    p2Shades: [string, string, string]; // Bot Dot 1 (Solid), Bot Dot 2 (Dashed), Bot Dot 3 (Glow)
    textPrimary: string;
    textSecondary: string;
    cardBackground: string;
    border: string;
    shadowColor: string;
    accent: string;           // General highlight colors
  };
}

export const GAME_THEMES: GameTheme[] = [
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    dark: true,
    colors: {
      background: '#0F172A',      // Slate 900
      boardBackground: '#020617', // Slate 950
      gridLine: 'rgba(51, 65, 85, 0.2)', // Slate 700 with opacity
      gridDot: '#475569',         // Slate 600
      p1Shades: ['#00E5FF', '#60A5FA', '#06B6D4'], // Electric Blue, Sky Blue, Cyan
      p2Shades: ['#FF3B6B', '#F87171', '#F43F5E'], // Neon Red, Coral Red, Rose Pink
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      cardBackground: '#1E293B',
      border: '#334155',
      shadowColor: '#000000',
      accent: '#00E5FF',
    },
  },
  {
    id: 'emerald-gold',
    name: 'Emerald Gold',
    dark: true,
    colors: {
      background: '#064E3B',      // Emerald 900
      boardBackground: '#022C22', // Emerald 950
      gridLine: 'rgba(4, 120, 87, 0.2)',
      gridDot: '#059669',
      p1Shades: ['#10B981', '#34D399', '#6EE7B7'], // Emerald shades
      p2Shades: ['#F59E0B', '#FBBF24', '#FDE047'], // Amber/Gold shades
      textPrimary: '#ECFDF5',
      textSecondary: '#A7F3D0',
      cardBackground: '#065F46',
      border: '#047857',
      shadowColor: '#000000',
      accent: '#10B981',
    },
  },
  {
    id: 'steel-ember',
    name: 'Steel Ember',
    dark: true,
    colors: {
      background: '#18181B',      // Zinc 900
      boardBackground: '#09090B', // Zinc 950
      gridLine: 'rgba(63, 63, 70, 0.25)',
      gridDot: '#52525B',
      p1Shades: ['#E4E4E7', '#A1A1AA', '#71717A'], // Silver Gray shades
      p2Shades: ['#F43F5E', '#FB7185', '#FDA4AF'], // Hot Pink/Rose
      textPrimary: '#FAFAFA',
      textSecondary: '#A1A1AA',
      cardBackground: '#27272A',
      border: '#3F3F46',
      shadowColor: '#000000',
      accent: '#A1A1AA',
    },
  },
  {
    id: 'cosmic-nebula',
    name: 'Nebula Glow',
    dark: true,
    colors: {
      background: '#1E1B4B',      // Indigo 950
      boardBackground: '#0F0E30', // Deep Violet
      gridLine: 'rgba(99, 102, 241, 0.15)',
      gridDot: '#6366F1',
      p1Shades: ['#8B5CF6', '#A78BFA', '#C4B5FD'], // Purple/Violet
      p2Shades: ['#F97316', '#FB923C', '#FDBA74'], // Orange/Coral
      textPrimary: '#EEF2F6',
      textSecondary: '#C7D2FE',
      cardBackground: '#312E81',
      border: '#4338CA',
      shadowColor: '#000000',
      accent: '#8B5CF6',
    },
  },
];

export interface KillEffectOption {
  id: 'collapse' | 'explode' | 'dissolve' | 'monster' | 'hammer' | 'burn' | 'firecracker';
  name: string;
  description: string;
}

export const KILL_EFFECTS: KillEffectOption[] = [
  {
    id: 'collapse',
    name: 'Blackhole Implosion',
    description: 'Dot shrinks and collapses into a dark obsidian singularity.',
  },
  {
    id: 'explode',
    name: 'Supernova Burst',
    description: 'Dot releases an expanding energy wave leaving a thermal outline.',
  },
  {
    id: 'dissolve',
    name: 'Digital Dissolve',
    description: 'Dot disintegrates into a pixelated ghost outline.',
  },
  {
    id: 'monster',
    name: 'Monster Chomper',
    description: 'Dot morphs into a giant monster face that devours the enemy.',
  },
  {
    id: 'hammer',
    name: 'Mjolnir Hammer Smash',
    description: 'Dot transforms into a hammer and smashes the enemy dot into pieces.',
  },
  {
    id: 'burn',
    name: 'Incinerating Flame',
    description: 'Dot is consumed by rising, glowing neon flames and ashes.',
  },
  {
    id: 'firecracker',
    name: 'Firecracker Burst',
    description: 'Dot explodes into a vibrant multi-colored spark shower.',
  },
];
