import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { Review } from './review.entity';
import { Shipment } from '../shipments/shipment.entity';
import { Driver } from '../drivers/driver.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockReviewRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockShipmentRepository = {
    findOne: jest.fn(),
  };

  const mockDriverRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: mockReviewRepository,
        },
        {
          provide: getRepositoryToken(Shipment),
          useValue: mockShipmentRepository,
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: mockDriverRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a review', async () => {
      const createDto = { shipmentId: 'ship-1', rating: 5, comment: 'Great!' };
      const mockShipment = { id: 'ship-1', driverId: 'driver-1', status: 'delivered', customerId: 'user-1' };
      const mockReview = { id: 'review-1', ...createDto };
      
      mockShipmentRepository.findOne.mockResolvedValue(mockShipment);
      mockReviewRepository.findOne.mockResolvedValue(null);
      mockReviewRepository.create.mockReturnValue(mockReview);
      mockReviewRepository.save.mockResolvedValue(mockReview);
      
      const result = await service.create(createDto, 'user-1');
      expect(result).toEqual(mockReview);
    });

    it('should throw error when shipment not found', async () => {
      mockShipmentRepository.findOne.mockResolvedValue(null);
      
      await expect(service.create({ shipmentId: 'invalid', rating: 5 }, 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getDriverAverageRating', () => {
    it('should return average rating', async () => {
      const reviews = [{ rating: 5 }, { rating: 4 }, { rating: 3 }];
      mockReviewRepository.find.mockResolvedValue(reviews);
      
      const result = await service.getDriverAverageRating('driver-1');
      expect(result).toBe(4);
    });

    it('should return 0 when no reviews', async () => {
      mockReviewRepository.find.mockResolvedValue([]);
      
      const result = await service.getDriverAverageRating('driver-1');
      expect(result).toBe(0);
    });
  });
});