import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Shipment, ShipmentStatus } from './shipment.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ShipmentQueryDto } from './dto/shipment-query.dto';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
  ) {}

  async create(createDto: CreateShipmentDto, userId: string, organizationId: string): Promise<Shipment> {
    const shipment = this.shipmentRepository.create({
      ...createDto,
      customerId: userId,
      organizationId: organizationId,
      createdBy: userId,
      status: ShipmentStatus.PENDING,
    });
    return this.shipmentRepository.save(shipment);
  }

  async findAll(query: ShipmentQueryDto, organizationId: string, userRole: string, userId: string) {
  const { status, search, driverId, page = 1, limit = 10 } = query;  // Shto default values
  
  const skip = (page - 1) * limit;  // Tani page dhe limit janë gjithmonë numra

  const where: any = { organizationId };

  if (status) where.status = status;
  if (driverId) where.driverId = driverId;
  
  if (search) {
    where.trackingNumber = Like(`%${search}%`);
  }

  if (userRole === 'driver') {
    where.driverId = userId;
  }

  const [items, total] = await this.shipmentRepository.findAndCount({
    where,
    relations: ['driver', 'vehicle', 'customer'],
    skip,
    take: limit,
    order: { createdAt: 'DESC' },
  });

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

  async findOne(id: string, organizationId: string, userRole: string, userId: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: ['driver', 'vehicle', 'customer', 'organization'],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.organizationId !== organizationId && userRole !== 'super_admin') {
      throw new ForbiddenException('Access denied');
    }

    if (userRole === 'driver' && shipment.driverId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    //

    return shipment;
  }

  async update(id: string, updateDto: UpdateShipmentDto, organizationId: string): Promise<Shipment> {
    const shipment = await this.findOne(id, organizationId, 'admin', '');
    
    await this.shipmentRepository.update(id, updateDto);
    return this.findOne(id, organizationId, 'admin', '');
  }

  async updateStatus(id: string, statusDto: UpdateStatusDto, organizationId: string, userId: string): Promise<Shipment> {
    const shipment = await this.findOne(id, organizationId, 'admin', '');
    
    const updates: any = { status: statusDto.status };
    
    if (statusDto.status === ShipmentStatus.PICKED_UP) {
      updates.pickedUpAt = new Date();
    }
    
    if (statusDto.status === ShipmentStatus.DELIVERED) {
      updates.actualDelivery = new Date();
    }

    await this.shipmentRepository.update(id, updates);
    return this.findOne(id, organizationId, 'admin', '');
  }

  async assignDriver(id: string, driverId: string, organizationId: string): Promise<Shipment> {
    const shipment = await this.findOne(id, organizationId, 'admin', '');
    await this.shipmentRepository.update(id, { driverId });
    return this.findOne(id, organizationId, 'admin', '');
  }

  async assignVehicle(id: string, vehicleId: string, organizationId: string): Promise<Shipment> {
    const shipment = await this.findOne(id, organizationId, 'admin', '');
    await this.shipmentRepository.update(id, { vehicleId });
    return this.findOne(id, organizationId, 'admin', '');
  }

  async getMyShipments(userId: string, organizationId: string, query: ShipmentQueryDto) {
    return this.findAll(query, organizationId, 'driver', userId);
  }

  async getTracking(trackingNumber: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { trackingNumber },
      relations: ['driver', 'vehicle'],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return shipment;
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const shipment = await this.findOne(id, organizationId, 'admin', '');
    await this.shipmentRepository.delete(id);
  }
}