import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { UserService } from '../../database/services/user.service';
import { User } from '../../database/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: jest.Mocked<UserService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: User = {
    id: 'user-id-123',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdRooms: [],
    roomParticipations: [],
    connectionLogs: [],
  };

  beforeEach(async () => {
    const mockUserService = {
      findById: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UserService, useValue: mockUserService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get(UserService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    const payload: JwtPayload = {
      sub: 'user-id-123',
      username: 'testuser',
      email: 'test@example.com',
      iat: 1234567890,
      exp: 1234567890,
    };

    it('should validate and return user when user exists', async () => {
      userService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(userService.findById).toHaveBeenCalledWith(payload.sub);
      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(userService.findById).toHaveBeenCalledWith(payload.sub);
    });

    it('should throw UnauthorizedException when userService throws error', async () => {
      userService.findById.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});