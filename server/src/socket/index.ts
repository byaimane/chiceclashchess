import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { env } from '../config/env.js';
import { verifyToken } from '../middleware/auth.js';
import { gameManager, type ActiveRoom } from '../services/gameManager.js';
import type { AuthPayload } from '../types/index.js';

interface AuthedSocket extends Socket {
  data: {
    user?: AuthPayload;
  };
}

function broadcastRoomState(io: Server, room: ActiveRoom): void {
  const socketIds = io.sockets.adapter.rooms.get(room.roomCode);
  if (!socketIds) return;

  for (const socketId of socketIds) {
    const target = io.sockets.sockets.get(socketId) as AuthedSocket | undefined;
    if (target?.data.user) {
      target.emit('room:state', gameManager.toSnapshot(room, target.data.user.userId));
    }
  }
}

export function setupSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      next(new Error('Authentication required'));
      return;
    }

    try {
      socket.data.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    const user = socket.data.user!;
    gameManager.setUserOnline(user.userId, user.username, socket.id);
    io.emit('online:list', gameManager.getOnlineUsers());

    socket.on('online:request', () => {
      socket.emit('online:list', gameManager.getOnlineUsers());
    });

    socket.on(
      'challenge:send',
      (
        payload: { targetUserId?: string },
        ack?: (res: { ok: boolean; error?: string }) => void
      ) => {
        const targetUserId = payload?.targetUserId;
        if (!targetUserId) {
          ack?.({ ok: false, error: 'Target player is required.' });
          return;
        }

        const result = gameManager.createDirectMatch(
          user.userId,
          user.username,
          socket.id,
          targetUserId
        );

        if (result.error || !result.room || !result.socketIds) {
          ack?.({ ok: false, error: result.error || 'Could not start match.' });
          return;
        }

        ack?.({ ok: true });
        io.emit('online:list', gameManager.getOnlineUsers());
        for (const sid of result.socketIds) {
          io.to(sid).emit('matchmaking:matched', {
            roomCode: result.room.roomCode,
          });
        }
      }
    );

    socket.on('room:create', (ack?: (res: { roomCode?: string; error?: string }) => void) => {
      const room = gameManager.createRoom(user.userId, user.username, socket.id);
      socket.join(room.roomCode);
      ack?.({ roomCode: room.roomCode });
    });

    socket.on(
      'room:join',
      (
        payload: { roomCode?: string },
        ack?: (res: { ok: boolean; error?: string }) => void
      ) => {
        const roomCode = payload?.roomCode?.trim().toUpperCase();
        if (!roomCode) {
          ack?.({ ok: false, error: 'Room code is required.' });
          return;
        }

        const { room, error } = gameManager.joinRoom(
          roomCode,
          user.userId,
          user.username,
          socket.id
        );

        if (error || !room) {
          ack?.({ ok: false, error: error || 'Unable to join room.' });
          return;
        }

        socket.join(room.roomCode);
        if (room.status === 'ACTIVE') {
          if (room.white) gameManager.setUserStatus(room.white.userId, 'in_game');
          if (room.black) gameManager.setUserStatus(room.black.userId, 'in_game');
          io.emit('online:list', gameManager.getOnlineUsers());
        }
        ack?.({ ok: true });
        broadcastRoomState(io, room);
      }
    );

    socket.on('matchmaking:join', () => {
      const result = gameManager.enqueueQuickMatch({
        userId: user.userId,
        username: user.username,
        socketId: socket.id,
      });

      io.emit('online:list', gameManager.getOnlineUsers());

      if (result.matched && result.room && result.players) {
        for (const player of result.players) {
          io.to(player.socketId).emit('matchmaking:matched', {
            roomCode: result.room.roomCode,
          });
        }
      } else {
        socket.emit('matchmaking:queued');
      }
    });

    socket.on('matchmaking:leave', () => {
      gameManager.leaveQueue(user.userId);
      io.emit('online:list', gameManager.getOnlineUsers());
      socket.emit('matchmaking:cancelled');
    });

    socket.on(
      'game:move',
      async (
        payload: { roomCode: string; from: string; to: string; promotion?: string },
        ack?: (res: { ok: boolean; error?: string }) => void
      ) => {
        const { room, error, gameOver } = await gameManager.makeMove(
          payload.roomCode,
          user.userId,
          payload.from,
          payload.to,
          payload.promotion
        );

        if (error || !room) {
          ack?.({ ok: false, error: error || 'Invalid move.' });
          return;
        }

        ack?.({ ok: true });
        broadcastRoomState(io, room);
        if (gameOver) {
          io.to(room.roomCode).emit('game:over', gameOver);
        }
      }
    );

    socket.on('game:resign', async (payload: { roomCode: string }) => {
      const { room, gameOver } = await gameManager.resign(
        payload.roomCode,
        user.userId
      );
      if (room) {
        broadcastRoomState(io, room);
        if (gameOver) {
          io.to(room.roomCode).emit('game:over', gameOver);
        }
      }
    });

    socket.on('game:draw:offer', (payload: { roomCode: string }) => {
      const { room } = gameManager.offerDraw(payload.roomCode, user.userId);
      if (room) {
        broadcastRoomState(io, room);
      }
    });

    socket.on(
      'game:draw:respond',
      async (payload: { roomCode: string; accept: boolean }) => {
        const { room, gameOver } = await gameManager.respondDraw(
          payload.roomCode,
          user.userId,
          payload.accept
        );
        if (room) {
          broadcastRoomState(io, room);
          if (gameOver) {
            io.to(room.roomCode).emit('game:over', gameOver);
          }
        }
      }
    );

    socket.on('chat:send', (payload: { roomCode: string; text: string }) => {
      const { room, message } = gameManager.addChatMessage(
        payload.roomCode,
        user.userId,
        user.username,
        payload.text
      );
      if (room && message) {
        io.to(room.roomCode).emit('chat:message', message);
      }
    });

    socket.on('disconnect', () => {
      gameManager.setUserOffline(user.userId, socket.id);
      io.emit('online:list', gameManager.getOnlineUsers());
      const updatedRooms = gameManager.handleDisconnect(socket.id);
      for (const room of updatedRooms) {
        broadcastRoomState(io, room);
      }
    });
  });

  return io;
}
