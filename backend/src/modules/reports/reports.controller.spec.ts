import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Shipment } from '../shipments/shipment.entity';
import { Driver } from '../drivers/driver.entity';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';  // ✅ Add this import
import { Reflector } from '@nestjs/core';     // ✅ Add this import
import { JwtService } from '@nestjs/jwt';     // ✅ Add this import

// Mock Report entity
class MockReport {
  id!: string;
  type!: string;
  data!: any;
}

describe('ReportsController', () => {
  let controller: ReportsController;

  const mockReportsService = {
    generateDailyReport: jest.fn(),
    generateMonthlyReport: jest.fn(),
    generateDriverPerformanceReport: jest.fn(),
    getReport: jest.fn(),
    getReportsByOrganization: jest.fn(),
    deleteReport: jest.fn(),
    downloadReport: jest.fn(),
  };

  // ✅ Add mock for UserRepository (needed for RolesGuard)
  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  // ✅ Add mock for JwtService
  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  // ✅ Add mock for Reflector (needed for RolesGuard)
  const mockReflector = {
    get: jest.fn(),
    getAllAndOverride: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      role: 'company_admin',
      organizationId: 'org-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
        {
          provide: getRepositoryToken(MockReport),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Shipment),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),  // ✅ Add User repository
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,               // ✅ Add JwtService
          useValue: mockJwtService,
        },
        {
          provide: Reflector,                // ✅ Add Reflector
          useValue: mockReflector,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateDailyReport', () => {
    it('should generate a daily report with organizationId as URL param and date as string', async () => {
      const expectedReport = { id: '1', type: 'daily' };
      mockReportsService.generateDailyReport.mockResolvedValue(expectedReport);

      const organizationId = 'org-123';
      const dateString = '2026-05-30';
      
      const result = await controller.generateDailyReport(
        organizationId,
        dateString,
        mockRequest
      );
      
      expect(result).toEqual(expectedReport);
      expect(mockReportsService.generateDailyReport).toHaveBeenCalledWith(
        'org-123',
        'user-123',
        expect.any(Date)
      );
    });
  });

  describe('getAllReports', () => {
    it('should return all reports', async () => {
      const expectedReports = [{ id: '1' }, { id: '2' }];
      mockReportsService.getReportsByOrganization.mockResolvedValue(expectedReports);

      const result = await controller.getAllReports(mockRequest);
      expect(result).toEqual(expectedReports);
      expect(mockReportsService.getReportsByOrganization).toHaveBeenCalledWith('org-123', 'user-123');
    });
  });

  describe('getReport', () => {
    it('should return a report by ID', async () => {
      const expectedReport = { id: '1' };
      mockReportsService.getReport.mockResolvedValue(expectedReport);

      const result = await controller.getReport('1', mockRequest);
      expect(result).toEqual(expectedReport);
      expect(mockReportsService.getReport).toHaveBeenCalledWith('1', 'org-123');
    });
  });

  describe('deleteReport', () => {
    it('should delete a report', async () => {
      mockReportsService.deleteReport.mockResolvedValue(undefined);

      await controller.deleteReport('1', mockRequest);
      expect(mockReportsService.deleteReport).toHaveBeenCalledWith('1', 'org-123', 'user-123');
    });
  });
});