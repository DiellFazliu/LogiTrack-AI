import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { Organization } from '../modules/organizations/organization.entity';
import { Role } from '../modules/roles/role.entity';
import { Driver } from '../modules/drivers/driver.entity';
import { ConfigService } from '@nestjs/config';
import { CreateUserRole } from './dto/create-user.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    validateUser: jest.fn(),
    createSuperAdmin: jest.fn(),
    createUser: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    syncExistingDrivers: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('token'),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockOrganizationRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockDriverRepository = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
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
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockAuthService.register.mockResolvedValue({ token: 'jwt-token', user: registerDto });

      const result = await controller.register(registerDto);
      
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toHaveProperty('token');
    });
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const mockRequest = { user: { id: '1', email: 'test@example.com' } };

      mockAuthService.login.mockResolvedValue({ token: 'jwt-token' });

      const result = await controller.login(mockRequest);
      
      expect(mockAuthService.login).toHaveBeenCalledWith(mockRequest.user);
      expect(result).toHaveProperty('token');
    });
  });

  describe('createSuperAdmin', () => {
    it('should create super admin', async () => {
      const createDto = {
        email: 'super@test.com',
        password: 'password123',
        name: 'Super Admin',
        secretKey: 'test-key',
      };
      const mockRequest = { user: { id: 'admin', role: 'super_admin' } };
      const expected = { user: { email: 'super@test.com' }, message: 'Super admin created' };
      
      mockAuthService.createSuperAdmin.mockResolvedValue(expected);
      
      const result = await controller.createSuperAdmin(createDto, mockRequest);
      expect(result).toEqual(expected);
      expect(mockAuthService.createSuperAdmin).toHaveBeenCalledWith(createDto.secretKey, createDto, mockRequest.user);
    });
  });

  describe('createUser', () => {
    it('should create user', async () => {
      const createDto = { 
        email: 'user@test.com', 
        password: 'pass', 
        name: 'User', 
        role: CreateUserRole.CUSTOMER  // ✅ Rregulluar: Përdor enum
      };
      const mockRequest = { user: { id: 'admin', role: 'company_admin', organizationId: 'org-1' } };
      const expected = { user: { email: 'user@test.com' }, message: 'User created' };
      
      mockAuthService.createUser.mockResolvedValue(expected);
      
      const result = await controller.createUser(createDto, mockRequest);
      expect(result).toEqual(expected);
      expect(mockAuthService.createUser).toHaveBeenCalledWith(createDto, mockRequest.user);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockRequest = { user: { id: 'user-1' } };
      const expected = { id: 'user-1', email: 'test@test.com', name: 'Test' };
      
      mockAuthService.getProfile.mockResolvedValue(expected);
      
      const result = await controller.getProfile(mockRequest);
      expect(result).toEqual(expected);
      expect(mockAuthService.getProfile).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockRequest = { user: { id: 'user-1' } };
      const updateData = { name: 'Updated Name', phone: '123456' };
      const expected = { id: 'user-1', name: 'Updated Name' };
      
      mockAuthService.updateProfile.mockResolvedValue(expected);
      
      const result = await controller.updateProfile(mockRequest, updateData);
      expect(result).toEqual(expected);
      expect(mockAuthService.updateProfile).toHaveBeenCalledWith('user-1', updateData);
    });
  });

  describe('syncDrivers', () => {
    it('should sync drivers', async () => {
      const expected = { message: 'Sync completed', created: 5, skipped: 2 };
      
      mockAuthService.syncExistingDrivers.mockResolvedValue({ created: 5, skipped: 2 });
      
      const result = await controller.syncDrivers();
      expect(result).toEqual(expected);
      expect(mockAuthService.syncExistingDrivers).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const mockRequest = { headers: { authorization: 'Bearer token123' } };
      mockAuthService.logout.mockResolvedValue(undefined);
      
      const result = await controller.logout(mockRequest);
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockAuthService.logout).toHaveBeenCalledWith('token123');
    });
  });

  describe('refresh', () => {
    it('should refresh token', async () => {
      const refreshToken = 'old-token';
      mockAuthService.refreshToken.mockResolvedValue({ token: 'new-token' });
      
      const result = await controller.refresh(refreshToken);
      expect(result).toEqual({ token: 'new-token' });
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe('changePassword', () => {
    it('should change password', async () => {
      const mockRequest = { user: { id: 'user-1' } };
      const changePasswordDto = { currentPassword: 'old', newPassword: 'new' };
      mockAuthService.changePassword.mockResolvedValue(undefined);
      
      const result = await controller.changePassword(mockRequest, changePasswordDto);
      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(mockAuthService.changePassword).toHaveBeenCalledWith('user-1', changePasswordDto);
    });
  });

  describe('forgotPassword', () => {
    it('should handle forgot password', async () => {
      const forgotPasswordDto = { email: 'test@test.com' };
      mockAuthService.forgotPassword.mockResolvedValue(undefined);
      
      const result = await controller.forgotPassword(forgotPasswordDto);
      expect(result).toEqual({ message: 'If the email exists, a reset link has been sent' });
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('test@test.com');
    });
  });
});