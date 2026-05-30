import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShipmentsService } from './shipments.service';
import { Shipment } from './shipment.entity';
import { Driver } from '../drivers/driver.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

describe('ShipmentsService', () => {
  let service: ShipmentsService;

  const mockShipmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
  };

  const mockDriverRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
    createForRole: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        {
          provide: getRepositoryToken(Shipment),
          useValue: mockShipmentRepository,
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: mockDriverRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new shipment', async () => {
      const createDto = {
        pickupAddress: 'Prishtina',
        deliveryAddress: 'Ferizaj',
      };

      const expectedShipment = { id: '1', ...createDto, trackingNumber: 'TRK-123' };

      mockShipmentRepository.create.mockReturnValue(expectedShipment);
      mockShipmentRepository.save.mockResolvedValue(expectedShipment);
      mockAuditService.log.mockResolvedValue({});
      mockNotificationsService.createForRole.mockResolvedValue({});

      const result = await service.create(createDto, 'user-1', 'org-1');
      expect(result).toEqual(expectedShipment);
      expect(mockShipmentRepository.create).toHaveBeenCalled();
      expect(mockShipmentRepository.save).toHaveBeenCalled();
    });
  });
});