import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Room } from '../entities/room.entity';

export interface CreateRoomDto {
  name: string;
  roomCode: string;
  creatorId: string;
  maxParticipants?: number;
}

export interface UpdateRoomDto {
  name?: string;
  maxParticipants?: number;
  isActive?: boolean;
}

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    try {
      const room = this.roomRepository.create(createRoomDto);
      const savedRoom = await this.roomRepository.save(room);
      this.logger.log(`Room created with ID: ${savedRoom.id}, Code: ${savedRoom.roomCode}`);
      return savedRoom;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        if (error.message.includes('duplicate key') && error.message.includes('room_code')) {
          throw new ConflictException('Room code already exists');
        }
      }
      this.logger.error(`Failed to create room: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<Room[]> {
    try {
      return await this.roomRepository.find({
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
    } catch (error) {
      this.logger.error(`Failed to fetch rooms: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<Room> {
    try {
      const room = await this.roomRepository.findOne({
        where: { id },
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

      if (!room) {
        throw new NotFoundException(`Room with ID ${id} not found`);
      }

      return room;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find room by ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByRoomCode(roomCode: string): Promise<Room> {
    try {
      const room = await this.roomRepository.findOne({
        where: { roomCode },
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

      if (!room) {
        throw new NotFoundException(`Room with code ${roomCode} not found`);
      }

      return room;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find room by code ${roomCode}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findActiveRooms(): Promise<Room[]> {
    try {
      return await this.roomRepository.find({
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
    } catch (error) {
      this.logger.error(`Failed to fetch active rooms: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findRoomsByCreator(creatorId: string): Promise<Room[]> {
    try {
      return await this.roomRepository.find({
        where: { creatorId },
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
    } catch (error) {
      this.logger.error(`Failed to fetch rooms by creator ${creatorId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    try {
      const room = await this.findById(id);
      
      Object.assign(room, updateRoomDto);
      const updatedRoom = await this.roomRepository.save(room);
      
      this.logger.log(`Room updated with ID: ${updatedRoom.id}`);
      return updatedRoom;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update room ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deactivate(id: string): Promise<Room> {
    try {
      return await this.update(id, { isActive: false });
    } catch (error) {
      this.logger.error(`Failed to deactivate room ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.roomRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Room with ID ${id} not found`);
      }
      
      this.logger.log(`Room deleted with ID: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete room ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async generateUniqueRoomCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      let roomCode = '';
      for (let i = 0; i < 6; i++) {
        roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      try {
        await this.findByRoomCode(roomCode);
        attempts++;
      } catch (error) {
        if (error instanceof NotFoundException) {
          return roomCode;
        }
        throw error;
      }
    }

    throw new BadRequestException('Unable to generate unique room code after multiple attempts');
  }

  async getActiveParticipantCount(roomId: string): Promise<number> {
    try {
      const room = await this.roomRepository.findOne({
        where: { id: roomId },
        relations: ['participants'],
      });

      if (!room) {
        throw new NotFoundException(`Room with ID ${roomId} not found`);
      }

      return room.participants.filter(p => p.isActive && !p.leftAt).length;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get participant count for room ${roomId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}