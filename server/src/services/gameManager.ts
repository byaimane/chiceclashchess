import { randomBytes } from 'node:crypto';
import { Chess } from 'chess.js';
import { prisma } from '../lib/prisma.js';
import {
  calculateLevel,
  POINTS_PER_DRAW,
  POINTS_PER_LOSS,
  POINTS_PER_WIN,
} from '../lib/progression.js';
import type {
  ChatMessage,
  GameOverPayload,
  PlayerColor,
  PlayerInfo,
} from '../types/index.js';

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface ActiveRoom {
  roomCode: string;
  chess: Chess;
  white: PlayerInfo | null;
  black: PlayerInfo | null;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
  drawOfferBy: PlayerColor | null;
  messages: ChatMessage[];
  gameOver: GameOverPayload | null;
  persisted: boolean;
}

export interface QueueEntry {
  userId: string;
  username: string;
  socketId: string;
}

export type OnlineStatus = 'online' | 'searching' | 'in_game';

export interface OnlineUser {
  userId: string;
  username: string;
  status: OnlineStatus;
}

interface TrackedOnlineUser {
  userId: string;
  username: string;
  socketIds: Set<string>;
  status: OnlineStatus;
}

export interface RoomSnapshot {
  roomCode: string;
  fen: string;
  turn: PlayerColor;
  history: string[];
  inCheck: boolean;
  white: { userId: string; username: string; connected: boolean } | null;
  black: { userId: string; username: string; connected: boolean } | null;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
  drawOfferBy: PlayerColor | null;
  messages: ChatMessage[];
  gameOver: GameOverPayload | null;
  yourColor: PlayerColor | null;
}

class GameManager {
  private rooms = new Map<string, ActiveRoom>();
  private matchmakingQueue: QueueEntry[] = [];
  private onlineUsers = new Map<string, TrackedOnlineUser>();

  public setUserOnline(userId: string, username: string, socketId: string): void {
    const existing = this.onlineUsers.get(userId);
    if (existing) {
      existing.socketIds.add(socketId);
      existing.username = username;
    } else {
      this.onlineUsers.set(userId, {
        userId,
        username,
        socketIds: new Set([socketId]),
        status: 'online',
      });
    }
  }

  public setUserOffline(userId: string, socketId: string): void {
    const existing = this.onlineUsers.get(userId);
    if (!existing) return;
    existing.socketIds.delete(socketId);
    if (existing.socketIds.size === 0) {
      this.onlineUsers.delete(userId);
      this.matchmakingQueue = this.matchmakingQueue.filter((q) => q.userId !== userId);
    }
  }

  public setUserStatus(userId: string, status: OnlineStatus): void {
    const existing = this.onlineUsers.get(userId);
    if (existing) {
      existing.status = status;
    }
  }

