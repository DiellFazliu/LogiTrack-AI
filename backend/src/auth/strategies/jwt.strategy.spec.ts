import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUserById: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when valid', async () => {
      const payload = { id: 'user-1', email: 'test@test.com' };
      const expectedUser = { id: 'user-1', email: 'test@test.com', name: 'Test' };
      
      mockAuthService.validateUserById.mockResolvedValue(expectedUser);
      
      const result = await strategy.validate(payload);
      expect(result).toEqual(expectedUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = { id: 'invalid-id' };
      mockAuthService.validateUserById.mockResolvedValue(null);
      
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});