import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../modules/users/user.entity';
import { Test, TestingModule } from '@nestjs/testing';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});