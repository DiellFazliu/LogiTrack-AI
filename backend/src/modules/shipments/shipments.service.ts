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
        @InjectRepository(Driver)
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

async findOne(id: string, organizationId: string, userRole: string, userId: string): Promise<any> {
  // Fetch shipment with all necessary relations
  const shipment = await this.shipmentRepository.findOne({
    where: { id },
    relations: ['driver', 'driver.user', 'vehicle', 'customer', 'organization'],
  });

  if (!shipment) {
    throw new NotFoundException('Shipment not found');
  }

  // Super admin can access any shipment
  if (userRole !== 'super_admin') {
    // Check organization access
    if (shipment.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied - This shipment belongs to a different organization');
    }

    // Driver-specific check
    if (userRole === 'driver') {
      const driver = await this.driverRepository.findOne({
        where: { userId: userId },
      });

      if (!driver || shipment.driverId !== driver.id) {
        throw new ForbiddenException('Access denied - This shipment is not assigned to you');
      }
    }
  }

  // Return a flattened DTO for frontend convenience
  return {
    // Core shipment fields (spread)
    id: shipment.id,
    trackingNumber: shipment.trackingNumber,
    pickupAddress: shipment.pickupAddress,
    pickupLatitude: shipment.pickupLatitude,
    pickupLongitude: shipment.pickupLongitude,
    deliveryAddress: shipment.deliveryAddress,
    deliveryLatitude: shipment.deliveryLatitude,
    deliveryLongitude: shipment.deliveryLongitude,
    weightKg: shipment.weightKg,
    volumeM3: shipment.volumeM3,
    priority: shipment.priority,
    isExpress: shipment.isExpress,
    notes: shipment.notes,
    status: shipment.status,
    estimatedDistanceKm: shipment.estimatedDistanceKm,
    estimatedDurationMin: shipment.estimatedDurationMin,
    estimatedDelivery: shipment.estimatedDelivery,
    actualDelivery: shipment.actualDelivery,
    pickedUpAt: shipment.pickedUpAt,
    deliveryPhoto: shipment.deliveryPhoto,
    deliverySignature: shipment.deliverySignature,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,

    // Flattened relations
    customerId: shipment.customerId,
    customerName: shipment.customer?.name || null,
    customerEmail: shipment.customer?.email || null,
    
    driverId: shipment.driverId,
    driverName: shipment.driver?.user?.name || null,
    driverLicenseNumber: shipment.driver?.licenseNumber || null,
    driverPhone: shipment.driver?.phone || null,
    
    vehicleId: shipment.vehicleId,
    vehiclePlate: shipment.vehicle?.licensePlate || null,
    vehicleType: shipment.vehicle?.type || null,
    vehicleBrand: shipment.vehicle?.brand || null,
    vehicleModel: shipment.vehicle?.model || null,

    organizationId: shipment.organizationId,
    organizationName: shipment.organization?.name || null,

    createdBy: shipment.createdBy,

    // Keep original nested objects for flexibility (optional, can be removed)
    // but frontend can rely on flattened fields above.
    driver: shipment.driver,
    vehicle: shipment.vehicle,
    customer: shipment.customer,
    organization: shipment.organization,
  };
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

async assignDriver(id: string, driverId: string, organizationId: string): Promise<Shipment> {
  const shipment = await this.findOne(id, organizationId, 'admin', '');
  
  if (!shipment) {
    throw new NotFoundException('Shipment not found');
  }
  
  let finalDriverId = driverId;
  
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

  const updated = await this.shipmentRepository.findOne({
    where: { id },
    relations: ['driver', 'vehicle'],
  });

  if (updated?.driver && updated?.vehicle) {
    const driver = updated.driver;
    const vehicle = updated.vehicle;

    // NOTE: license_number is UNIQUE in drivers and license_plate is UNIQUE in vehicles
    if (vehicle.licensePlate && driver.licenseNumber !== vehicle.licensePlate) {
      driver.licenseNumber = vehicle.licensePlate;
      await this.driverRepository.save(driver);
    }
  }
  
  return this.findOne(id, organizationId, 'admin', '');
}

  async assignVehicle(id: string, vehicleId: string, organizationId: string): Promise<Shipment> {
    await this.findOne(id, organizationId, 'admin', '');

    await this.shipmentRepository.update(id, { vehicleId });

    // If driver already assigned on this shipment, sync driver license_number from vehicle.license_plate
    const updated = await this.shipmentRepository.findOne({
      where: { id },
      relations: ['driver', 'vehicle'],
    });

    if (updated?.driver && updated?.vehicle) {
      const driver = updated.driver;
      const vehicle = updated.vehicle;

      if (vehicle.licensePlate && driver.licenseNumber !== vehicle.licensePlate) {
        driver.licenseNumber = vehicle.licensePlate;
        await this.driverRepository.save(driver);
      }
    }

    return this.findOne(id, organizationId, 'admin', '');
  }

// backend/src/modules/shipments/shipments.service.ts

  async findByCustomer(customerId: string, organizationId: string, query: ShipmentQueryDto) {
    const { status, search, driverId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId, customerId };
    if (status) where.status = status;
    if (search) where.trackingNumber = Like(`%${search}%`);
    if (driverId) where.driverId = driverId;

    const [items, total] = await this.shipmentRepository.findAndCount({
      where,
      relations: ['driver', 'vehicle', 'customer'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

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

// backend/src/modules/shipments/shipments.service.ts
async getTracking(trackingNumber: string) {
  console.log('getTracking called for:', trackingNumber);
  
  const shipment = await this.shipmentRepository.findOne({
    where: { trackingNumber },
    relations: ['driver', 'driver.user', 'vehicle'], // ✅ Shto këto relations
  });
  
  if (!shipment) {
    throw new NotFoundException('Shipment not found');
  }
  
  console.log('Found shipment:', shipment.id);
  console.log('Driver:', shipment.driver);
  console.log('Driver user:', shipment.driver?.user);
  console.log('Vehicle:', shipment.vehicle);
  
  // Formato përgjigjen
  return {
    id: shipment.id,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    pickupAddress: shipment.pickupAddress,
    deliveryAddress: shipment.deliveryAddress,
    estimated_delivery: shipment.estimatedDelivery,
    actual_delivery: shipment.actualDelivery,
    createdAt: shipment.createdAt,
    weight_kg: shipment.weightKg,
    volume_m3: shipment.volumeM3,
    notes: shipment.notes,
    driver: shipment.driver ? {
      name: shipment.driver.user?.name || 'Driver',
      phone: shipment.driver.phone || '',
    } : null,
    vehicle: shipment.vehicle ? {
      license_plate: shipment.vehicle.licensePlate,
      type: shipment.vehicle.type,
    } : null,
    customer: shipment.customer ? {
      name: shipment.customer.name,
      email: shipment.customer.email,
    } : null,
  };
}

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findOne(id, organizationId, 'admin', '');
    await this.shipmentRepository.delete(id);
  }
}