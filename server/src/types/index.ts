import type { Request } from 'express';

export interface AuthPayload {
  userId: string;
  username: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export type PlayerColor = 'w' | 'b';

export interface PlayerInfo {
  userId: string;
  username: string;
  socketId: string;
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
