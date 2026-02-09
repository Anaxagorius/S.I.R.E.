import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const newSocket = io('http://localhost:8080/sim', {
      transports: ['websocket'],
      extraHeaders: {
        'x-api-key': 'local-dev-key'
      }
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });
    
    newSocket.on('error:occurred', (error) => {
      console.error('Socket error:', error);
    });
    
    setSocket(newSocket);
    
    return () => {
      console.log('Closing socket connection');
      newSocket.close();
    };
  }, []);
  
  const emit = useCallback((event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  }, [socket, connected]);
  
  const on = useCallback((event, handler) => {
    if (socket) {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    }
  }, [socket]);
  
  return { socket, connected, emit, on };
};
