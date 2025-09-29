import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConnectionLogService, CreateConnectionLogDto, ConnectionQualityMetrics } from './connection-log.service';
import { ConnectionLog } from '../entities/connection-log.entity';

describe('ConnectionLogService', () => {
  let service: ConnectionLogService;
  let repository: jest.Mocked<Repository<ConnectionLog>>;

  const mockConnectionLog: ConnectionLog = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user123',
    roomId: 'room123',
    user: null,
    room: null,
    eventType: 'connected',
    connectionQuality: {
      bandwidth: 1000,
      latency: 50,
      packetLoss: 0.1,
    },
    timestamp: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionLogService,
        {
          provide: getRepositoryToken(ConnectionLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ConnectionLogService>(ConnectionLogService);
    repository = module.get(getRepositoryToken(ConnectionLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateConnectionLogDto = {
      userId: 'user123',
      roomId: 'room123',
      eventType: 'connected',
      connectionQuality: { bandwidth: 1000 },
    };

    it('should create connection log successfully', async () => {
      repository.create.mockReturnValue(mockConnectionLog);
      repository.save.mockResolvedValue(mockConnectionLog);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockConnectionLog);
      expect(result).toEqual(mockConnectionLog);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      repository.create.mockReturnValue(mockConnectionLog);
      repository.save.mockRejectedValue(error);

      await expect(service.create(createDto)).rejects.toThrow(error);
    });
  });

  describe('findByUser', () => {
    it('should return logs by user', async () => {
      const logs = [mockConnectionLog];
      repository.find.mockResolvedValue(logs);

      const result = await service.findByUser('user123', 50);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        relations: ['room'],
        select: {
          id: true,
          userId: true,
          roomId: true,
          eventType: true,
          connectionQuality: true,
          timestamp: true,
          room: {
            id: true,
            name: true,
            roomCode: true,
          },
        },
        order: { timestamp: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(logs);
    });

    it('should use default limit when not provided', async () => {
      const logs = [mockConnectionLog];
      repository.find.mockResolvedValue(logs);

      await service.findByUser('user123');

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });
  });

  describe('findByRoom', () => {
    it('should return logs by room', async () => {
      const logs = [mockConnectionLog];
      repository.find.mockResolvedValue(logs);

      const result = await service.findByRoom('room123', 50);

      expect(repository.find).toHaveBeenCalledWith({
        where: { roomId: 'room123' },
        relations: ['user'],
        select: {
          id: true,
          userId: true,
          roomId: true,
          eventType: true,
          connectionQuality: true,
          timestamp: true,
          user: {
            id: true,
            username: true,
          },
        },
        order: { timestamp: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(logs);
    });
  });

  describe('findByEventType', () => {
    it('should return logs by event type', async () => {
      const logs = [mockConnectionLog];
      repository.find.mockResolvedValue(logs);

      const result = await service.findByEventType('connected', 50);

      expect(repository.find).toHaveBeenCalledWith({
        where: { eventType: 'connected' },
        relations: ['user', 'room'],
        select: {
          id: true,
          userId: true,
          roomId: true,
          eventType: true,
          connectionQuality: true,
          timestamp: true,
          user: {
            id: true,
            username: true,
          },
          room: {
            id: true,
            name: true,
            roomCode: true,
          },
        },
        order: { timestamp: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(logs);
    });
  });

  describe('findByDateRange', () => {
    it('should return logs by date range', async () => {
      const logs = [mockConnectionLog];
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      repository.find.mockResolvedValue(logs);

      const result = await service.findByDateRange(startDate, endDate);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          timestamp: expect.any(Object), // Between object
        },
        relations: ['user', 'room'],
        select: {
          id: true,
          userId: true,
          roomId: true,
          eventType: true,
          connectionQuality: true,
          timestamp: true,
          user: {
            id: true,
            username: true,
          },
          room: {
            id: true,
            name: true,
            roomCode: true,
          },
        },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(logs);
    });
  });

  describe('logConnectionEvent', () => {
    it('should log connection event', async () => {
      const metrics: ConnectionQualityMetrics = {
        bandwidth: 1000,
        latency: 50,
      };
      repository.create.mockReturnValue(mockConnectionLog);
      repository.save.mockResolvedValue(mockConnectionLog);

      const result = await service.logConnectionEvent('user123', 'room123', 'connected', metrics);

      expect(repository.create).toHaveBeenCalledWith({
        userId: 'user123',
        roomId: 'room123',
        eventType: 'connected',
        connectionQuality: metrics,
      });
      expect(result).toEqual(mockConnectionLog);
    });
  });

  describe('logQualityMetrics', () => {
    it('should log quality metrics', async () => {
      const metrics: ConnectionQualityMetrics = {
        bandwidth: 1000,
        latency: 50,
        packetLoss: 0.1,
      };
      repository.create.mockReturnValue(mockConnectionLog);
      repository.save.mockResolvedValue(mockConnectionLog);

      const result = await service.logQualityMetrics('user123', 'room123', metrics);

      expect(repository.create).toHaveBeenCalledWith({
        userId: 'user123',
        roomId: 'room123',
        eventType: 'quality_update',
        connectionQuality: metrics,
      });
      expect(result).toEqual(mockConnectionLog);
    });
  });

  describe('getConnectionStats', () => {
    it('should return connection statistics', async () => {
      const logs = [
        { ...mockConnectionLog, eventType: 'connected' },
        { ...mockConnectionLog, eventType: 'quality_update' },
        { ...mockConnectionLog, eventType: 'reconnected' },
        { ...mockConnectionLog, eventType: 'failed' },
      ];
      repository.find.mockResolvedValue(logs);

      const result = await service.getConnectionStats('user123', 'room123', 24);

      expect(result).toEqual({
        totalEvents: 4,
        connectionEvents: 3,
        qualityUpdates: 1,
        averageQuality: expect.any(Object),
        connectionUptime: expect.any(Number),
        reconnectionCount: 1,
        failureCount: 1,
      });
    });
  });

  describe('getRoomConnectionStats', () => {
    it('should return room connection statistics', async () => {
      const logs = [
        { ...mockConnectionLog, user: { id: 'user123', username: 'user1' } },
        { ...mockConnectionLog, userId: 'user456', user: { id: 'user456', username: 'user2' } },
      ];
      repository.find.mockResolvedValue(logs);

      const result = await service.getRoomConnectionStats('room123', 24);

      expect(result).toEqual({
        totalParticipants: 2,
        totalEvents: 2,
        participantStats: expect.any(Array),
        averageQuality: expect.any(Object),
      });
      expect(result.participantStats).toHaveLength(2);
    });
  });

  describe('cleanupOldLogs', () => {
    it('should cleanup old logs and return count', async () => {
      repository.delete.mockResolvedValue({ affected: 10, raw: {} });

      const result = await service.cleanupOldLogs(30);

      expect(repository.delete).toHaveBeenCalledWith({
        timestamp: expect.any(Object), // LessThan object
      });
      expect(result).toBe(10);
    });

    it('should handle case when no logs are deleted', async () => {
      repository.delete.mockResolvedValue({ affected: undefined, raw: {} });

      const result = await service.cleanupOldLogs(30);

      expect(result).toBe(0);
    });
  });

  describe('private methods', () => {
    describe('calculateAverageQuality', () => {
      it('should calculate average quality from logs', async () => {
        const logsWithQuality = [
          {
            ...mockConnectionLog,
            connectionQuality: { bandwidth: 1000, latency: 50, packetLoss: 0.1 },
          },
          {
            ...mockConnectionLog,
            connectionQuality: { bandwidth: 800, latency: 60, packetLoss: 0.2 },
          },
        ];
        repository.find.mockResolvedValue(logsWithQuality);

        const result = await service.getConnectionStats('user123', 'room123', 24);

        expect(result.averageQuality).toEqual({
          bandwidth: 900,
          latency: 55,
          packetLoss: expect.closeTo(0.15, 2),
          jitter: null,
          audioLevel: null,
        });
      });

      it('should return null when no quality logs exist', async () => {
        const logsWithoutQuality = [
          { ...mockConnectionLog, connectionQuality: null },
        ];
        repository.find.mockResolvedValue(logsWithoutQuality);

        const result = await service.getConnectionStats('user123', 'room123', 24);

        expect(result.averageQuality).toBeNull();
      });
    });

    describe('calculateUptime', () => {
      it('should calculate uptime from connection events', async () => {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        const connectionLogs = [
          { ...mockConnectionLog, eventType: 'connected', timestamp: twoHoursAgo },
          { ...mockConnectionLog, eventType: 'disconnected', timestamp: oneHourAgo },
        ];
        repository.find.mockResolvedValue(connectionLogs);

        const result = await service.getConnectionStats('user123', 'room123', 24);

        expect(result.connectionUptime).toBe(60 * 60 * 1000); // 1 hour in milliseconds
      });
    });
  });
});