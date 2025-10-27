import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  joinParcel: (parcelId: string) => void;
  leaveParcel: (parcelId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('sensorUpdate', (data) => {
      console.log('Sensor update received:', data);
      // This will be handled by components that need real-time updates
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const joinParcel = (parcelId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('joinParcel', parcelId);
    }
  };

  const leaveParcel = (parcelId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leaveParcel', parcelId);
    }
  };

  const value: SocketContextType = {
    socket: socketRef.current,
    joinParcel,
    leaveParcel,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
