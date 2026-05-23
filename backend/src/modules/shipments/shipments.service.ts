// src/modules/shipments/shipments.service.ts
import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Shipment, ShipmentStatus, ShipmentPriority } from './shipment.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ShipmentQueryDto } from './dto/shipment-query.dto';
import { Driver } from '../drivers/driver.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
        @InjectRepository(Driver)  // ✅ Shto DriverRepository
        private driverRepository: Repository<Driver>
  ) {}

  private generateUniqueTrackingNumber(): string {
    const prefix = 'TRK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  async create(createDto: CreateShipmentDto, userId: string, organizationId: string): Promise<Shipment> {
    try {
      if (!organizationId) {
        throw new ForbiddenException('Organization ID is required. Please select a company first.');
      }

      let trackingNumber = createDto.trackingNumber;
      const existingShipment = await this.shipmentRepository.findOne({
        where: { trackingNumber }
      });
      
      if (existingShipment) {
        trackingNumber = this.generateUniqueTrackingNumber();
      }

      const shipment = this.shipmentRepository.create({
        trackingNumber,
        pickupAddress: createDto.pickupAddress,
        pickupLatitude: createDto.pickupLatitude,
        pickupLongitude: createDto.pickupLongitude,
        deliveryAddress: createDto.deliveryAddress,
        deliveryLatitude: createDto.deliveryLatitude,
        deliveryLongitude: createDto.deliveryLongitude,
        weightKg: createDto.weightKg,
        volumeM3: createDto.volumeM3,
        priority: createDto.priority || ShipmentPriority.NORMAL,
        isExpress: createDto.isExpress || false,
        notes: createDto.notes,
        customerId: userId,
        organizationId: organizationId,
        createdBy: userId,
        status: ShipmentStatus.PENDING,
      });

      return await this.shipmentRepository.save(shipment);
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw new InternalServerErrorException('Failed to create shipment');
    }
  }
  

  async findAll(query: ShipmentQueryDto, organizationId: string, userRole: string, userId: string) {
    const { status, search, driverId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: any = { organizationId };

    if (status) where.status = status;
    if (driverId) where.driverId = driverId;
    if (search) where.trackingNumber = Like(`%${search}%`);
    if (userRole === 'driver') where.driverId = userId;

    const [items, total] = await this.shipmentRepository.findAndCount({
      where,
      relations: ['driver', 'vehicle', 'customer'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // src/modules/shipments/shipments.service.ts
async getHistory(id: string, organizationId: string, userRole: string, userId: string): Promise<any[]> {
  // Verifiko aksesin
  await this.findOne(id, organizationId, userRole, userId);
  
  // Për momentin kthe array bosh
  // TODO: Kur të keni tabelën e historikut, implementoni këtu
  return [];
}

// src/modules/shipments/shipments.service.ts

async findOne(id: string, organizationId: string, userRole: string, userId: string): Promise<Shipment> {
  const shipment = await this.shipmentRepository.findOne({
    where: { id },
    relations: ['driver', 'vehicle', 'customer', 'organization'],
  });
  
  if (!shipment) throw new NotFoundException('Shipment not found');
  
  if (shipment.organizationId !== organizationId && userRole !== 'super_admin') {
    throw new ForbiddenException('Access denied');
  }
  
  if (userRole === 'driver') {
    // ✅ Gjej driver-in nga userId
    const driver = await this.driverRepository.findOne({
      where: { userId: userId }
    });
    
    console.log('Driver check - userId:', userId);
    console.log('Found driver:', driver);
    console.log('Shipment driverId:', shipment.driverId);
    
    // ✅ Krahaso me driver.id
    if (!driver || shipment.driverId !== driver.id) {
      throw new ForbiddenException('Access denied - This shipment is not assigned to you');
    }
    // src/modules/shipments/shipments.service.ts - findOne method

console.log('=== FIND ONE DEBUG ===');
console.log('User role:', userRole);
console.log('User ID passed:', userId);
console.log('Shipment driverId:', shipment.driverId);
console.log('Shipment organizationId:', shipment.organizationId);
console.log('Organization ID from request:', organizationId);

if (userRole === 'driver') {
  const driver = await this.driverRepository.findOne({
    where: { userId: userId }
  });
  
  console.log('Found driver:', driver?.id);
  console.log('Comparing:', shipment.driverId, '===', driver?.id);
  
  if (!driver || shipment.driverId !== driver.id) {
    console.log('ACCESS DENIED - IDs do not match');
    throw new ForbiddenException('Access denied - This shipment is not assigned to you');
  }
  console.log('ACCESS GRANTED');
}
  }
  
  return shipment;
}

  async update(id: string, updateDto: UpdateShipmentDto, organizationId: string): Promise<Shipment> {
    await this.findOne(id, organizationId, 'admin', '');
    
    const allowedUpdates: Partial<Shipment> = {};
    if (updateDto.pickupAddress !== undefined) allowedUpdates.pickupAddress = updateDto.pickupAddress;
    if (updateDto.deliveryAddress !== undefined) allowedUpdates.deliveryAddress = updateDto.deliveryAddress;
    if (updateDto.weightKg !== undefined) allowedUpdates.weightKg = updateDto.weightKg;
    if (updateDto.volumeM3 !== undefined) allowedUpdates.volumeM3 = updateDto.volumeM3;
    if (updateDto.priority !== undefined) allowedUpdates.priority = updateDto.priority;
    if (updateDto.isExpress !== undefined) allowedUpdates.isExpress = updateDto.isExpress;
    if (updateDto.notes !== undefined) allowedUpdates.notes = updateDto.notes;
    
    await this.shipmentRepository.update(id, allowedUpdates);
    return this.findOne(id, organizationId, 'admin', '');
  }

  async updateStatus(id: string, statusDto: UpdateStatusDto, organizationId: string, userId: string): Promise<Shipment> {
    await this.findOne(id, organizationId, 'admin', '');
    
    const updates: any = { status: statusDto.status };
    if (statusDto.status === ShipmentStatus.PICKED_UP) updates.pickedUpAt = new Date();
    if (statusDto.status === ShipmentStatus.DELIVERED) updates.actualDelivery = new Date();
    if (statusDto.status === ShipmentStatus.IN_TRANSIT) {
      // Just update status
    }

    await this.shipmentRepository.update(id, updates);
    return this.findOne(id, organizationId, 'admin', '');
  }

// src/modules/shipments/shipments.service.ts

async assignDriver(id: string, driverId: string, organizationId: string): Promise<Shipment> {
  const shipment = await this.findOne(id, organizationId, 'admin', '');
  
  if (!shipment) {
    throw new NotFoundException('Shipment not found');
  }
  
  // ✅ Sigurohu që driverId është ID e tabelës drivers
  let finalDriverId = driverId;
  
  // Kontrollo nëse driverId është user_id
  const driverByUser = await this.driverRepository.findOne({
    where: { userId: driverId }
  });
  
  if (driverByUser) {
    finalDriverId = driverByUser.id;
    console.log(`Converted userId ${driverId} to driverId ${finalDriverId}`);
  }
  
  await this.shipmentRepository.update(id, { 
    driverId: finalDriverId,
    status: ShipmentStatus.IN_TRANSIT
  });
  
  return this.findOne(id, organizationId, 'admin', '');
}

  async assignVehicle(id: string, vehicleId: string, organizationId: string): Promise<Shipment> {
    await this.findOne(id, organizationId, 'admin', '');
    await this.shipmentRepository.update(id, { vehicleId });
    return this.findOne(id, organizationId, 'admin', '');
  }

// backend/src/modules/shipments/shipments.service.ts

async getMyShipments(userId: string, organizationId: string, query: ShipmentQueryDto) {
  const driver = await this.driverRepository.findOne({
    where: { userId: userId }
  });
  
  if (!driver) {
    return { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }
  
  // Përdor driver.id për të gjetur shipment-et
  const result = await this.findAll(query, organizationId, 'driver', driver.id);
  
  return result;  // Kthe direkt result, pa modifikim shtesë
}

  async getTracking(trackingNumber: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { trackingNumber },
      relations: ['driver', 'vehicle'],
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findOne(id, organizationId, 'admin', '');
    await this.shipmentRepository.delete(id);
  }
}