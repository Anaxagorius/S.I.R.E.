import { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
    const apiKey = import.meta.env.VITE_API_KEY ?? 'local-dev-key';
    const newSocket = io(`${socketBase}/sim`, {
      transports: ['websocket'],
      extraHeaders: {
        'x-api-key': apiKey
      }
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    newSocket.on('error:occurred', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      console.log('Closing socket connection');
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current && connected) {
      socketRef.current.emit(event, data);
    }
  }, [connected]);

  // `on` reads socketRef.current at call time (not at creation), so it always
  // registers on the current socket instance. The cleanup closure captures the
  // specific socket used during registration, ensuring correct removal even
  // across reconnects (which reuse the same socket object).
  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (socket) {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    }
    return undefined;
  }, []);

  return { connected, emit, on };
};
