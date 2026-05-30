// backend/src/modules/reviews/reviews.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto';
import { Shipment } from '../shipments/shipment.entity';
import { Driver } from '../drivers/driver.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async create(createDto: CreateReviewDto, userId: string): Promise<Review> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: createDto.shipmentId, customerId: userId },
      relations: ['driver'],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found or you do not have permission');
    }

    if (shipment.status !== 'delivered') {
      throw new ForbiddenException('You can only review delivered shipments');
    }

    const existingReview = await this.reviewRepository.findOne({
      where: { shipmentId: createDto.shipmentId, createdBy: userId },
    });

    if (existingReview) {
      throw new ForbiddenException('You have already reviewed this shipment');
    }

    const review = this.reviewRepository.create({
      shipmentId: createDto.shipmentId,
      driverId: shipment.driverId,
      rating: createDto.rating,
      comment: createDto.comment,
      createdBy: userId,
    });

    return this.reviewRepository.save(review);
  }

  async findByShipment(shipmentId: string): Promise<Review | null> {
    return this.reviewRepository.findOne({
      where: { shipmentId },
      relations: ['driver', 'driver.user'],
    });
  }

  async findByDriver(driverId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { driverId },
      relations: ['shipment'],
      order: { createdAt: 'DESC' },
    });
  }

  // ✅ METODA E RE: Merr review-t e fundit për organizatën
  async getRecentReviews(organizationId: string, limit: number = 5): Promise<Review[]> {
    // Merr të gjithë driver-at e organizatës
    const drivers = await this.driverRepository.find({
      where: { organizationId },
      select: ['id'],
    });
    
    const driverIds = drivers.map(d => d.id);
    
    if (driverIds.length === 0) {
      return [];
    }
    
    return this.reviewRepository.find({
      where: { driverId: In(driverIds) },
      relations: ['driver', 'driver.user', 'shipment'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ✅ METODA E RE: Merr mesataren e vlerësimeve për të gjithë driver-at e organizatës
  async getAllDriversAverageRating(organizationId: string): Promise<{ average: number; total: number }> {
    const drivers = await this.driverRepository.find({
      where: { organizationId },
      select: ['id'],
    });
    
    const driverIds = drivers.map(d => d.id);
    
    if (driverIds.length === 0) {
      return { average: 0, total: 0 };
    }
    
    const reviews = await this.reviewRepository.find({
      where: { driverId: In(driverIds) },
    });
    
    if (reviews.length === 0) {
      return { average: 0, total: 0 };
    }
    
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / reviews.length;
    
    return { average: Number(average.toFixed(1)), total: reviews.length };
  }

  async getDriverAverageRating(driverId: string): Promise<number> {
    const reviews = await this.reviewRepository.find({
      where: { driverId },
    });

    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }

  async update(id: string, updateDto: UpdateReviewDto, userId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!review) {
      throw new NotFoundException('Review not found or you do not have permission');
    }

    if (updateDto.rating !== undefined) {
      review.rating = updateDto.rating;
    }
    if (updateDto.comment !== undefined) {
      review.comment = updateDto.comment;
    }

    return this.reviewRepository.save(review);
  }

  async delete(id: string, userId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!review) {
      throw new NotFoundException('Review not found or you do not have permission');
    }

    await this.reviewRepository.remove(review);
  }
}