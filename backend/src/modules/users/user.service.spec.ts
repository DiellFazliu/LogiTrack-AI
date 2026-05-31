import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      
      await expect(service.findById('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const oldUser = { id: '1', name: 'Old Name', organizationId: 'org-1', email: 'test@test.com' };
      const updatedUser = { ...oldUser, name: 'New Name' };
      const updateData = { name: 'New Name' };
      
      // First call: find user to update
      mockUserRepository.findOne.mockResolvedValueOnce(oldUser);
      // Second call: find updated user
      mockUserRepository.findOne.mockResolvedValueOnce(updatedUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      
      const result = await service.update('1', updateData, 'org-1', 'company_admin', 'admin-1');
      expect(result).toHaveProperty('name', 'New Name');
      expect(result.name).toBe('New Name');
    });

    it('should throw ForbiddenException when no permission', async () => {
      const mockUser = { id: '1', organizationId: 'org-2' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      await expect(service.update('1', { name: 'New' }, 'org-1', 'company_admin', 'admin-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should allow super_admin to update any user', async () => {
      const oldUser = { id: '1', name: 'Old Name', organizationId: 'org-2', email: 'test@test.com' };
      const updatedUser = { ...oldUser, name: 'Super Updated' };
      const updateData = { name: 'Super Updated' };
      
      mockUserRepository.findOne.mockResolvedValueOnce(oldUser);
      mockUserRepository.findOne.mockResolvedValueOnce(updatedUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      
      const result = await service.update('1', updateData, undefined, 'super_admin', 'admin-1');
      expect(result).toHaveProperty('name', 'Super Updated');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      
      await expect(service.update('invalid', { name: 'New' }, 'org-1', 'company_admin', 'admin-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should deactivate user', async () => {
      const mockUser = { id: '1', organizationId: 'org-1', isActive: true };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      
      await expect(service.remove('1', 'org-1', 'company_admin')).resolves.not.toThrow();
      expect(mockUserRepository.update).toHaveBeenCalledWith('1', { isActive: false });
    });

    it('should throw ForbiddenException when no permission', async () => {
      const mockUser = { id: '1', organizationId: 'org-2' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      await expect(service.remove('1', 'org-1', 'company_admin')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle user active status', async () => {
      const mockUser = { id: '1', organizationId: 'org-1' };
      const updatedUser = { ...mockUser, isActive: false };
      
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);
      mockUserRepository.findOne.mockResolvedValueOnce(updatedUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      
      const result = await service.toggleStatus('1', false, 'org-1', 'company_admin');
      expect(result).toHaveProperty('isActive', false);
    });
  });

  describe('findAll', () => {
    it('should return all users for organization', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com', name: 'User 1' },
        { id: '2', email: 'user2@test.com', name: 'User 2' },
      ];
      mockUserRepository.find.mockResolvedValue(mockUsers);
      
      const result = await service.findAll('org-1');
      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        select: ['id', 'email', 'name', 'phone', 'roles', 'organizationId', 'isActive', 'createdAt'],
      });
    });

    it('should return all users for super_admin', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com', name: 'User 1' },
      ];
      mockUserRepository.find.mockResolvedValue(mockUsers);
      
      const result = await service.findAll();
      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: {},
        select: ['id', 'email', 'name', 'phone', 'roles', 'organizationId', 'isActive', 'createdAt'],
      });
    });
  });

  describe('findByIdWithRoles', () => {
    it('should return user with roles', async () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test', roles: [{ name: 'admin' }] };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      const result = await service.findByIdWithRoles('1');
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['roles'],
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      
      await expect(service.findByIdWithRoles('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});