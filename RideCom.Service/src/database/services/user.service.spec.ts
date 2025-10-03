import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UserService, CreateUserDto, UpdateUserDto } from './user.service';
import { User } from '../entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdRooms: [],
    roomParticipations: [],
    connectionLogs: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
    };

    it('should create a user successfully', async () => {
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException for duplicate username', async () => {
      const error = new QueryFailedError('query', [], new Error('duplicate key value violates unique constraint "users_username_key"'));
      repository.create.mockReturnValue(mockUser);
      repository.save.mockRejectedValue(error);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createUserDto)).rejects.toThrow('Username already exists');
    });

    it('should throw ConflictException for duplicate email', async () => {
      const error = new QueryFailedError('query', [], new Error('duplicate key value violates unique constraint "users_email_key"'));
      repository.create.mockReturnValue(mockUser);
      repository.save.mockRejectedValue(error);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createUserDto)).rejects.toThrow('Email already exists');
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const users = [mockUser];
      repository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        select: ['id', 'username', 'email', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(users);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      repository.find.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(error);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: ['id', 'username', 'email', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findById('nonexistent')).rejects.toThrow('User with ID nonexistent not found');
    });
  });

  describe('findByUsername', () => {
    it('should return user when found', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername(mockUser.username);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: mockUser.username },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      username: 'updateduser',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateUserDto);

      expect(repository.save).toHaveBeenCalledWith({ ...mockUser, ...updateUserDto });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate username', async () => {
      const error = new QueryFailedError('query', [], new Error('duplicate key value violates unique constraint "users_username_key"'));
      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockRejectedValue(error);

      await expect(service.update(mockUser.id, updateUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      repository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.delete(mockUser.id);

      expect(repository.delete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.delete('nonexistent')).rejects.toThrow('User with ID nonexistent not found');
    });
  });

  describe('getUserWithRooms', () => {
    it('should return user with rooms', async () => {
      const userWithRooms = {
        ...mockUser,
        createdRooms: [],
        roomParticipations: [],
      };
      repository.findOne.mockResolvedValue(userWithRooms);

      const result = await service.getUserWithRooms(mockUser.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        relations: ['createdRooms', 'roomParticipations', 'roomParticipations.room'],
        select: ['id', 'username', 'email', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(userWithRooms);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.getUserWithRooms('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});