import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResponse = {
    user: {
      id: 'user-id-123',
      username: 'testuser',
      email: 'test@example.com',
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  const mockRequest = {
    user: {
      id: 'user-id-123',
      username: 'testuser',
      email: 'test@example.com',
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should register a user successfully', async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual({
        success: true,
        message: 'User registered successfully',
        data: mockAuthResponse,
      });
    });

    it('should handle registration conflicts', async () => {
      authService.register.mockRejectedValue(new ConflictException('Email already registered'));

      await expect(controller.register(registerDto)).rejects.toThrow(ConflictException);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      usernameOrEmail: 'testuser',
      password: 'Password123!',
    };

    it('should login successfully', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({
        success: true,
        message: 'Login successful',
        data: mockAuthResponse,
      });
    });

    it('should handle invalid credentials', async () => {
      authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh token successfully', async () => {
      const tokenResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      authService.refreshToken.mockResolvedValue(tokenResponse);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(result).toEqual({
        success: true,
        message: 'Token refreshed successfully',
        data: tokenResponse,
      });
    });

    it('should handle invalid refresh token', async () => {
      authService.refreshToken.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(controller.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully with refresh token', async () => {
      const body = { refreshToken: 'refresh-token' };
      authService.logout.mockResolvedValue();

      const result = await controller.logout(mockRequest, body);

      expect(authService.logout).toHaveBeenCalledWith(mockRequest.user.id, body.refreshToken);
      expect(result).toEqual({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should logout successfully without refresh token', async () => {
      authService.logout.mockResolvedValue();

      const result = await controller.logout(mockRequest);

      expect(authService.logout).toHaveBeenCalledWith(mockRequest.user.id, undefined);
      expect(result).toEqual({
        success: true,
        message: 'Logout successful',
      });
    });
  });

  describe('getProfile', () => {
    it('should get profile successfully', async () => {
      const profileData = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
      };
      authService.getProfile.mockResolvedValue(profileData);

      const result = await controller.getProfile(mockRequest);

      expect(authService.getProfile).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual({
        success: true,
        message: 'Profile retrieved successfully',
        data: profileData,
      });
    });
  });

  describe('updateProfile', () => {
    const updateProfileDto: UpdateProfileDto = {
      username: 'newusername',
      email: 'newemail@example.com',
    };

    it('should update profile successfully', async () => {
      const updatedProfile = {
        id: 'user-id-123',
        username: 'newusername',
        email: 'newemail@example.com',
      };
      authService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockRequest, updateProfileDto);

      expect(authService.updateProfile).toHaveBeenCalledWith(mockRequest.user.id, updateProfileDto);
      expect(result).toEqual({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
      });
    });

    it('should handle profile update conflicts', async () => {
      authService.updateProfile.mockRejectedValue(new ConflictException('Username already taken'));

      await expect(controller.updateProfile(mockRequest, updateProfileDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
    };

    it('should change password successfully', async () => {
      authService.changePassword.mockResolvedValue();

      const result = await controller.changePassword(mockRequest, changePasswordDto);

      expect(authService.changePassword).toHaveBeenCalledWith(mockRequest.user.id, changePasswordDto);
      expect(result).toEqual({
        success: true,
        message: 'Password changed successfully',
      });
    });

    it('should handle incorrect current password', async () => {
      authService.changePassword.mockRejectedValue(new UnauthorizedException('Current password is incorrect'));

      await expect(controller.changePassword(mockRequest, changePasswordDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', async () => {
      const result = await controller.verifyToken(mockRequest);

      expect(result).toEqual({
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            id: mockRequest.user.id,
            username: mockRequest.user.username,
            email: mockRequest.user.email,
          },
        },
      });
    });
  });
});