import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleStatus: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  // Mock request object
  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'admin@logitrack.com',
      name: 'Admin User',
      role: 'super_admin',
      organizationId: 'org-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
            getAllAndMerge: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const expectedUsers = [
        { id: '1', email: 'test@example.com', name: 'Test User' },
      ];
      mockUsersService.findAll.mockResolvedValue(expectedUsers);

      const result = await controller.findAll(mockRequest);
      expect(result).toEqual(expectedUsers);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(undefined); // super_admin
    });
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      const expectedUser = { id: 'user-123', email: 'admin@logitrack.com', name: 'Admin User' };
      mockUsersService.findById.mockResolvedValue(expectedUser);

      const result = await controller.getMe(mockRequest);
      expect(result).toEqual(expectedUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updateMe', () => {
    it('should update current user profile', async () => {
      const updateData = { name: 'Updated Name', phone: '123456789' };
      const expectedUser = { id: 'user-123', name: 'Updated Name', phone: '123456789' };
      mockUsersService.update.mockResolvedValue(expectedUser);

      const result = await controller.updateMe(mockRequest, updateData);
      expect(result).toEqual(expectedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        'user-123',
        { name: 'Updated Name', phone: '123456789' },
        'org-123',
        'super_admin',
        'user-123',
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile via PUT /profile', async () => {
      const updateData = { name: 'New Name' };
      const expectedUser = { id: 'user-123', name: 'New Name' };
      mockUsersService.update.mockResolvedValue(expectedUser);

      const result = await controller.updateProfile(mockRequest, updateData);
      expect(result).toEqual(expectedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        'user-123',
        { name: 'New Name' },
        'org-123',
        'super_admin',
        'user-123',
      );
    });
  });

  describe('findOne', () => {
    it('should return a single user by ID', async () => {
      const expectedUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockUsersService.findById.mockResolvedValue(expectedUser);

      const result = await controller.findOne('1');
      expect(result).toEqual(expectedUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a user by ID', async () => {
      const updateData = { name: 'Updated Name' };
      const expectedUser = { id: '1', name: 'Updated Name' };
      mockUsersService.update.mockResolvedValue(expectedUser);

      const result = await controller.update('1', updateData, mockRequest);
      expect(result).toEqual(expectedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        '1',
        updateData,
        undefined, // super_admin → undefined
        'super_admin',
        'user-123',
      );
    });
  });

  describe('remove', () => {
    it('should delete a user by ID', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('1', mockRequest);
      expect(mockUsersService.remove).toHaveBeenCalledWith('1', undefined, 'super_admin');
    });
  });

  describe('toggleStatus', () => {
    it('should toggle user active status', async () => {
      const expectedUser = { id: '1', isActive: false };
      mockUsersService.toggleStatus.mockResolvedValue(expectedUser);

      const result = await controller.toggleStatus('1', false, mockRequest);
      expect(result).toEqual(expectedUser);
      expect(mockUsersService.toggleStatus).toHaveBeenCalledWith('1', false, undefined, 'super_admin');
    });
  });
});