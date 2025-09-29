import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RoomParticipantService, CreateRoomParticipantDto } from './room-participant.service';
import { RoomParticipant } from '../entities/room-participant.entity';

describe('RoomParticipantService', () => {
  let service: RoomParticipantService;
  let repository: jest.Mocked<Repository<RoomParticipant>>;

  const mockParticipant: RoomParticipant = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    roomId: 'room123',
    userId: 'user123',
    room: null,
    user: null,
    joinedAt: new Date(),
    leftAt: null,
    isActive: true,
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomParticipantService,
        {
          provide: getRepositoryToken(RoomParticipant),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RoomParticipantService>(RoomParticipantService);
    repository = module.get(getRepositoryToken(RoomParticipant));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addParticipant', () => {
    const createDto: CreateRoomParticipantDto = {
      roomId: 'room123',
      userId: 'user123',
    };

    it('should add participant successfully', async () => {
      repository.findOne.mockResolvedValue(null); // No existing participant
      repository.create.mockReturnValue(mockParticipant);
      repository.save.mockResolvedValue(mockParticipant);

      const result = await service.addParticipant(createDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          roomId: createDto.roomId,
          userId: createDto.userId,
          isActive: true,
        },
      });
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockParticipant);
      expect(result).toEqual(mockParticipant);
    });

    it('should throw ConflictException if user is already active participant', async () => {
      repository.findOne.mockResolvedValue(mockParticipant);

      await expect(service.addParticipant(createDto)).rejects.toThrow(ConflictException);
      await expect(service.addParticipant(createDto)).rejects.toThrow('User is already an active participant in this room');
    });

    it('should throw ConflictException for duplicate key error', async () => {
      const error = new QueryFailedError('query', [], new Error('duplicate key'));
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockParticipant);
      repository.save.mockRejectedValue(error);

      await expect(service.addParticipant(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for foreign key error', async () => {
      const error = new QueryFailedError('query', [], new Error('foreign key'));
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockParticipant);
      repository.save.mockRejectedValue(error);

      await expect(service.addParticipant(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant successfully', async () => {
      repository.findOne.mockResolvedValue(mockParticipant);
      repository.save.mockResolvedValue({ ...mockParticipant, isActive: false, leftAt: new Date() });

      await service.removeParticipant('room123', 'user123');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          roomId: 'room123',
          userId: 'user123',
          isActive: true,
        },
      });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
          leftAt: expect.any(Date),
        })
      );
    });

    it('should throw NotFoundException if participant not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.removeParticipant('room123', 'user123')).rejects.toThrow(NotFoundException);
      await expect(service.removeParticipant('room123', 'user123')).rejects.toThrow('Active participant not found in this room');
    });
  });

  describe('findRoomParticipants', () => {
    it('should return room participants', async () => {
      const participants = [mockParticipant];
      repository.find.mockResolvedValue(participants);

      const result = await service.findRoomParticipants('room123');

      expect(repository.find).toHaveBeenCalledWith({
        where: { roomId: 'room123' },
        relations: ['user'],
        select: {
          id: true,
          roomId: true,
          userId: true,
          joinedAt: true,
          leftAt: true,
          isActive: true,
          user: {
            id: true,
            username: true,
          },
        },
        order: { joinedAt: 'ASC' },
      });
      expect(result).toEqual(participants);
    });
  });

  describe('findActiveRoomParticipants', () => {
    it('should return active room participants', async () => {
      const participants = [mockParticipant];
      repository.find.mockResolvedValue(participants);

      const result = await service.findActiveRoomParticipants('room123');

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          roomId: 'room123',
          isActive: true,
        },
        relations: ['user'],
        select: {
          id: true,
          roomId: true,
          userId: true,
          joinedAt: true,
          leftAt: true,
          isActive: true,
          user: {
            id: true,
            username: true,
          },
        },
        order: { joinedAt: 'ASC' },
      });
      expect(result).toEqual(participants);
    });
  });

  describe('findUserParticipations', () => {
    it('should return user participations', async () => {
      const participations = [mockParticipant];
      repository.find.mockResolvedValue(participations);

      const result = await service.findUserParticipations('user123');

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        relations: ['room'],
        order: { joinedAt: 'DESC' },
      });
      expect(result).toEqual(participations);
    });
  });

  describe('findActiveUserParticipations', () => {
    it('should return active user participations', async () => {
      const participations = [mockParticipant];
      repository.find.mockResolvedValue(participations);

      const result = await service.findActiveUserParticipations('user123');

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          isActive: true,
        },
        relations: ['room'],
        order: { joinedAt: 'DESC' },
      });
      expect(result).toEqual(participations);
    });
  });

  describe('isUserInRoom', () => {
    it('should return true if user is in room', async () => {
      repository.findOne.mockResolvedValue(mockParticipant);

      const result = await service.isUserInRoom('room123', 'user123');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          roomId: 'room123',
          userId: 'user123',
          isActive: true,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false if user is not in room', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.isUserInRoom('room123', 'user123');

      expect(result).toBe(false);
    });
  });

  describe('getParticipantCount', () => {
    it('should return participant count', async () => {
      repository.count.mockResolvedValue(5);

      const result = await service.getParticipantCount('room123');

      expect(repository.count).toHaveBeenCalledWith({
        where: {
          roomId: 'room123',
          isActive: true,
        },
      });
      expect(result).toBe(5);
    });
  });

  describe('findParticipant', () => {
    it('should return participant when found', async () => {
      repository.findOne.mockResolvedValue(mockParticipant);

      const result = await service.findParticipant('room123', 'user123');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { roomId: 'room123', userId: 'user123' },
        relations: ['user', 'room'],
        select: {
          id: true,
          roomId: true,
          userId: true,
          joinedAt: true,
          leftAt: true,
          isActive: true,
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
      });
      expect(result).toEqual(mockParticipant);
    });

    it('should throw NotFoundException when participant not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findParticipant('room123', 'user123')).rejects.toThrow(NotFoundException);
      await expect(service.findParticipant('room123', 'user123')).rejects.toThrow('Participant not found');
    });
  });

  describe('rejoinRoom', () => {
    it('should create new participation if none exists', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockParticipant);
      repository.save.mockResolvedValue(mockParticipant);

      const result = await service.rejoinRoom('room123', 'user123');

      expect(repository.create).toHaveBeenCalledWith({ roomId: 'room123', userId: 'user123' });
      expect(result).toEqual(mockParticipant);
    });

    it('should reactivate existing participation', async () => {
      const inactiveParticipant = { ...mockParticipant, isActive: false, leftAt: new Date() };
      repository.findOne.mockResolvedValue(inactiveParticipant);
      repository.save.mockResolvedValue({ ...inactiveParticipant, isActive: true, leftAt: null });

      const result = await service.rejoinRoom('room123', 'user123');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          leftAt: null,
          joinedAt: expect.any(Date),
        })
      );
      expect(result.isActive).toBe(true);
    });

    it('should throw ConflictException if user is already active', async () => {
      const activeParticipant = { ...mockParticipant, isActive: true };
      repository.findOne.mockResolvedValue(activeParticipant);

      await expect(service.rejoinRoom('room123', 'user123')).rejects.toThrow(ConflictException);
      await expect(service.rejoinRoom('room123', 'user123')).rejects.toThrow('User is already an active participant');
    });
  });
});