  public getOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values()).map((u) => ({
      userId: u.userId,
      username: u.username,
      status: u.status,
    }));
  }

  public createDirectMatch(
    challengerId: string,
    challengerUsername: string,
    challengerSocketId: string,
    targetUserId: string
  ): {
    room?: ActiveRoom;
    socketIds?: string[];
    error?: string;
  } {
    if (challengerId === targetUserId) {
      return { error: 'You cannot challenge yourself.' };
    }

    const target = this.onlineUsers.get(targetUserId);
    if (!target || target.socketIds.size === 0) {
      return { error: 'Player is no longer online.' };
    }

    const targetSocketId = Array.from(target.socketIds)[0];
    this.leaveQueue(challengerId);
    this.leaveQueue(targetUserId);

    const assignChallengerWhite = Math.random() < 0.5;
    const white = assignChallengerWhite
      ? { userId: challengerId, username: challengerUsername, socketId: challengerSocketId }
      : { userId: target.userId, username: target.username, socketId: targetSocketId };
    const black = assignChallengerWhite
      ? { userId: target.userId, username: target.username, socketId: targetSocketId }
      : { userId: challengerId, username: challengerUsername, socketId: challengerSocketId };

    const roomCode = this.generateRoomCode();
    const room: ActiveRoom = {
      roomCode,
      chess: new Chess(),
      white: { ...white, connected: true },
      black: { ...black, connected: true },
      status: 'ACTIVE',
      drawOfferBy: null,
      messages: [],
      gameOver: null,
      persisted: false,
    };
    this.rooms.set(roomCode, room);
    this.setUserStatus(challengerId, 'in_game');
    this.setUserStatus(targetUserId, 'in_game');

    prisma.game
      .create({
        data: {
          roomCode,
          whitePlayerId: white.userId,
          blackPlayerId: black.userId,
          status: 'ACTIVE',
          fen: room.chess.fen(),
        },
      })
      .catch((err) => console.error('Failed to persist direct match:', err));

    return {
      room,
      socketIds: [challengerSocketId, ...Array.from(target.socketIds)],
    };
  }

  private generateRoomCode(): string {
    let code = '';
    do {
      const bytes = randomBytes(6);
      code = Array.from(bytes)
        .map((b) => ROOM_ALPHABET[b % ROOM_ALPHABET.length])
        .join('');
    } while (this.rooms.has(code));
    return code;
  }

  public getRoom(roomCode: string): ActiveRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  public listRooms() {
    return Array.from(this.rooms.values()).map((room) => ({
      roomCode: room.roomCode,
      status: room.status,
      moveCount: room.chess.history().length,
      whiteUsername: room.white?.username ?? null,
      blackUsername: room.black?.username ?? null,
    }));
  }

  public closeRoom(roomCode: string): boolean {
    return this.rooms.delete(roomCode.toUpperCase());
  }

  public createRoom(userId: string, username: string, socketId: string): ActiveRoom {
    const roomCode = this.generateRoomCode();
    const room: ActiveRoom = {
      roomCode,
      chess: new Chess(),
      white: { userId, username, socketId, connected: true },
      black: null,
      status: 'WAITING',
      drawOfferBy: null,
      messages: [],
      gameOver: null,
      persisted: false,
    };
    this.rooms.set(roomCode, room);

    // Best-effort initial DB record creation
    prisma.game
      .create({
        data: {
          roomCode,
          whitePlayerId: userId,
          status: 'WAITING',
          fen: room.chess.fen(),
        },
      })
      .catch((err) => console.error('Failed to persist new room:', err));

    return room;
  }

  public joinRoom(
    rawRoomCode: string,
    userId: string,
    username: string,
    socketId: string
  ): { room?: ActiveRoom; error?: string } {
    const roomCode = rawRoomCode.trim().toUpperCase();
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { error: 'Game room not found. Check the room code and try again.' };
    }

    // Reconnecting player
    if (room.white?.userId === userId) {
      room.white.socketId = socketId;
      room.white.connected = true;
      return { room };
    }
    if (room.black?.userId === userId) {
      room.black.socketId = socketId;
      room.black.connected = true;
      return { room };
    }

    // Assign to open seat
    if (!room.white) {
      room.white = { userId, username, socketId, connected: true };
    } else if (!room.black) {
      room.black = { userId, username, socketId, connected: true };
    }

    if (room.white && room.black && room.status === 'WAITING') {
      room.status = 'ACTIVE';
      prisma.game
        .updateMany({
          where: { roomCode },
          data: {
            whitePlayerId: room.white.userId,
            blackPlayerId: room.black.userId,
            status: 'ACTIVE',
          },
        })
        .catch((err) => console.error('Failed to activate game in DB:', err));
    }

    return { room };
  }

  public getPlayerColor(room: ActiveRoom, userId: string): PlayerColor | null {
    if (room.white?.userId === userId) return 'w';
    if (room.black?.userId === userId) return 'b';
    return null;
  }

  public toSnapshot(room: ActiveRoom, userId: string): RoomSnapshot {
    return {
      roomCode: room.roomCode,
      fen: room.chess.fen(),
      turn: room.chess.turn(),
      history: room.chess.history(),
      inCheck: room.chess.inCheck(),
      white: room.white
        ? {
            userId: room.white.userId,
            username: room.white.username,
            connected: room.white.connected,
          }
        : null,
      black: room.black
        ? {
            userId: room.black.userId,
            username: room.black.username,
            connected: room.black.connected,
          }
        : null,
      status: room.status,
      drawOfferBy: room.drawOfferBy,
      messages: room.messages,
      gameOver: room.gameOver,
      yourColor: this.getPlayerColor(room, userId),
    };
  }

  public async makeMove(
    rawRoomCode: string,
    userId: string,
    from: string,
    to: string,
    promotion?: string
  ): Promise<{ room?: ActiveRoom; error?: string; gameOver?: GameOverPayload }> {
    const room = this.getRoom(rawRoomCode);
    if (!room) return { error: 'Game room not found.' };
    if (room.status !== 'ACTIVE') return { error: 'Game is not currently active.' };

    const playerColor = this.getPlayerColor(room, userId);
    if (!playerColor) return { error: 'Spectators cannot make moves.' };
    if (room.chess.turn() !== playerColor) {
      return { error: 'It is not your turn.' };
    }

    try {
      room.chess.move({
        from,
        to,
        promotion: promotion || 'q',
      });
    } catch {
      return { error: 'Illegal move.' };
    }

    room.drawOfferBy = null;

    if (room.chess.isGameOver()) {
      let result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' = 'DRAW';
      let reason = 'draw';
      let winnerId: string | null = null;
      let winnerUsername: string | null = null;

      if (room.chess.isCheckmate()) {
        const winnerColor: PlayerColor = playerColor;
        result = winnerColor === 'w' ? 'WHITE_WIN' : 'BLACK_WIN';
        reason = 'checkmate';
        const winner = winnerColor === 'w' ? room.white : room.black;
        winnerId = winner?.userId ?? null;
        winnerUsername = winner?.username ?? null;
      } else if (room.chess.isStalemate()) {
        reason = 'stalemate';
      } else if (room.chess.isThreefoldRepetition()) {
        reason = 'threefold_repetition';
      } else if (room.chess.isInsufficientMaterial()) {
        reason = 'insufficient_material';
      } else if (room.chess.isDraw()) {
        reason = 'fifty_move_rule';
      }

      const gameOver = await this.finishGame(room, result, reason, winnerId, winnerUsername);
      return { room, gameOver };
    }

    return { room };
  }

  public async resign(
    rawRoomCode: string,
    userId: string
  ): Promise<{ room?: ActiveRoom; error?: string; gameOver?: GameOverPayload }> {
    const room = this.getRoom(rawRoomCode);
    if (!room) return { error: 'Game room not found.' };
    if (room.status !== 'ACTIVE') return { error: 'Game is not active.' };

    const color = this.getPlayerColor(room, userId);
    if (!color) return { error: 'Only players in the game can resign.' };

    const winner = color === 'w' ? room.black : room.white;
    const result = color === 'w' ? 'BLACK_WIN' : 'WHITE_WIN';
    const gameOver = await this.finishGame(
      room,
      result,
      'resignation',
      winner?.userId ?? null,
      winner?.username ?? null
    );
    return { room, gameOver };
  }

  public offerDraw(
    rawRoomCode: string,
    userId: string
  ): { room?: ActiveRoom; error?: string } {
    const room = this.getRoom(rawRoomCode);
    if (!room) return { error: 'Game room not found.' };
    if (room.status !== 'ACTIVE') return { error: 'Game is not active.' };

    const color = this.getPlayerColor(room, userId);
    if (!color) return { error: 'Only players can offer a draw.' };

    room.drawOfferBy = color;
    return { room };
  }

  public async respondDraw(
    rawRoomCode: string,
    userId: string,
    accept: boolean
  ): Promise<{ room?: ActiveRoom; error?: string; gameOver?: GameOverPayload }> {
    const room = this.getRoom(rawRoomCode);
    if (!room) return { error: 'Game room not found.' };
    if (room.status !== 'ACTIVE') return { error: 'Game is not active.' };
    if (!room.drawOfferBy) return { error: 'No active draw offer.' };

    const color = this.getPlayerColor(room, userId);
    if (!color) return { error: 'Only players can respond to a draw offer.' };
    if (room.drawOfferBy === color) {
      return { error: 'You cannot respond to your own draw offer.' };
    }

    room.drawOfferBy = null;
    if (!accept) {
      return { room };
    }

    const gameOver = await this.finishGame(room, 'DRAW', 'draw_agreement', null, null);
    return { room, gameOver };
  }

  public addChatMessage(
    rawRoomCode: string,
    userId: string,
    username: string,
    text: string
  ): { room?: ActiveRoom; message?: ChatMessage } {
    const room = this.getRoom(rawRoomCode);
    if (!room) return {};

    const trimmed = text.trim().slice(0, 500);
    if (!trimmed) return {};

    const message: ChatMessage = {
      id: `${Date.now()}-${randomBytes(4).toString('hex')}`,
      senderId: userId,
      senderUsername: username,
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    room.messages.push(message);
    if (room.messages.length > 100) {
      room.messages.shift();
    }
    return { room, message };
  }

  private async finishGame(
    room: ActiveRoom,
    result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW',
    reason: string,
    winnerId: string | null,
    winnerUsername: string | null
  ): Promise<GameOverPayload> {
    const whitePoints =
      result === 'WHITE_WIN'
        ? POINTS_PER_WIN
        : result === 'BLACK_WIN'
        ? POINTS_PER_LOSS
        : POINTS_PER_DRAW;
    const blackPoints =
      result === 'BLACK_WIN'
        ? POINTS_PER_WIN
        : result === 'WHITE_WIN'
        ? POINTS_PER_LOSS
        : POINTS_PER_DRAW;

    room.status = 'COMPLETED';
    room.drawOfferBy = null;
    const gameOver: GameOverPayload = {
      result,
      reason,
      winnerId,
      winnerUsername,
      pointsAwarded: {
        white: whitePoints,
        black: blackPoints,
      },
    };
    room.gameOver = gameOver;

    if (!room.persisted && room.white && room.black) {
      room.persisted = true;
      const whiteId = room.white.userId;
      const blackId = room.black.userId;

      try {
        await prisma.$transaction(async (tx) => {
          await tx.game.upsert({
            where: { roomCode: room.roomCode },
            update: {
              whitePlayerId: whiteId,
              blackPlayerId: blackId,
              status: 'COMPLETED',
              result,
              endReason: reason,
              pgn: room.chess.pgn(),
              fen: room.chess.fen(),
              completedAt: new Date(),
            },
            create: {
              roomCode: room.roomCode,
              whitePlayerId: whiteId,
              blackPlayerId: blackId,
              status: 'COMPLETED',
              result,
              endReason: reason,
              pgn: room.chess.pgn(),
              fen: room.chess.fen(),
              completedAt: new Date(),
            },
          });

          const [whiteUser, blackUser] = await Promise.all([
            tx.user.findUnique({ where: { id: whiteId }, select: { xp: true } }),
            tx.user.findUnique({ where: { id: blackId }, select: { xp: true } }),
          ]);

          const newWhiteXp = (whiteUser?.xp ?? 0) + whitePoints;
          const newBlackXp = (blackUser?.xp ?? 0) + blackPoints;

          await tx.user.update({
            where: { id: whiteId },
            data: {
              wins: result === 'WHITE_WIN' ? { increment: 1 } : undefined,
              losses: result === 'BLACK_WIN' ? { increment: 1 } : undefined,
              draws: result === 'DRAW' ? { increment: 1 } : undefined,
              xp: newWhiteXp,
              points: { increment: whitePoints },
              level: calculateLevel(newWhiteXp),
            },
          });

          await tx.user.update({
            where: { id: blackId },
            data: {
              wins: result === 'BLACK_WIN' ? { increment: 1 } : undefined,
              losses: result === 'WHITE_WIN' ? { increment: 1 } : undefined,
              draws: result === 'DRAW' ? { increment: 1 } : undefined,
              xp: newBlackXp,
              points: { increment: blackPoints },
              level: calculateLevel(newBlackXp),
            },
          });
        });
      } catch (err) {
        console.error('Failed to persist game result:', err);
      }
    }

    return gameOver;
  }

  public enqueueQuickMatch(entry: QueueEntry): {
    matched: boolean;
    room?: ActiveRoom;
    players?: [QueueEntry, QueueEntry];
  } {
    // Remove any stale entry for the same user
    this.matchmakingQueue = this.matchmakingQueue.filter(
      (q) => q.userId !== entry.userId
    );

    if (this.matchmakingQueue.length > 0) {
      const opponent = this.matchmakingQueue.shift()!;
      const assignCreatorWhite = Math.random() < 0.5;
      const white = assignCreatorWhite ? entry : opponent;
      const black = assignCreatorWhite ? opponent : entry;

      const roomCode = this.generateRoomCode();
      const room: ActiveRoom = {
        roomCode,
        chess: new Chess(),
        white: {
          userId: white.userId,
          username: white.username,
          socketId: white.socketId,
          connected: true,
        },
        black: {
          userId: black.userId,
          username: black.username,
          socketId: black.socketId,
          connected: true,
        },
        status: 'ACTIVE',
        drawOfferBy: null,
        messages: [],
        gameOver: null,
        persisted: false,
      };
      this.rooms.set(roomCode, room);

      prisma.game
        .create({
          data: {
            roomCode,
            whitePlayerId: white.userId,
            blackPlayerId: black.userId,
            status: 'ACTIVE',
            fen: room.chess.fen(),
          },
        })
        .catch((err) => console.error('Failed to persist quick match:', err));

      this.setUserStatus(white.userId, 'in_game');
      this.setUserStatus(black.userId, 'in_game');

      return { matched: true, room, players: [white, black] };
    }

    this.matchmakingQueue.push(entry);
    this.setUserStatus(entry.userId, 'searching');
    return { matched: false };
  }

  public leaveQueue(userId: string): void {
    this.matchmakingQueue = this.matchmakingQueue.filter((q) => q.userId !== userId);
    const tracked = this.onlineUsers.get(userId);
    if (tracked && tracked.status === 'searching') {
      tracked.status = 'online';
    }
  }

  public handleDisconnect(socketId: string): ActiveRoom[] {
    this.matchmakingQueue = this.matchmakingQueue.filter(
      (q) => q.socketId !== socketId
    );

    const updatedRooms: ActiveRoom[] = [];
    for (const room of this.rooms.values()) {
      let changed = false;
      if (room.white?.socketId === socketId) {
        room.white.connected = false;
        changed = true;
      }
      if (room.black?.socketId === socketId) {
        room.black.connected = false;
        changed = true;
      }
      if (changed) {
        updatedRooms.push(room);
      }
    }
    return updatedRooms;
  }
}

export const gameManager = new GameManager();
