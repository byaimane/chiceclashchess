import { prisma } from './prisma.js';

const DEFAULT_THEMES = [
  {
    slug: 'classic-green',
    name: 'Classic Tournament',
    description: 'Traditional tournament green & cream 2D board.',
    lightSquare: '#EEEED2',
    darkSquare: '#769656',
    boardBorder: '#1C1917',
    arenaBg: '#F6F3EC',
    accentColor: '#1B5E3A',
    isActive: true,
    isDefault: true,
  },
  {
    slug: 'walnut-wood',
    name: 'Walnut & Ivory',
    description: 'Warm heritage walnut wood tones with ivory squares.',
    lightSquare: '#F0D9B5',
    darkSquare: '#B58863',
    boardBorder: '#4A2E1B',
    arenaBg: '#F5EFE6',
    accentColor: '#7C4A2D',
    isActive: true,
    isDefault: false,
  },
  {
    slug: 'midnight-slate',
    name: 'Midnight Slate',
    description: 'Cool slate blue-gray squares for focused play.',
    lightSquare: '#DEE3E6',
    darkSquare: '#5D737E',
    boardBorder: '#1E293B',
    arenaBg: '#E8EDF0',
    accentColor: '#1E3A5F',
    isActive: true,
    isDefault: false,
  },
  {
    slug: 'royal-burgundy',
    name: 'Royal Burgundy',
    description: 'Deep crimson-burgundy tournament felt & parchment.',
    lightSquare: '#F2E6D8',
    darkSquare: '#8C3B4A',
    boardBorder: '#3B151D',
    arenaBg: '#F7F1EE',
    accentColor: '#7A2334',
    isActive: true,
    isDefault: false,
  },
  {
    slug: 'cobalt-ice',
    name: 'Cobalt Ice',
    description: 'Crisp ocean cobalt and frost squares.',
    lightSquare: '#EAF2F8',
    darkSquare: '#4A7BA7',
    boardBorder: '#1B365D',
    arenaBg: '#EFF5FA',
    accentColor: '#1D4ED8',
    isActive: true,
    isDefault: false,
  },
  {
    slug: 'obsidian-gold',
    name: 'Obsidian & Gold',
    description: 'High-contrast charcoal slate with warm stone.',
    lightSquare: '#E8E2D0',
    darkSquare: '#3F3F46',
    boardBorder: '#18181B',
    arenaBg: '#ECEBE6',
    accentColor: '#A16207',
    isActive: true,
    isDefault: false,
  },
];

const DEFAULT_PLUGINS = [
  {
    slug: 'board-coordinates',
    name: 'Board Coordinates',
    description: 'Displays A-H and 1-8 algebraic notation on the playing arena board.',
    category: 'ui',
    version: '1.0.0',
    enabled: true,
    configJson: JSON.stringify({ showNotation: true }),
  },
  {
    slug: 'move-sounds',
    name: 'Arena Sound Effects',
    description: 'Plays crisp Web Audio chimes on moves, captures, and game results.',
    category: 'gameplay',
    version: '1.0.0',
    enabled: true,
    configJson: JSON.stringify({ volume: 0.5 }),
  },
  {
    slug: 'arena-banner',
    name: 'Live Arena Banner',
    description: 'Shows an admin-configured announcement banner across the lobby and arena.',
    category: 'moderation',
    version: '1.0.0',
    enabled: false,
    configJson: JSON.stringify({
      message: 'Welcome to ChoiceCLASH Ranked Season!',
      tone: 'info',
    }),
  },
  {
    slug: 'streak-bonus',
    name: 'Tournament Match Rules',
    description: 'Enables standard tournament draw & resignation rules in live rooms.',
    category: 'gameplay',
    version: '1.0.0',
    enabled: true,
    configJson: JSON.stringify({ allowDrawOffers: true, allowResign: true }),
  },
];

export async function seedThemesAndPlugins(): Promise<void> {
  for (const theme of DEFAULT_THEMES) {
    await prisma.arenaTheme.upsert({
      where: { slug: theme.slug },
      update: {},
      create: theme,
    });
  }

  for (const plugin of DEFAULT_PLUGINS) {
    await prisma.plugin.upsert({
      where: { slug: plugin.slug },
      update: {},
      create: plugin,
    });
  }
}
