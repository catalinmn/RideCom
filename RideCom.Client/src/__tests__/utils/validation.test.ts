import { loginSchema, registerSchema, profileUpdateSchema } from '../../utils/validation';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(loginSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      await expect(loginSchema.validate(invalidData)).rejects.toThrow(
        'Please enter a valid email address'
      );
    });

    it('should reject short password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
      };

      await expect(loginSchema.validate(invalidData)).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    it('should reject missing email', async () => {
      const invalidData = {
        password: 'password123',
      };

      await expect(loginSchema.validate(invalidData)).rejects.toThrow(
        'Email is required'
      );
    });

    it('should reject missing password', async () => {
      const invalidData = {
        email: 'test@example.com',
      };

      await expect(loginSchema.validate(invalidData)).rejects.toThrow(
        'Password is required'
      );
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', async () => {
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      await expect(registerSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject short username', async () => {
      const invalidData = {
        username: 'ab',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      await expect(registerSchema.validate(invalidData)).rejects.toThrow(
        'Username must be at least 3 characters'
      );
    });

    it('should reject long username', async () => {
      const invalidData = {
        username: 'a'.repeat(21),
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      await expect(registerSchema.validate(invalidData)).rejects.toThrow(
        'Username must be less than 20 characters'
      );
    });

    it('should reject username with invalid characters', async () => {
      const invalidData = {
        username: 'test-user!',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      await expect(registerSchema.validate(invalidData)).rejects.toThrow(
        'Username can only contain letters, numbers, and underscores'
      );
    });

    it('should reject weak password', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
      };

      await expect(registerSchema.validate(invalidData)).rejects.toThrow(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
    });

    it('should reject mismatched passwords', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password456',
      };

      await expect(registerSchema.validate(invalidData)).rejects.toThrow(
        'Passwords must match'
      );
    });

    it('should reject missing confirmPassword', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      };

      await expect(registerSchema.validate(invalidData)).rejects.toThrow(
        'Please confirm your password'
      );
    });
  });

  describe('profileUpdateSchema', () => {
    it('should validate correct profile data', async () => {
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
      };

      await expect(profileUpdateSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject invalid profile data', async () => {
      const invalidData = {
        username: 'ab',
        email: 'invalid-email',
      };

      await expect(profileUpdateSchema.validate(invalidData)).rejects.toThrow();
    });
  });
});