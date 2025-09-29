import { 
  Injectable, 
  Logger, 
  UnauthorizedException, 
  ConflictException,
  BadRequestException,
  NotFoundException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../database/services/user.service';
import { RedisSessionService } from '../redis/services/redis-session.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../database/entities/user.entity';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  sub: string;
  username: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisSessionService: RedisSessionService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUserByEmail = await this.userService.findByEmail(registerDto.email);
      if (existingUserByEmail) {
        throw new ConflictException('Email already registered');
      }

      const existingUserByUsername = await this.userService.findByUsername(registerDto.username);
      if (existingUserByUsername) {
        throw new ConflictException('Username already taken');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(registerDto.password, this.saltRounds);

      // Create user
      const user = await this.userService.create({
        username: registerDto.username,
        email: registerDto.email,
        passwordHash,
      });

      // Generate tokens
      const tokens = await this.generateTokens(user);

      this.logger.log(`User registered successfully: ${user.id}`);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        ...tokens,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw new BadRequestException('Registration failed');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      // Find user by username or email
      let user: User | null = null;
      
      if (loginDto.usernameOrEmail.includes('@')) {
        user = await this.userService.findByEmail(loginDto.usernameOrEmail);
      } else {
        user = await this.userService.findByUsername(loginDto.usernameOrEmail);
      }

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      this.logger.log(`User logged in successfully: ${user.id}`);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Login failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'fallback-refresh-secret',
      }) as RefreshTokenPayload;

      // Check if refresh token exists in Redis
      const storedToken = await this.redisSessionService.getRefreshToken(payload.sub, payload.tokenId);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Revoke old refresh token
      await this.redisSessionService.revokeRefreshToken(payload.sub, payload.tokenId);

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      this.logger.log(`Tokens refreshed for user: ${user.id}`);

      return tokens;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    try {
      if (refreshToken) {
        // Verify and revoke specific refresh token
        const payload = this.jwtService.verify(refreshToken, {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'fallback-refresh-secret',
        }) as RefreshTokenPayload;

        await this.redisSessionService.revokeRefreshToken(userId, payload.tokenId);
      } else {
        // Revoke all refresh tokens for user
        await this.redisSessionService.revokeAllRefreshTokens(userId);
      }

      this.logger.log(`User logged out: ${userId}`);
    } catch (error) {
      this.logger.error(`Logout failed for user ${userId}: ${error.message}`, error.stack);
      // Don't throw error for logout - best effort
    }
  }

  async getProfile(userId: string): Promise<{ id: string; username: string; email: string; createdAt: Date }> {
    try {
      const user = await this.userService.findById(userId);
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get profile for user ${userId}: ${error.message}`, error.stack);
      throw new NotFoundException('User profile not found');
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<{ id: string; username: string; email: string }> {
    try {
      // Check for conflicts if updating username or email
      if (updateProfileDto.username) {
        const existingUser = await this.userService.findByUsername(updateProfileDto.username);
        if (existingUser && existingUser.id !== userId) {
          throw new ConflictException('Username already taken');
        }
      }

      if (updateProfileDto.email) {
        const existingUser = await this.userService.findByEmail(updateProfileDto.email);
        if (existingUser && existingUser.id !== userId) {
          throw new ConflictException('Email already registered');
        }
      }

      const updatedUser = await this.userService.update(userId, updateProfileDto);

      this.logger.log(`Profile updated for user: ${userId}`);

      return {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update profile for user ${userId}: ${error.message}`, error.stack);
      throw new BadRequestException('Profile update failed');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    try {
      // Get user with password hash
      const user = await this.userService.findByUsername((await this.userService.findById(userId)).username);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, this.saltRounds);

      // Update password
      await this.userService.update(userId, { passwordHash: newPasswordHash });

      // Revoke all refresh tokens to force re-login
      await this.redisSessionService.revokeAllRefreshTokens(userId);

      this.logger.log(`Password changed for user: ${userId}`);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to change password for user ${userId}: ${error.message}`, error.stack);
      throw new BadRequestException('Password change failed');
    }
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
    });

    // Generate refresh token
    const tokenId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      username: user.username,
      tokenId,
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'fallback-refresh-secret',
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    // Store refresh token in Redis
    const refreshTokenTTL = 7 * 24 * 60 * 60; // 7 days in seconds
    await this.redisSessionService.storeRefreshToken(user.id, tokenId, refreshToken, refreshTokenTTL);

    return { accessToken, refreshToken };
  }
}