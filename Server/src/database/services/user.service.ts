import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { User } from '../entities/user.entity';

export interface CreateUserDto {
  username: string;
  email: string;
  passwordHash: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  passwordHash?: string;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = this.userRepository.create(createUserDto);
      const savedUser = await this.userRepository.save(user);
      this.logger.log(`User created with ID: ${savedUser.id}`);
      return savedUser;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        if (error.message.includes('duplicate key')) {
          if (error.message.includes('username')) {
            throw new ConflictException('Username already exists');
          }
          if (error.message.includes('email')) {
            throw new ConflictException('Email already exists');
          }
        }
      }
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.userRepository.find({
        select: ['id', 'username', 'email', 'createdAt', 'updatedAt'],
      });
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'username', 'email', 'createdAt', 'updatedAt'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find user by ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { username },
      });
    } catch (error) {
      this.logger.error(`Failed to find user by username ${username}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { email },
      });
    } catch (error) {
      this.logger.error(`Failed to find user by email ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.findById(id);
      
      Object.assign(user, updateUserDto);
      const updatedUser = await this.userRepository.save(user);
      
      this.logger.log(`User updated with ID: ${updatedUser.id}`);
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        if (error.message.includes('duplicate key')) {
          if (error.message.includes('username')) {
            throw new ConflictException('Username already exists');
          }
          if (error.message.includes('email')) {
            throw new ConflictException('Email already exists');
          }
        }
      }
      this.logger.error(`Failed to update user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.userRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      this.logger.log(`User deleted with ID: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserWithRooms(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['createdRooms', 'roomParticipations', 'roomParticipations.room'],
        select: ['id', 'username', 'email', 'createdAt', 'updatedAt'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get user with rooms ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}