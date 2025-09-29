import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UserService } from '../database/services/user.service';
import { RedisSessionService } from '../redis/services/redis-session.service';
import { User } from '../database/entities/user.entity';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let redisSessionService: jest.Mocked<RedisSessionService>;

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
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockRedisSessionService = {
      storeRefreshToken: jest.fn(),
      getRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllRefreshTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisSessionService, useValue: mockRedisSessionService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    redisSessionService = module.get(RedisSessionService);

    // Setup default config values
    configService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'JWT_SECRET':
          return 'test-secret';
        case 'JWT_EXPIRES_IN':
          return '15m';
        case 'JWT_REFRESH_SECRET':
          return 'test-refresh-secret';
        case 'JWT_REFRESH_EXPIRES_IN':
          return '7d';
        default:
          return undefined;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should register a new user successfully', async () => {
      userService.findByEmail.mockResolvedValue(null);
      userService.findByUsername.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed-password');
      userService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      redisSessionService.storeRefreshToken.mockResolvedValue();

      const result = await service.register(registerDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userService.findByUsername).toHaveBeenCalledWith(registerDto.username);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(userService.create).toHaveBeenCalledWith({
        username: registerDto.username,
        email: registerDto.email,
        passwordHash: 'hashed-password',
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
    });

    it('should throw ConflictException if username already exists', async () => {
      userService.findByEmail.mockResolvedValue(null);
      userService.findByUsername.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(userService.findByUsername).toHaveBeenCalledWith(registerDto.username);
    });
  });

  describe('login', () => {
    const loginDto = {
      usernameOrEmail: 'testuser',
      password: 'Password123!',
    };

    it('should login with username successfully', async () => {
      userService.findByUsername.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      redisSessionService.storeRefreshToken.mockResolvedValue();

      const result = await service.login(loginDto);

      expect(userService.findByUsername).toHaveBeenCalledWith(loginDto.usernameOrEmail);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.passwordHash);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should login with email successfully', async () => {
      const emailLoginDto = { ...loginDto, usernameOrEmail: 'test@example.com' };
      userService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      redisSessionService.storeRefreshToken.mockResolvedValue();

      const result = await service.login(emailLoginDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(emailLoginDto.usernameOrEmail);
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userService.findByUsername.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userService.findByUsername.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid-refresh-token';
    const tokenPayload = {
      sub: 'user-id-123',
      username: 'testuser',
      tokenId: 'token-id-123',
    };

    it('should refresh token successfully', async () => {
      jwtService.verify.mockReturnValue(tokenPayload);
      redisSessionService.getRefreshToken.mockResolvedValue(refreshToken);
      userService.findById.mockResolvedValue(mockUser);
      redisSessionService.revokeRefreshToken.mockResolvedValue();
      jwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');
      redisSessionService.storeRefreshToken.mockResolvedValue();

      const result = await service.refreshToken(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'test-refresh-secret',
      });
      expect(redisSessionService.getRefreshToken).toHaveBeenCalledWith(tokenPayload.sub, tokenPayload.tokenId);
      expect(redisSessionService.revokeRefreshToken).toHaveBeenCalledWith(tokenPayload.sub, tokenPayload.tokenId);
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token not found in Redis', async () => {
      jwtService.verify.mockReturnValue(tokenPayload);
      redisSessionService.getRefreshToken.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      userService.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      expect(userService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userService.findById.mockRejectedValue(new NotFoundException('User not found'));

      await expect(service.getProfile('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    const updateDto = {
      username: 'newusername',
      email: 'newemail@example.com',
    };

    it('should update profile successfully', async () => {
      userService.findByUsername.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(null);
      const updatedUser = { ...mockUser, ...updateDto };
      userService.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, updateDto);

      expect(userService.findByUsername).toHaveBeenCalledWith(updateDto.username);
      expect(userService.findByEmail).toHaveBeenCalledWith(updateDto.email);
      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
      expect(result).toEqual({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      });
    });

    it('should throw ConflictException if username already taken by another user', async () => {
      const anotherUser = { ...mockUser, id: 'another-user-id' };
      userService.findByUsername.mockResolvedValue(anotherUser);

      await expect(service.updateProfile(mockUser.id, updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
    };

    it('should change password successfully', async () => {
      userService.findById.mockResolvedValue(mockUser);
      userService.findByUsername.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true);
      mockedBcrypt.hash.mockResolvedValue('new-hashed-password');
      userService.update.mockResolvedValue(mockUser);
      redisSessionService.revokeAllRefreshTokens.mockResolvedValue();

      await service.changePassword(mockUser.id, changePasswordDto);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(changePasswordDto.currentPassword, mockUser.passwordHash);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(changePasswordDto.newPassword, 12);
      expect(userService.update).toHaveBeenCalledWith(mockUser.id, { passwordHash: 'new-hashed-password' });
      expect(redisSessionService.revokeAllRefreshTokens).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      userService.findById.mockResolvedValue(mockUser);
      userService.findByUsername.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false);

      await expect(service.changePassword(mockUser.id, changePasswordDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully with refresh token', async () => {
      const refreshToken = 'refresh-token';
      const tokenPayload = { sub: mockUser.id, username: mockUser.username, tokenId: 'token-id' };
      jwtService.verify.mockReturnValue(tokenPayload);
      redisSessionService.revokeRefreshToken.mockResolvedValue();

      await service.logout(mockUser.id, refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'test-refresh-secret',
      });
      expect(redisSessionService.revokeRefreshToken).toHaveBeenCalledWith(mockUser.id, tokenPayload.tokenId);
    });

    it('should logout successfully without refresh token (revoke all)', async () => {
      redisSessionService.revokeAllRefreshTokens.mockResolvedValue();

      await service.logout(mockUser.id);

      expect(redisSessionService.revokeAllRefreshTokens).toHaveBeenCalledWith(mockUser.id);
    });
  });
});