import { z } from 'zod';

// Import the validation schemas from the actual API routes
// We'll test the validation logic by recreating the schemas as they are defined

describe('Validation Schemas', () => {
  describe('registerSchema (from /api/auth/register)', () => {
    const registerSchema = z.object({
      name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
      email: z.string().email('Inserisci un indirizzo email valido'),
      password: z.string().min(8, 'La password deve contenere almeno 8 caratteri'),
    });

    it('should validate correct registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject name too short', () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        password: 'password123'
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Il nome deve contenere almeno 2 caratteri');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Inserisci un indirizzo email valido');
      }
    });

    it('should reject password too short', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La password deve contenere almeno 8 caratteri');
      }
    });

    it('should reject missing fields', () => {
      const invalidData = {
        name: 'John Doe'
        // missing email and password
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2); // email and password missing
      }
    });

    it('should reject empty strings', () => {
      const invalidData = {
        name: '',
        email: '',
        password: ''
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3); // all fields invalid
      }
    });
  });

  describe('setupPasswordSchema (from /api/auth/setup-password)', () => {
    const setupPasswordSchema = z.object({
      token: z.string().min(1, 'Token richiesto'),
      password: z.string().min(8, 'La password deve contenere almeno 8 caratteri')
        .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
        .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
        .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
    });

    it('should validate correct setup password data', () => {
      const validData = {
        token: 'valid-token-123',
        password: 'Password123'
      };

      const result = setupPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject empty token', () => {
      const invalidData = {
        token: '',
        password: 'Password123'
      };

      const result = setupPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Token richiesto');
      }
    });

    it('should reject password without uppercase letter', () => {
      const invalidData = {
        token: 'valid-token',
        password: 'password123'
      };

      const result = setupPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La password deve contenere almeno una lettera maiuscola');
      }
    });

    it('should reject password without lowercase letter', () => {
      const invalidData = {
        token: 'valid-token',
        password: 'PASSWORD123'
      };

      const result = setupPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La password deve contenere almeno una lettera minuscola');
      }
    });

    it('should reject password without number', () => {
      const invalidData = {
        token: 'valid-token',
        password: 'Password'
      };

      const result = setupPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La password deve contenere almeno un numero');
      }
    });

    it('should reject password too short', () => {
      const invalidData = {
        token: 'valid-token',
        password: 'Pass1'
      };

      const result = setupPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La password deve contenere almeno 8 caratteri');
      }
    });

    it('should handle multiple validation errors', () => {
      const invalidData = {
        token: 'valid-token',
        password: 'abc' // too short, no uppercase, no number
      };

      const result = setupPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3);
      }
    });
  });

  describe('createUserSchema (from /api/admin/users)', () => {
    // Mock UserRole enum
    const UserRole = {
      Explorer: 'Explorer',
      Ranger: 'Ranger',
      Sentinel: 'Sentinel'
    } as const;

    const createUserSchema = z.object({
      name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
      email: z.string().email('Inserisci un indirizzo email valido'),
      role: z.nativeEnum(UserRole).optional().default(UserRole.Explorer),
      sendWelcomeEmail: z.boolean().optional().default(true),
    });

    it('should validate correct user creation data', () => {
      const validData = {
        name: 'Admin User',
        email: 'admin@example.com',
        role: UserRole.Ranger,
        sendWelcomeEmail: true
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should apply default values when optional fields missing', () => {
      const validData = {
        name: 'User Test',
        email: 'user@example.com'
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe(UserRole.Explorer);
        expect(result.data.sendWelcomeEmail).toBe(true);
      }
    });

    it('should reject invalid role', () => {
      const invalidData = {
        name: 'User Test',
        email: 'user@example.com',
        role: 'InvalidRole'
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate Sentinel role', () => {
      const validData = {
        name: 'Sentinel User',
        email: 'sentinel@example.com',
        role: UserRole.Sentinel
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe(UserRole.Sentinel);
      }
    });

    it('should handle boolean sendWelcomeEmail', () => {
      const validData = {
        name: 'User Test',
        email: 'user@example.com',
        sendWelcomeEmail: false
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sendWelcomeEmail).toBe(false);
      }
    });
  });

  describe('Auth Credentials Schema (from auth.ts)', () => {
    const credentialsSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    it('should validate correct credentials', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123'
      };

      const result = credentialsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const result = credentialsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject password too short', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '123'
      };

      const result = credentialsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateUserSchema (from /api/admin/users/[id])', () => {
    const UserRole = {
      Explorer: 'Explorer',
      Ranger: 'Ranger',
      Sentinel: 'Sentinel'
    } as const;

    const updateUserSchema = z.object({
      role: z.nativeEnum(UserRole),
    });

    it('should validate role update', () => {
      const validData = {
        role: UserRole.Ranger
      };

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe(UserRole.Ranger);
      }
    });

    it('should reject invalid role', () => {
      const invalidData = {
        role: 'InvalidRole'
      };

      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require role field', () => {
      const invalidData = {};

      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Trip Creation Schema (from /api/trips)', () => {
    const RecommendedSeason = {
      Spring: 'Spring',
      Summer: 'Summer',
      Autumn: 'Autumn',
      Winter: 'Winter'
    } as const;

    // Simplified version of the trip creation schema for testing
    const tripCreationSchema = z.object({
      title: z.string().min(3, 'Il titolo deve contenere almeno 3 caratteri.').max(100),
      summary: z.string().min(10, 'Il sommario deve contenere almeno 10 caratteri.').max(500),
      destination: z.string().min(3, 'La destinazione deve contenere almeno 3 caratteri.').max(100),
      recommendedSeason: z.nativeEnum(RecommendedSeason).optional(),
      tags: z.array(z.string()).optional(),
    });

    it('should validate correct trip data', () => {
      const validData = {
        title: 'Amazing Mountain Trip',
        summary: 'This is a fantastic journey through mountain trails with beautiful views.',
        destination: 'Dolomites',
        recommendedSeason: RecommendedSeason.Summer,
        tags: ['adventure', 'mountains']
      };

      const result = tripCreationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject title too short', () => {
      const invalidData = {
        title: 'Hi',
        summary: 'This is a valid summary that meets the minimum requirements.',
        destination: 'Valid Destination'
      };

      const result = tripCreationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject summary too short', () => {
      const invalidData = {
        title: 'Valid Title',
        summary: 'Short',
        destination: 'Valid Destination'
      };

      const result = tripCreationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should handle optional fields', () => {
      const validData = {
        title: 'Valid Title',
        summary: 'This is a valid summary that meets the minimum requirements.',
        destination: 'Valid Destination'
        // No optional fields
      };

      const result = tripCreationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Formatting', () => {
    const testSchema = z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(8, 'Password too short'),
      name: z.string().min(2, 'Name too short')
    });

    it('should format validation errors correctly', () => {
      const invalidData = {
        email: 'invalid',
        password: '123',
        name: 'x'
      };

      const result = testSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const flatErrors = result.error.flatten();
        expect(flatErrors.fieldErrors.email).toContain('Invalid email');
        expect(flatErrors.fieldErrors.password).toContain('Password too short');
        expect(flatErrors.fieldErrors.name).toContain('Name too short');
      }
    });

    it('should handle partial validation errors', () => {
      const partiallyValidData = {
        email: 'valid@example.com',
        password: '123', // invalid
        name: 'Valid Name'
      };

      const result = testSchema.safeParse(partiallyValidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const flatErrors = result.error.flatten();
        expect(flatErrors.fieldErrors.email).toBeUndefined();
        expect(flatErrors.fieldErrors.password).toContain('Password too short');
        expect(flatErrors.fieldErrors.name).toBeUndefined();
      }
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(1000);
      const schema = z.string().max(100);

      const result = schema.safeParse(longString);
      expect(result.success).toBe(false);
    });

    it('should handle null and undefined values', () => {
      const schema = z.string().min(1);

      expect(schema.safeParse(null).success).toBe(false);
      expect(schema.safeParse(undefined).success).toBe(false);
    });

    it('should handle SQL injection attempts in email', () => {
      const maliciousEmail = "test'; DROP TABLE users; --@example.com";
      const emailSchema = z.string().email();

      const result = emailSchema.safeParse(maliciousEmail);
      expect(result.success).toBe(false);
    });

    it('should handle XSS attempts in string fields', () => {
      const xssAttempt = '<script>alert("xss")</script>';
      const stringSchema = z.string().min(2);

      // Zod doesn't sanitize, but validates format
      const result = stringSchema.safeParse(xssAttempt);
      expect(result.success).toBe(true); // Zod allows it, sanitization happens elsewhere
    });

    it('should handle boolean coercion attempts', () => {
      const booleanSchema = z.boolean();

      expect(booleanSchema.safeParse('true').success).toBe(false);
      expect(booleanSchema.safeParse('false').success).toBe(false);
      expect(booleanSchema.safeParse(1).success).toBe(false);
      expect(booleanSchema.safeParse(0).success).toBe(false);
      expect(booleanSchema.safeParse(true).success).toBe(true);
      expect(booleanSchema.safeParse(false).success).toBe(true);
    });
  });
});
