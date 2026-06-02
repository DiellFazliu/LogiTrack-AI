import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Report } from './reports.entity';
import { Shipment } from '../shipments/shipment.entity';
import { Driver } from '../drivers/driver.entity';
import { Vehicle } from '../vehicles/vehicle.entity';  // ✅ Add this import
import { Review } from '../reviews/review.entity';    // ✅ Add this import
import { Organization } from '../organizations/organization.entity';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockReportRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockShipmentRepository = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({ count: 0 }),
    })),
  };

  const mockDriverRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };

  // ✅ Add mock for VehicleRepository
  const mockVehicleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };

  // ✅ Add mock for ReviewRepository
  const mockReviewRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockOrganizationRepository = {
    findOne: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockNotificationsService = {
    createForRole: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Report),
          useValue: mockReportRepository,
        },
        {
          provide: getRepositoryToken(Shipment),
          useValue: mockShipmentRepository,
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: mockDriverRepository,
        },
        {
          provide: getRepositoryToken(Vehicle),  // ✅ Add Vehicle repository
          useValue: mockVehicleRepository,
        },
        {
          provide: getRepositoryToken(Review),   // ✅ Add Review repository
          useValue: mockReviewRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateDailyReport', () => {
    it('should generate a daily report with 3 arguments', async () => {
      const mockShipments = [
        { id: '1', status: 'delivered', createdAt: new Date() },
        { id: '2', status: 'in_transit', createdAt: new Date() },
      ];
      mockShipmentRepository.find.mockResolvedValue(mockShipments);
      mockReportRepository.create.mockReturnValue({});
      mockReportRepository.save.mockResolvedValue({ id: 'report-1' });
      mockAuditService.log.mockResolvedValue({});
      mockNotificationsService.createForRole.mockResolvedValue({});

      const result = await service.generateDailyReport('org-1', 'user-1', new Date());
      
      expect(result).toBeDefined();
      expect(mockShipmentRepository.find).toHaveBeenCalled();
      expect(mockReportRepository.create).toHaveBeenCalled();
      expect(mockReportRepository.save).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(mockNotificationsService.createForRole).toHaveBeenCalled();
    });
  });

  describe('getReport', () => {
    it('should return a report by ID', async () => {
      const expectedReport = { id: '1', type: 'daily', data: {} };
      mockReportRepository.findOne.mockResolvedValue(expectedReport);

      const result = await service.getReport('1', 'org-1');
      expect(result).toEqual(expectedReport);
    });
  });
});