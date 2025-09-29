export interface RoomSession {
  roomId: string;
  participants: Map<string, ParticipantInfo>;
  createdAt: Date;
  lastActivity: Date;
}

export interface ParticipantInfo {
  userId: string;
  username: string;
  socketId: string;
  connectionState: 'connected' | 'connecting' | 'disconnected';
  joinedAt: Date;
}

export interface UserPresence {
  userId: string;
  socketId: string;
  roomId?: string;
  connectionState: 'connected' | 'connecting' | 'disconnected';
  lastSeen: Date;
}

export interface ConnectionState {
  userId: string;
  peerId: string;
  state: string; // RTCPeerConnectionState
  iceConnectionState: string; // RTCIceConnectionState
  reconnectionAttempts: number;
  lastReconnectAttempt: Date;
}

export interface SessionData {
  userId: string;
  roomId: string;
  socketId: string;
  joinedAt: Date;
  isActive: boolean;
}