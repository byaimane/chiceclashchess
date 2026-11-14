import { io, type Socket } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  const token = getToken();
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
    });
  } else {
    socketInstance.auth = { token };
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
  }
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
