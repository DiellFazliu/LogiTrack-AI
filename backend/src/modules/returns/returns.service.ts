import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Return, ReturnStatus } from './return.entity';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { Shipment } from '../shipments/shipment.entity';
import { Driver } from '../drivers/driver.entity';
import { Vehicle } from '../vehicles/vehicle.entity';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(Return)
    private returnRepository: Repository<Return>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(createReturnDto: CreateReturnDto, userId: string, organizationId: string): Promise<Return> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: createReturnDto.originalShipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have access to this shipment');
    }

    const returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    const returnRequest = this.returnRepository.create({
      ...createReturnDto,
      returnNumber,
      customerId: userId,
      organizationId,
      returnStatus: ReturnStatus.REQUESTED,
    });

    return this.returnRepository.save(returnRequest);
  }

  async findAll(
    organizationId: string,
    filters: {
      status?: ReturnStatus;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    },
  ): Promise<{ items: Return[]; total: number }> {
    const where: FindOptionsWhere<Return> = { organizationId };
    
    if (filters.status) {
      where.returnStatus = filters.status;
    }
    
    if (filters.fromDate && filters.toDate) {
      where.createdAt = Between(filters.fromDate, filters.toDate);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await this.returnRepository.findAndCount({
      where,
      relations: ['originalShipment', 'customer'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { items, total };
  }

  async findById(id: string, organizationId: string): Promise<Return> {
    const returnRequest = await this.returnRepository.findOne({
      where: { id, organizationId },
      relations: ['originalShipment', 'customer'],
    });

    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    return returnRequest;
  }

  async updateStatus(
    id: string,
    organizationId: string,
    updateReturnDto: UpdateReturnDto,
    approvedBy?: string,
  ): Promise<Return> {
    const returnRequest = await this.findById(id, organizationId);

    if (updateReturnDto.returnStatus === ReturnStatus.APPROVED && 
        returnRequest.returnStatus === ReturnStatus.REQUESTED) {
      if (approvedBy) {
        returnRequest.approvedBy = approvedBy;
      }
      returnRequest.approvedAt = new Date();
    }

    if (updateReturnDto.returnStatus === ReturnStatus.PICKUP_SCHEDULED && updateReturnDto.driverId) {
      const driver = await this.driverRepository.findOne({
        where: { id: updateReturnDto.driverId, organizationId },
      });
      if (!driver) {
        throw new NotFoundException('Driver not found');
      }
      returnRequest.driverId = updateReturnDto.driverId;
    }

    if (updateReturnDto.returnStatus === ReturnStatus.PICKUP_SCHEDULED && updateReturnDto.vehicleId) {
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: updateReturnDto.vehicleId, organizationId },
      });
      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }
      returnRequest.vehicleId = updateReturnDto.vehicleId;
    }

    if (updateReturnDto.returnStatus === ReturnStatus.PICKUP_SCHEDULED) {
      returnRequest.returnStatus = ReturnStatus.PICKUP_SCHEDULED;
    }

    if (updateReturnDto.pickupScheduledDate) {
      returnRequest.pickupScheduledDate = updateReturnDto.pickupScheduledDate;
    }
    
    if (updateReturnDto.notes) {
      returnRequest.notes = updateReturnDto.notes;
    }

    if (updateReturnDto.refundAmount !== undefined) {
      returnRequest.refundAmount = updateReturnDto.refundAmount;
    }

    return this.returnRepository.save(returnRequest);
  }

  async completePickup(id: string, organizationId: string): Promise<Return> {
    const returnRequest = await this.findById(id, organizationId);
    
    if (returnRequest.returnStatus !== ReturnStatus.PICKUP_SCHEDULED && 
        returnRequest.returnStatus !== ReturnStatus.APPROVED) {
      throw new BadRequestException('Pickup cannot be completed at this stage');
    }

    returnRequest.returnStatus = ReturnStatus.IN_TRANSIT;
    returnRequest.pickupCompletedAt = new Date();

    return this.returnRepository.save(returnRequest);
  }

  async completeDelivery(id: string, organizationId: string): Promise<Return> {
    const returnRequest = await this.findById(id, organizationId);
    
    if (returnRequest.returnStatus !== ReturnStatus.IN_TRANSIT) {
      throw new BadRequestException('Delivery cannot be completed at this stage');
    }

    returnRequest.returnStatus = ReturnStatus.RECEIVED;
    returnRequest.deliveryCompletedAt = new Date();

    return this.returnRepository.save(returnRequest);
  }

  async processRefund(id: string, organizationId: string, refundAmount: number, transactionId?: string): Promise<Return> {
    const returnRequest = await this.findById(id, organizationId);
    
    if (returnRequest.returnStatus !== ReturnStatus.RECEIVED) {
      throw new BadRequestException('Refund can only be processed after item is received');
    }

    returnRequest.refundAmount = refundAmount;
    
    if (transactionId) {
      returnRequest.refundTransactionId = transactionId;
    }
    
    returnRequest.refundProcessedAt = new Date();
    returnRequest.returnStatus = ReturnStatus.COMPLETED;

    return this.returnRepository.save(returnRequest);
  }

  async reject(id: string, organizationId: string, rejectionReason: string): Promise<Return> {
    const returnRequest = await this.findById(id, organizationId);
    
    returnRequest.returnStatus = ReturnStatus.REJECTED;
    returnRequest.rejectionReason = rejectionReason;
    returnRequest.approvedAt = new Date();

    return this.returnRepository.save(returnRequest);
  }

  async cancel(id: string, organizationId: string): Promise<Return> {
    const returnRequest = await this.findById(id, organizationId);
    
    if (returnRequest.returnStatus !== ReturnStatus.REQUESTED && 
        returnRequest.returnStatus !== ReturnStatus.APPROVED) {
      throw new BadRequestException('Return request cannot be cancelled at this stage');
    }

    returnRequest.returnStatus = ReturnStatus.CANCELLED;

    return this.returnRepository.save(returnRequest);
  }

  async getStatistics(organizationId: string): Promise<any> {
    const stats = await this.returnRepository
      .createQueryBuilder('r')
      .select([
        'r.return_status as status',
        'COUNT(*) as count',
        'SUM(r.refund_amount) as totalRefundAmount',
      ])
      .where('r.organization_id = :organizationId', { organizationId })
      .groupBy('r.return_status')
      .getRawMany();

    const total = stats.reduce((acc, s) => acc + parseInt(s.count), 0);
    const mostCommonReason = await this.returnRepository
      .createQueryBuilder('r')
      .select(['r.return_reason as reason', 'COUNT(*) as count'])
      .where('r.organization_id = :organizationId', { organizationId })
      .groupBy('r.return_reason')
      .orderBy('count', 'DESC')
      .limit(1)
      .getRawOne();

    return {
      totalReturns: total,
      byStatus: stats,
      mostCommonReason: mostCommonReason?.reason || null,
      totalRefundAmount: stats.reduce((acc, s) => acc + (parseFloat(s.totalrefundamount) || 0), 0),
    };
  }
}