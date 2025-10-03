import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  UseGuards, 
  Request, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
  Logger
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    this.logger.log(`Registration attempt for username: ${registerDto.username}`);
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      message: 'User registered successfully',
      data: result,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    this.logger.log(`Login attempt for: ${loginDto.usernameOrEmail}`);
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto) {
    this.logger.log('Token refresh attempt');
    const result = await this.authService.refreshToken(refreshTokenDto.refreshToken);
    return {
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req, @Body() body?: { refreshToken?: string }) {
    this.logger.log(`Logout attempt for user: ${req.user.id}`);
    await this.authService.logout(req.user.id, body?.refreshToken);
    return {
      success: true,
      message: 'Logout successful',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    this.logger.log(`Profile request for user: ${req.user.id}`);
    const result = await this.authService.getProfile(req.user.id);
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body(ValidationPipe) updateProfileDto: UpdateProfileDto) {
    this.logger.log(`Profile update attempt for user: ${req.user.id}`);
    const result = await this.authService.updateProfile(req.user.id, updateProfileDto);
    return {
      success: true,
      message: 'Profile updated successfully',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, @Body(ValidationPipe) changePasswordDto: ChangePasswordDto) {
    this.logger.log(`Password change attempt for user: ${req.user.id}`);
    await this.authService.changePassword(req.user.id, changePasswordDto);
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify')
  async verifyToken(@Request() req) {
    return {
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
        },
      },
    };
  }
}