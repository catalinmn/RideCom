import { Injectable, Inject } from '@nestjs/common';
import { RoomSession, UserPresence, ConnectionState, SessionData, ParticipantInfo } from '../interfaces/redis-data.interface';
import Redis from 'ioredis';

@Injectable()
export class RedisSessionService {
  constructor(
    @Inject('REDIS_CLIENT') 
    private readonly redis: Redis,
  ) {}

  // Room Session Management
  async createRoomSession(roomId: string): Promise<void> {
    const session: RoomSession = {
      roomId,
      participants: new Map(),
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    await this.redis.hset(
      `room:${roomId}`,
      'data',
      JSON.stringify({
        ...session,
        participants: Array.from(session.participants.entries()),
      })
    );
    await this.redis.expire(`room:${roomId}`, 86400); // 24 hours TTL
  }

  async getRoomSession(roomId: string): Promise<RoomSession | null> {
    const data = await this.redis.hget(`room:${roomId}`, 'data');
    if (!data) return null;

    const parsed = JSON.parse(data);
    return {
      ...parsed,
      participants: new Map(parsed.participants),
      createdAt: new Date(parsed.createdAt),
      lastActivity: new Date(parsed.lastActivity),
    };
  }

  async addParticipantToRoom(roomId: string, participant: ParticipantInfo): Promise<void> {
    const session = await this.getRoomSession(roomId);
    if (!session) {
      await this.createRoomSession(roomId);
    }

    const updatedSession = session || {
      roomId,
      participants: new Map(),
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    updatedSession.participants.set(participant.userId, participant);
    updatedSession.lastActivity = new Date();

    await this.redis.hset(
      `room:${roomId}`,
      'data',
      JSON.stringify({
        ...updatedSession,
        participants: Array.from(updatedSession.participants.entries()),
      })
    );
  }

  async removeParticipantFromRoom(roomId: string, userId: string): Promise<void> {
    const session = await this.getRoomSession(roomId);
    if (!session) return;

    session.participants.delete(userId);
    session.lastActivity = new Date();

    if (session.participants.size === 0) {
      await this.redis.del(`room:${roomId}`);
    } else {
      await this.redis.hset(
        `room:${roomId}`,
        'data',
        JSON.stringify({
          ...session,
          participants: Array.from(session.participants.entries()),
        })
      );
    }
  }

  async getRoomParticipants(roomId: string): Promise<ParticipantInfo[]> {
    const session = await this.getRoomSession(roomId);
    return session ? Array.from(session.participants.values()) : [];
  }

  // User Presence Management
  async setUserPresence(userId: string, presence: UserPresence): Promise<void> {
    await this.redis.hset(
      `presence:${userId}`,
      'data',
      JSON.stringify(presence)
    );
    await this.redis.expire(`presence:${userId}`, 300); // 5 minutes TTL
  }

  async getUserPresence(userId: string): Promise<UserPresence | null> {
    const data = await this.redis.hget(`presence:${userId}`, 'data');
    if (!data) return null;

    const parsed = JSON.parse(data);
    return {
      ...parsed,
      lastSeen: new Date(parsed.lastSeen),
    };
  }

  async removeUserPresence(userId: string): Promise<void> {
    await this.redis.del(`presence:${userId}`);
  }

  async getAllActiveUsers(): Promise<UserPresence[]> {
    const keys = await this.redis.keys('presence:*');
    const presences: UserPresence[] = [];

    for (const key of keys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        const parsed = JSON.parse(data);
        presences.push({
          ...parsed,
          lastSeen: new Date(parsed.lastSeen),
        });
      }
    }

    return presences;
  }

  // Connection State Management
  async setConnectionState(userId: string, peerId: string, state: ConnectionState): Promise<void> {
    await this.redis.hset(
      `connection:${userId}:${peerId}`,
      'data',
      JSON.stringify(state)
    );
    await this.redis.expire(`connection:${userId}:${peerId}`, 1800); // 30 minutes TTL
  }

  async getConnectionState(userId: string, peerId: string): Promise<ConnectionState | null> {
    const data = await this.redis.hget(`connection:${userId}:${peerId}`, 'data');
    if (!data) return null;

    const parsed = JSON.parse(data);
    return {
      ...parsed,
      lastReconnectAttempt: new Date(parsed.lastReconnectAttempt),
    };
  }

  async removeConnectionState(userId: string, peerId: string): Promise<void> {
    await this.redis.del(`connection:${userId}:${peerId}`);
  }

  async getUserConnections(userId: string): Promise<ConnectionState[]> {
    const keys = await this.redis.keys(`connection:${userId}:*`);
    const connections: ConnectionState[] = [];

    for (const key of keys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        const parsed = JSON.parse(data);
        connections.push({
          ...parsed,
          lastReconnectAttempt: new Date(parsed.lastReconnectAttempt),
        });
      }
    }

    return connections;
  }

