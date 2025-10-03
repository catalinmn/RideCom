# Authentication Module

This module provides JWT-based authentication with refresh token support for the motorcycle rider communication app.

## Features

- User registration with password validation
- JWT-based authentication with access and refresh tokens
- Password hashing with bcrypt
- User profile management
- Password change functionality
- Refresh token storage in Redis
- Protected routes with JWT guards
- Comprehensive input validation

## Environment Variables

Add these to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "testuser",
      "email": "test@example.com"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

#### POST /auth/login
Login with username/email and password.

**Request Body:**
```json
{
  "usernameOrEmail": "testuser",
  "password": "Password123!"
}
```

**Response:** Same as registration

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-jwt-access-token",
    "refreshToken": "new-jwt-refresh-token"
  }
}
```

### Protected Endpoints (Authentication Required)

Include `Authorization: Bearer <access-token>` header.

#### GET /auth/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### PUT /auth/profile
Update user profile.

**Request Body:**
```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

#### PUT /auth/change-password
Change user password.

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

#### POST /auth/logout
Logout user (revokes refresh tokens).

**Request Body (Optional):**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

#### GET /auth/verify
Verify if current access token is valid.

## Password Requirements

- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

## Username Requirements

- Minimum 3 characters
- Maximum 50 characters
- Only letters, numbers, underscores, and hyphens allowed

## Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with configurable expiration
- Refresh tokens stored in Redis with TTL
- Input validation and sanitization
- Protected routes with JWT guards
- Automatic token refresh mechanism
- Secure password change (requires current password)

## Usage in Other Modules

### Protecting Routes

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProtectedData(@Request() req) {
    // req.user contains the authenticated user
    return { userId: req.user.id };
  }
}
```

### Making Routes Public

```typescript
import { Public } from '../auth/decorators/public.decorator';

@Controller('public')
export class PublicController {
  @Public()
  @Get()
  getPublicData() {
    return { message: 'This is public' };
  }
}
```

## Testing

Run auth tests:
```bash
npm test -- src/auth
```

All auth components have comprehensive unit tests covering:
- Service methods
- Controller endpoints
- JWT strategy validation
- Guard behavior
- Error handling scenarios