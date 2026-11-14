export interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN' | string;
  isBanned?: boolean;
  wins: number;
  losses: number;
  draws: number;
  xp: number;
  points: number;
  level: number;
  walletCents: number;
  preferredThemeSlug?: string;
  createdAt?: string;
}

export interface ArenaTheme {
  id: string;
  slug: string;
  name: string;
  description: string;
  lightSquare: string;
  darkSquare: string;
  boardBorder: string;
  arenaBg: string;
  accentColor: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface PluginItem {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  version: string;
  enabled: boolean;
  configJson: string;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  pointsSpent: number;
  amountCents: number;
  payoutMethod: string;
  destination: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdAt: string;
  processedAt: string | null;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export type PlayerColor = 'w' | 'b';

export interface RoomPlayer {
  userId: string;
  username: string;
  connected: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  text: string;
  timestamp: string;
}

export interface GameOverPayload {
  result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW';
  reason: string;
  winnerId: string | null;
  winnerUsername: string | null;
  pointsAwarded?: {
    white: number;
    black: number;
  };
}

export interface RoomSnapshot {
  roomCode: string;
  fen: string;
  turn: PlayerColor;
  history: string[];
  inCheck: boolean;
  white: RoomPlayer | null;
  black: RoomPlayer | null;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
  drawOfferBy: PlayerColor | null;
  messages: ChatMessage[];
  gameOver: GameOverPayload | null;
  yourColor: PlayerColor | null;
}

export interface OnlineUser {
  userId: string;
  username: string;
  status: 'online' | 'searching' | 'in_game';
}

export interface MatchHistoryItem {
  id: string;
  roomCode: string;
  result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | null;
  endReason: string | null;
  completedAt: string | null;
  whitePlayer: { id: string; username: string } | null;
  blackPlayer: { id: string; username: string } | null;
}
