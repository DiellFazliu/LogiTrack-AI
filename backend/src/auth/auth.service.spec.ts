import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from '../modules/users/user.entity';
import { Organization } from '../modules/organizations/organization.entity';
import { Role } from '../modules/roles/role.entity';
import { Driver } from '../modules/drivers/driver.entity';
import { Vehicle } from '../modules/vehicles/vehicle.entity';
import { Shipment } from '../modules/shipments/shipment.entity';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';

process.env.SUPER_ADMIN_SECRET_KEY = 'test-super-secret-key-for-testing';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockOrganizationRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDriverRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock-token'),
    verify: jest.fn(() => ({ id: '1', email: 'test@test.com', role: 'customer' })),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_EXPIRES_IN') return '7d';
      if (key === 'SUPER_ADMIN_SECRET_KEY') return 'test-super-secret-key-for-testing';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: mockDriverRepository,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Shipment),
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Test User',
        organizationId: 'org-1',
        isActive: true,
        roles: [{ name: 'customer' }],
      };
      
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      const result = await service.validateUser('test@test.com', 'password123');
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('email', 'test@test.com');
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      
      const result = await service.validateUser('nonexistent@test.com', 'password');
      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'new@test.com',
        password: 'password123',
        name: 'New User',
      };
      
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue({ id: 'role-1', name: 'customer' });
      mockRoleRepository.create.mockReturnValue({ name: 'customer' });
      mockUserRepository.create.mockReturnValue({ ...registerDto, id: 'new-id' });
      mockUserRepository.save.mockResolvedValue({ id: 'new-id', ...registerDto });
      mockJwtService.sign.mockReturnValue('jwt-token');
      
      const result = await service.register(registerDto);
      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('email', 'new@test.com');
    });

    it('should throw ConflictException when user exists', async () => {
      const registerDto = {
        email: 'existing@test.com',
        password: 'password123',
        name: 'Existing User',
      };
      
      mockUserRepository.findOne.mockResolvedValue({ id: '1', email: 'existing@test.com' });
      
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return token and user data', async () => {
      const validatedUser = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'customer',
        organizationId: 'org-1',
      };
      
      const result = await service.login(validatedUser);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('email', 'test@test.com');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 'user-1';
      const changePasswordDto = {
        currentPassword: 'oldPass123',
        newPassword: 'newPass123',
      };
      
      const mockUser = {
        id: userId,
        password: await bcrypt.hash('oldPass123', 10),
      };
      
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      
      await expect(service.changePassword(userId, changePasswordDto)).resolves.not.toThrow();
    });

    it('should throw error when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      
      await expect(service.changePassword('invalid-id', { currentPassword: 'pass', newPassword: 'new' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});