import type { ArenaTheme, PluginItem } from '../types';
import { apiRequest } from './api';

const THEME_STORAGE_KEY = 'choiceclash_arena_theme';
const VIEW_MODE_STORAGE_KEY = 'choiceclash_arena_view_mode';

export type ArenaViewMode = '2d' | '3d';

export function getStoredViewMode(): ArenaViewMode {
  try {
    return localStorage.getItem(VIEW_MODE_STORAGE_KEY) === '3d' ? '3d' : '2d';
  } catch {
    return '2d';
  }
}

export function setStoredViewMode(mode: ArenaViewMode): void {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage errors
  }
}

export const FALLBACK_THEMES: ArenaTheme[] = [
  {
    id: 'classic-green',
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
    id: 'walnut-wood',
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
    id: 'midnight-slate',
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
    id: 'royal-burgundy',
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
    id: 'cobalt-ice',
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
    id: 'obsidian-gold',
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

export function getStoredThemeSlug(): string {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'classic-green';
  } catch {
    return 'classic-green';
  }
}

export function setStoredThemeSlug(slug: string): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, slug);
  } catch {
    // Ignore storage errors
  }
}

export async function fetchArenaThemes(): Promise<ArenaTheme[]> {
  try {
    const res = await apiRequest<{ themes: ArenaTheme[] }>('/api/config/themes');
    return res.themes.length > 0 ? res.themes : FALLBACK_THEMES;
  } catch {
    return FALLBACK_THEMES;
  }
}

export async function fetchEnabledPlugins(): Promise<PluginItem[]> {
  try {
    const res = await apiRequest<{ plugins: PluginItem[] }>('/api/config/plugins');
    return res.plugins;
  } catch {
    return [];
  }
}

export async function savePreferredTheme(themeSlug: string): Promise<void> {
  setStoredThemeSlug(themeSlug);
  await apiRequest('/api/config/theme', {
    method: 'PATCH',
    body: JSON.stringify({ themeSlug }),
  });
}

export function parsePluginConfig<T extends Record<string, unknown>>(
  plugin: PluginItem | undefined,
  fallback: T
): T {
  if (!plugin?.configJson) return fallback;
  try {
    return { ...fallback, ...JSON.parse(plugin.configJson) };
  } catch {
    return fallback;
  }
}

let audioCtx: AudioContext | null = null;

export function playChessSound(
  type: 'move' | 'capture' | 'check' | 'end',
  volume = 0.5
): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    const freqs = {
      move: 320,
      capture: 220,
      check: 520,
      end: 440,
    };

    osc.type = type === 'capture' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freqs[type], now);
    gain.gain.setValueAtTime(Math.max(0.02, Math.min(0.4, volume * 0.2)), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (type === 'end' ? 0.25 : 0.09));

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + (type === 'end' ? 0.26 : 0.1));
  } catch {
    // Audio playback blocked or unsupported
  }
}