  // Session Data Management
  async createSession(sessionData: SessionData): Promise<void> {
    await this.redis.hset(
      `session:${sessionData.userId}`,
      'data',
      JSON.stringify(sessionData)
    );
    await this.redis.expire(`session:${sessionData.userId}`, 86400); // 24 hours TTL
  }

  async getSession(userId: string): Promise<SessionData | null> {
    const data = await this.redis.hget(`session:${userId}`, 'data');
    if (!data) return null;

    const parsed = JSON.parse(data);
    return {
      ...parsed,
      joinedAt: new Date(parsed.joinedAt),
    };
  }

  async updateSession(userId: string, updates: Partial<SessionData>): Promise<void> {
    const session = await this.getSession(userId);
    if (!session) return;

    const updatedSession = { ...session, ...updates };
    await this.redis.hset(
      `session:${userId}`,
      'data',
      JSON.stringify(updatedSession)
    );
  }

  async removeSession(userId: string): Promise<void> {
    await this.redis.del(`session:${userId}`);
  }

  // Refresh Token Management
  async storeRefreshToken(userId: string, tokenId: string, token: string, ttlSeconds: number): Promise<void> {
    await this.redis.hset(`refresh_tokens:${userId}`, tokenId, token);
    await this.redis.expire(`refresh_tokens:${userId}`, ttlSeconds);
  }

  async getRefreshToken(userId: string, tokenId: string): Promise<string | null> {
    return await this.redis.hget(`refresh_tokens:${userId}`, tokenId);
  }

  async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.redis.hdel(`refresh_tokens:${userId}`, tokenId);
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.redis.del(`refresh_tokens:${userId}`);
  }

  async getUserRefreshTokens(userId: string): Promise<string[]> {
    const tokens = await this.redis.hvals(`refresh_tokens:${userId}`);
    return tokens || [];
  }

  // Utility methods
  async cleanupExpiredSessions(): Promise<void> {
    const roomKeys = await this.redis.keys('room:*');
    const presenceKeys = await this.redis.keys('presence:*');
    const connectionKeys = await this.redis.keys('connection:*');
    const sessionKeys = await this.redis.keys('session:*');
    const refreshTokenKeys = await this.redis.keys('refresh_tokens:*');

    const allKeys = [...roomKeys, ...presenceKeys, ...connectionKeys, ...sessionKeys, ...refreshTokenKeys];
    
    for (const key of allKeys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        // Key exists but has no TTL, set appropriate TTL based on key type
        if (key.startsWith('room:')) {
          await this.redis.expire(key, 86400);
        } else if (key.startsWith('presence:')) {
          await this.redis.expire(key, 300);
        } else if (key.startsWith('connection:')) {
          await this.redis.expire(key, 1800);
        } else if (key.startsWith('session:')) {
          await this.redis.expire(key, 86400);
        } else if (key.startsWith('refresh_tokens:')) {
          await this.redis.expire(key, 604800); // 7 days
        }
      }
    }
  }
}