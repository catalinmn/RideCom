import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { RoomParticipant } from '../entities/room-participant.entity';

export interface CreateRoomParticipantDto {
  roomId: string;
  userId: string;
}

@Injectable()
export class RoomParticipantService {
  private readonly logger = new Logger(RoomParticipantService.name);

  constructor(
    @InjectRepository(RoomParticipant)
    private readonly roomParticipantRepository: Repository<RoomParticipant>,
  ) {}

  async addParticipant(createDto: CreateRoomParticipantDto): Promise<RoomParticipant> {
    try {
      // Check if user is already an active participant
      const existingParticipant = await this.roomParticipantRepository.findOne({
        where: {
          roomId: createDto.roomId,
          userId: createDto.userId,
          isActive: true,
        },
      });

      if (existingParticipant) {
        throw new ConflictException('User is already an active participant in this room');
      }

      const participant = this.roomParticipantRepository.create(createDto);
      const savedParticipant = await this.roomParticipantRepository.save(participant);
      
      this.logger.log(`Participant added: User ${createDto.userId} to Room ${createDto.roomId}`);
      return savedParticipant;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        if (error.message.includes('duplicate key')) {
          throw new ConflictException('User is already a participant in this room');
        }
        if (error.message.includes('foreign key')) {
          throw new BadRequestException('Invalid room or user ID');
        }
      }
      this.logger.error(`Failed to add participant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    try {
      const participant = await this.roomParticipantRepository.findOne({
        where: {
          roomId,
          userId,
          isActive: true,
        },
      });

      if (!participant) {
        throw new NotFoundException('Active participant not found in this room');
      }

      participant.isActive = false;
      participant.leftAt = new Date();
      
      await this.roomParticipantRepository.save(participant);
      
      this.logger.log(`Participant removed: User ${userId} from Room ${roomId}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to remove participant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
    try {
      return await this.roomParticipantRepository.find({
        where: { roomId },
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
    } catch (error) {
      this.logger.error(`Failed to find room participants for room ${roomId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findActiveRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
    try {
      return await this.roomParticipantRepository.find({
        where: {
          roomId,
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
    } catch (error) {
      this.logger.error(`Failed to find active room participants for room ${roomId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findUserParticipations(userId: string): Promise<RoomParticipant[]> {
    try {
      return await this.roomParticipantRepository.find({
        where: { userId },
        relations: ['room'],
        order: { joinedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to find user participations for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findActiveUserParticipations(userId: string): Promise<RoomParticipant[]> {
    try {
      return await this.roomParticipantRepository.find({
        where: {
          userId,
          isActive: true,
        },
        relations: ['room'],
        order: { joinedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to find active user participations for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const participant = await this.roomParticipantRepository.findOne({
        where: {
          roomId,
          userId,
          isActive: true,
        },
      });

      return !!participant;
    } catch (error) {
      this.logger.error(`Failed to check if user ${userId} is in room ${roomId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getParticipantCount(roomId: string): Promise<number> {
    try {
      return await this.roomParticipantRepository.count({
        where: {
          roomId,
          isActive: true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to get participant count for room ${roomId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findParticipant(roomId: string, userId: string): Promise<RoomParticipant> {
    try {
      const participant = await this.roomParticipantRepository.findOne({
        where: { roomId, userId },
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

      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      return participant;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find participant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async rejoinRoom(roomId: string, userId: string): Promise<RoomParticipant> {
    try {
      const participant = await this.roomParticipantRepository.findOne({
        where: { roomId, userId },
      });

      if (!participant) {
        // Create new participation if none exists
        return await this.addParticipant({ roomId, userId });
      }

      if (participant.isActive) {
        throw new ConflictException('User is already an active participant');
      }

      // Reactivate existing participation
      participant.isActive = true;
      participant.leftAt = null;
      participant.joinedAt = new Date();

      const updatedParticipant = await this.roomParticipantRepository.save(participant);
      
      this.logger.log(`Participant rejoined: User ${userId} to Room ${roomId}`);
      return updatedParticipant;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to rejoin room: ${error.message}`, error.stack);
      throw error;
    }
  }
}