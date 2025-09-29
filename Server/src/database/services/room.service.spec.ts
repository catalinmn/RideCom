import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RoomService, CreateRoomDto, UpdateRoomDto } from './room.service';
import { Room } from '../entities/room.entity';

describe('RoomService', () => {
  let service: RoomService;
  let repository: jest.Mocked<Repository<Room>>;

  const mockRoom: Room = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Room',
    roomCode: 'ABC123',
    creatorId: 'user123',
    creator: null,
    maxParticipants: 8,
    isActive: true,
    createdAt: new Date(),
    participants: [],
    connectionLogs: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: getRepositoryToken(Room),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
    repository = module.get(getRepositoryToken(Room));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createRoomDto: CreateRoomDto = {
      name: 'Test Room',
      roomCode: 'ABC123',
      creatorId: 'user123',
      maxParticipants: 8,
    };

    it('should create a room successfully', async () => {
      repository.create.mockReturnValue(mockRoom);
      repository.save.mockResolvedValue(mockRoom);

      const result = await service.create(createRoomDto);

      expect(repository.create).toHaveBeenCalledWith(createRoomDto);
      expect(repository.save).toHaveBeenCalledWith(mockRoom);
      expect(result).toEqual(mockRoom);
    });

    it('should throw ConflictException for duplicate room code', async () => {
      const error = new QueryFailedError('query', [], new Error('duplicate key value violates unique constraint "rooms_room_code_key"'));
      repository.create.mockReturnValue(mockRoom);
      repository.save.mockRejectedValue(error);

      await expect(service.create(createRoomDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createRoomDto)).rejects.toThrow('Room code already exists');
    });
  });

  describe('findAll', () => {
    it('should return array of rooms', async () => {
      const rooms = [mockRoom];
      repository.find.mockResolvedValue(rooms);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['creator'],
        select: {
          id: true,
          name: true,
          roomCode: true,
          creatorId: true,
          maxParticipants: true,
          isActive: true,
          createdAt: true,
          creator: {
            id: true,
            username: true,
          },
        },
      });
      expect(result).toEqual(rooms);
    });
  });

  describe('findById', () => {
    it('should return room when found', async () => {
      repository.findOne.mockResolvedValue(mockRoom);

      const result = await service.findById(mockRoom.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockRoom.id },
        relations: ['creator', 'participants', 'participants.user'],
        select: {
          id: true,
          name: true,
          roomCode: true,
          creatorId: true,
          maxParticipants: true,
          isActive: true,
          createdAt: true,
          creator: {
            id: true,
            username: true,
          },
          participants: {
            id: true,
            joinedAt: true,
            leftAt: true,
            isActive: true,
            user: {
              id: true,
              username: true,
            },
          },
        },
      });
      expect(result).toEqual(mockRoom);
    });

    it('should throw NotFoundException when room not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findById('nonexistent')).rejects.toThrow('Room with ID nonexistent not found');
    });
  });

  describe('findByRoomCode', () => {
    it('should return room when found', async () => {
      repository.findOne.mockResolvedValue(mockRoom);

      const result = await service.findByRoomCode(mockRoom.roomCode);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { roomCode: mockRoom.roomCode },
        relations: ['creator', 'participants', 'participants.user'],
        select: {
          id: true,
          name: true,
          roomCode: true,
          creatorId: true,
          maxParticipants: true,
          isActive: true,
          createdAt: true,
          creator: {
            id: true,
            username: true,
          },
          participants: {
            id: true,
            joinedAt: true,
            leftAt: true,
            isActive: true,
            user: {
              id: true,
              username: true,
            },
          },
        },
      });
      expect(result).toEqual(mockRoom);
    });

    it('should throw NotFoundException when room not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findByRoomCode('INVALID')).rejects.toThrow(NotFoundException);
      await expect(service.findByRoomCode('INVALID')).rejects.toThrow('Room with code INVALID not found');
    });
  });

  describe('findActiveRooms', () => {
    it('should return active rooms', async () => {
      const activeRooms = [mockRoom];
      repository.find.mockResolvedValue(activeRooms);

      const result = await service.findActiveRooms();

      expect(repository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['creator'],
        select: {
          id: true,
          name: true,
          roomCode: true,
          creatorId: true,
          maxParticipants: true,
          isActive: true,
          createdAt: true,
          creator: {
            id: true,
            username: true,
          },
        },
      });
      expect(result).toEqual(activeRooms);
    });
  });

  describe('findRoomsByCreator', () => {
    it('should return rooms by creator', async () => {
      const rooms = [mockRoom];
      repository.find.mockResolvedValue(rooms);

      const result = await service.findRoomsByCreator('user123');

      expect(repository.find).toHaveBeenCalledWith({
        where: { creatorId: 'user123' },
        relations: ['participants', 'participants.user'],
        select: {
          id: true,
          name: true,
          roomCode: true,
          creatorId: true,
          maxParticipants: true,
          isActive: true,
          createdAt: true,
          participants: {
            id: true,
            joinedAt: true,
            leftAt: true,
            isActive: true,
            user: {
              id: true,
              username: true,
            },
          },
        },
      });
      expect(result).toEqual(rooms);
    });
  });

  describe('update', () => {
    const updateRoomDto: UpdateRoomDto = {
      name: 'Updated Room',
    };

    it('should update room successfully', async () => {
      const updatedRoom = { ...mockRoom, ...updateRoomDto };
      repository.findOne.mockResolvedValue(mockRoom);
      repository.save.mockResolvedValue(updatedRoom);

      const result = await service.update(mockRoom.id, updateRoomDto);

      expect(repository.save).toHaveBeenCalledWith({ ...mockRoom, ...updateRoomDto });
      expect(result).toEqual(updatedRoom);
    });

    it('should throw NotFoundException when room not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateRoomDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('should deactivate room successfully', async () => {
      const deactivatedRoom = { ...mockRoom, isActive: false };
      repository.findOne.mockResolvedValue(mockRoom);
      repository.save.mockResolvedValue(deactivatedRoom);

      const result = await service.deactivate(mockRoom.id);

      expect(result.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete room successfully', async () => {
      repository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.delete(mockRoom.id);

      expect(repository.delete).toHaveBeenCalledWith(mockRoom.id);
    });

    it('should throw NotFoundException when room not found', async () => {
      repository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateUniqueRoomCode', () => {
    it('should generate unique room code', async () => {
      repository.findOne.mockResolvedValue(null); // Room code not found, so it's unique

      const roomCode = await service.generateUniqueRoomCode();

      expect(roomCode).toHaveLength(6);
      expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should retry when room code already exists', async () => {
      repository.findOne
        .mockResolvedValueOnce(mockRoom) // First attempt finds existing room
        .mockResolvedValueOnce(null); // Second attempt finds no room (unique)

      const roomCode = await service.generateUniqueRoomCode();

      expect(roomCode).toHaveLength(6);
      expect(repository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException after max attempts', async () => {
      repository.findOne.mockResolvedValue(mockRoom); // Always finds existing room

      await expect(service.generateUniqueRoomCode()).rejects.toThrow(BadRequestException);
      await expect(service.generateUniqueRoomCode()).rejects.toThrow('Unable to generate unique room code after multiple attempts');
    });
  });

  describe('getActiveParticipantCount', () => {
    it('should return active participant count', async () => {
      const roomWithParticipants = {
        ...mockRoom,
        participants: [
          { isActive: true, leftAt: null },
          { isActive: true, leftAt: null },
          { isActive: false, leftAt: new Date() },
        ],
      };
      repository.findOne.mockResolvedValue(roomWithParticipants);

      const count = await service.getActiveParticipantCount(mockRoom.id);

      expect(count).toBe(2);
    });

    it('should throw NotFoundException when room not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.getActiveParticipantCount('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});