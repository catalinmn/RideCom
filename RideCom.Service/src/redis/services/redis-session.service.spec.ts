import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { RedisSessionService } from './redis-session.service';
import { REDIS_CLIENT } from '../redis.module';
import { RoomSession, UserPresence, ConnectionState, SessionData, ParticipantInfo } from '../interfaces/redis-data.interface';

describe('RedisSessionService', () => {
  let service: RedisSessionService;
  let redis: jest.Mocked<Redis>;

  const mockParticipant: ParticipantInfo = {
    userId: 'user123',
    username: 'testuser',
    socketId: 'socket123',
    connectionState: 'connected',
    joinedAt: new Date(),
  };

  const mockUserPresence: UserPresence = {
    userId: 'user123',
    socketId: 'socket123',
    roomId: 'room123',
    connectionState: 'connected',
    lastSeen: new Date(),
  };

  const mockConnectionState: ConnectionState = {
    userId: 'user123',
    peerId: 'peer123',
    state: 'connected',
    iceConnectionState: 'connected',
    reconnectionAttempts: 0,
    lastReconnectAttempt: new Date(),
  };

  const mockSessionData: SessionData = {
    userId: 'user123',
    roomId: 'room123',
    socketId: 'socket123',
    joinedAt: new Date(),
    isActive: true,
  };

  beforeEach(async () => {
    const mockRedis = {
      hset: jest.fn(),
      hget: jest.fn(),
      expire: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      ttl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisSessionService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<RedisSessionService>(RedisSessionService);
    redis = module.get(REDIS_CLIENT);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Room Session Management', () => {
    describe('createRoomSession', () => {
      it('should create a room session', async () => {
        redis.hset.mockResolvedValue(1);
        redis.expire.mockResolvedValue(1);

        await service.createRoomSession('room123');

        expect(redis.hset).toHaveBeenCalledWith(
          'room:room123',
          'data',
          expect.stringContaining('"roomId":"room123"')
        );
        expect(redis.expire).toHaveBeenCalledWith('room:room123', 86400);
      });
    });

    describe('getRoomSession', () => {
      it('should return room session when exists', async () => {
        const sessionData = {
          roomId: 'room123',
          participants: [],
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        };
        redis.hget.mockResolvedValue(JSON.stringify(sessionData));

        const result = await service.getRoomSession('room123');

        expect(redis.hget).toHaveBeenCalledWith('room:room123', 'data');
        expect(result).toBeDefined();
        expect(result.roomId).toBe('room123');
      });

      it('should return null when session does not exist', async () => {
        redis.hget.mockResolvedValue(null);

        const result = await service.getRoomSession('room123');

        expect(result).toBeNull();
      });
    });

    describe('addParticipantToRoom', () => {
      it('should add participant to existing room', async () => {
        const existingSession = {
          roomId: 'room123',
          participants: [],
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        };
        redis.hget.mockResolvedValue(JSON.stringify(existingSession));
        redis.hset.mockResolvedValue(1);

        await service.addParticipantToRoom('room123', mockParticipant);

        expect(redis.hset).toHaveBeenCalledWith(
          'room:room123',
          'data',
          expect.stringContaining('"userId":"user123"')
        );
      });

      it('should create room if it does not exist', async () => {
        redis.hget.mockResolvedValue(null);
        redis.hset.mockResolvedValue(1);
        redis.expire.mockResolvedValue(1);

        await service.addParticipantToRoom('room123', mockParticipant);

        expect(redis.hset).toHaveBeenCalledTimes(2); // Once for creation, once for adding participant
      });
    });

    describe('removeParticipantFromRoom', () => {
      it('should remove participant from room', async () => {
        const sessionWithParticipant = {
          roomId: 'room123',
          participants: [['user123', mockParticipant], ['user456', { ...mockParticipant, userId: 'user456' }]],
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        };
        redis.hget.mockResolvedValue(JSON.stringify(sessionWithParticipant));
        redis.hset.mockResolvedValue(1);

        await service.removeParticipantFromRoom('room123', 'user123');

        expect(redis.hset).toHaveBeenCalled();
      });

      it('should delete room when no participants left', async () => {
        const sessionWithOneParticipant = {
          roomId: 'room123',
          participants: [['user123', mockParticipant]],
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        };
        redis.hget.mockResolvedValue(JSON.stringify(sessionWithOneParticipant));
        redis.del.mockResolvedValue(1);

        await service.removeParticipantFromRoom('room123', 'user123');

        expect(redis.del).toHaveBeenCalledWith('room:room123');
      });
    });

    describe('getRoomParticipants', () => {
      it('should return participants array', async () => {
        const sessionWithParticipants = {
          roomId: 'room123',
          participants: [['user123', mockParticipant]],
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        };
        redis.hget.mockResolvedValue(JSON.stringify(sessionWithParticipants));

        const result = await service.getRoomParticipants('room123');

        expect(result).toHaveLength(1);
        expect(result[0].userId).toBe('user123');
      });

      it('should return empty array when room does not exist', async () => {
        redis.hget.mockResolvedValue(null);

        const result = await service.getRoomParticipants('room123');

        expect(result).toEqual([]);
      });
    });
  });

  describe('User Presence Management', () => {
    describe('setUserPresence', () => {
      it('should set user presence', async () => {
        redis.hset.mockResolvedValue(1);
        redis.expire.mockResolvedValue(1);

        await service.setUserPresence('user123', mockUserPresence);

        expect(redis.hset).toHaveBeenCalledWith(
          'presence:user123',
          'data',
          expect.stringContaining('"userId":"user123"')
        );
        expect(redis.expire).toHaveBeenCalledWith('presence:user123', 300);
      });
    });

    describe('getUserPresence', () => {
      it('should return user presence when exists', async () => {
        redis.hget.mockResolvedValue(JSON.stringify({
          ...mockUserPresence,
          lastSeen: mockUserPresence.lastSeen.toISOString(),
        }));

        const result = await service.getUserPresence('user123');

        expect(result).toBeDefined();
        expect(result.userId).toBe('user123');
      });

      it('should return null when presence does not exist', async () => {
        redis.hget.mockResolvedValue(null);

        const result = await service.getUserPresence('user123');

        expect(result).toBeNull();
      });
    });

    describe('removeUserPresence', () => {
      it('should remove user presence', async () => {
        redis.del.mockResolvedValue(1);

        await service.removeUserPresence('user123');

        expect(redis.del).toHaveBeenCalledWith('presence:user123');
      });
    });

    describe('getAllActiveUsers', () => {
      it('should return all active users', async () => {
        redis.keys.mockResolvedValue(['presence:user123', 'presence:user456']);
        redis.hget
          .mockResolvedValueOnce(JSON.stringify({
            ...mockUserPresence,
            lastSeen: mockUserPresence.lastSeen.toISOString(),
          }))
          .mockResolvedValueOnce(JSON.stringify({
            ...mockUserPresence,
            userId: 'user456',
            lastSeen: mockUserPresence.lastSeen.toISOString(),
          }));

        const result = await service.getAllActiveUsers();

        expect(result).toHaveLength(2);
        expect(result[0].userId).toBe('user123');
        expect(result[1].userId).toBe('user456');
      });
    });
  });

  describe('Connection State Management', () => {
    describe('setConnectionState', () => {
      it('should set connection state', async () => {
        redis.hset.mockResolvedValue(1);
        redis.expire.mockResolvedValue(1);

        await service.setConnectionState('user123', 'peer123', mockConnectionState);

        expect(redis.hset).toHaveBeenCalledWith(
          'connection:user123:peer123',
          'data',
          expect.stringContaining('"userId":"user123"')
        );
        expect(redis.expire).toHaveBeenCalledWith('connection:user123:peer123', 1800);
      });
    });

    describe('getConnectionState', () => {
      it('should return connection state when exists', async () => {
        redis.hget.mockResolvedValue(JSON.stringify({
          ...mockConnectionState,
          lastReconnectAttempt: mockConnectionState.lastReconnectAttempt.toISOString(),
        }));

        const result = await service.getConnectionState('user123', 'peer123');

        expect(result).toBeDefined();
        expect(result.userId).toBe('user123');
        expect(result.peerId).toBe('peer123');
      });

      it('should return null when connection state does not exist', async () => {
        redis.hget.mockResolvedValue(null);

        const result = await service.getConnectionState('user123', 'peer123');

        expect(result).toBeNull();
      });
    });

    describe('removeConnectionState', () => {
      it('should remove connection state', async () => {
        redis.del.mockResolvedValue(1);

        await service.removeConnectionState('user123', 'peer123');

        expect(redis.del).toHaveBeenCalledWith('connection:user123:peer123');
      });
    });

    describe('getUserConnections', () => {
      it('should return user connections', async () => {
        redis.keys.mockResolvedValue(['connection:user123:peer1', 'connection:user123:peer2']);
        redis.hget
          .mockResolvedValueOnce(JSON.stringify({
            ...mockConnectionState,
            peerId: 'peer1',
            lastReconnectAttempt: mockConnectionState.lastReconnectAttempt.toISOString(),
          }))
          .mockResolvedValueOnce(JSON.stringify({
            ...mockConnectionState,
            peerId: 'peer2',
            lastReconnectAttempt: mockConnectionState.lastReconnectAttempt.toISOString(),
          }));

        const result = await service.getUserConnections('user123');

        expect(result).toHaveLength(2);
        expect(result[0].peerId).toBe('peer1');
        expect(result[1].peerId).toBe('peer2');
      });
    });
  });

  describe('Session Data Management', () => {
    describe('createSession', () => {
      it('should create session', async () => {
        redis.hset.mockResolvedValue(1);
        redis.expire.mockResolvedValue(1);

        await service.createSession(mockSessionData);

        expect(redis.hset).toHaveBeenCalledWith(
          'session:user123',
          'data',
          expect.stringContaining('"userId":"user123"')
        );
        expect(redis.expire).toHaveBeenCalledWith('session:user123', 86400);
      });
    });

    describe('getSession', () => {
      it('should return session when exists', async () => {
        redis.hget.mockResolvedValue(JSON.stringify({
          ...mockSessionData,
          joinedAt: mockSessionData.joinedAt.toISOString(),
        }));

        const result = await service.getSession('user123');

        expect(result).toBeDefined();
        expect(result.userId).toBe('user123');
      });

      it('should return null when session does not exist', async () => {
        redis.hget.mockResolvedValue(null);

        const result = await service.getSession('user123');

        expect(result).toBeNull();
      });
    });

    describe('updateSession', () => {
      it('should update existing session', async () => {
        redis.hget.mockResolvedValue(JSON.stringify({
          ...mockSessionData,
          joinedAt: mockSessionData.joinedAt.toISOString(),
        }));
        redis.hset.mockResolvedValue(1);

        await service.updateSession('user123', { isActive: false });

        expect(redis.hset).toHaveBeenCalledWith(
          'session:user123',
          'data',
          expect.stringContaining('"isActive":false')
        );
      });

      it('should not update if session does not exist', async () => {
        redis.hget.mockResolvedValue(null);

        await service.updateSession('user123', { isActive: false });

        expect(redis.hset).not.toHaveBeenCalled();
      });
    });

    describe('removeSession', () => {
      it('should remove session', async () => {
        redis.del.mockResolvedValue(1);

        await service.removeSession('user123');

        expect(redis.del).toHaveBeenCalledWith('session:user123');
      });
    });
  });

  describe('Utility Methods', () => {
    describe('cleanupExpiredSessions', () => {
      it('should cleanup expired sessions', async () => {
        redis.keys
          .mockResolvedValueOnce(['room:room1'])
          .mockResolvedValueOnce(['presence:user1'])
          .mockResolvedValueOnce(['connection:user1:peer1'])
          .mockResolvedValueOnce(['session:user1'])
          .mockResolvedValueOnce(['refresh_tokens:user1']);
        redis.ttl.mockResolvedValue(-1); // No TTL set
        redis.expire.mockResolvedValue(1);

        await service.cleanupExpiredSessions();

        expect(redis.expire).toHaveBeenCalledTimes(5);
        expect(redis.expire).toHaveBeenCalledWith('room:room1', 86400);
        expect(redis.expire).toHaveBeenCalledWith('presence:user1', 300);
        expect(redis.expire).toHaveBeenCalledWith('connection:user1:peer1', 1800);
        expect(redis.expire).toHaveBeenCalledWith('session:user1', 86400);
        expect(redis.expire).toHaveBeenCalledWith('refresh_tokens:user1', 604800);
      });
    });
  });
});