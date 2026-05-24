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
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
// Në fillim të shipments.controller.ts, shto importin:
import { UpdateCoordinatesDto } from './dto/update-coordinates.dto';
@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
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

      const savedShipment = await this.shipmentRepository.save(shipment);

      // ✅ Notifikata për dispatchers kur krijohet shipment i ri
      await this.notificationsService.createForRole(
        'dispatcher',
        'New Shipment Created',
        `A new shipment has been created (Tracking: ${trackingNumber}). Please assign a driver.`,
        { shipmentId: savedShipment.id, trackingNumber }
      );

      // ✅ Notifikata për company admin
      await this.notificationsService.createForRole(
        'company_admin',
        'New Shipment Created',
        `A new shipment (${trackingNumber}) has been created.`,
        { shipmentId: savedShipment.id, trackingNumber }
      );

      return savedShipment;
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw new InternalServerErrorException('Failed to create shipment');
    }
  }
// src/modules/shipments/shipments.service.ts
// Shto këtë metodë pas assignVehicle ose në fund

async updateCoordinates(id: string, updateCoordinatesDto: UpdateCoordinatesDto, organizationId: string): Promise<any> {
  // Verifiko që shipment-i ekziston dhe i përket organizatës
  const shipment = await this.shipmentRepository.findOne({
    where: { id, organizationId },
  });

  if (!shipment) {
    throw new NotFoundException('Shipment not found');
  }

  // Përgatit të dhënat për përditësim
  const updates: any = {};
  
  if (updateCoordinatesDto.pickupLatitude !== undefined) {
    updates.pickupLatitude = updateCoordinatesDto.pickupLatitude;
  }
  if (updateCoordinatesDto.pickupLongitude !== undefined) {
    updates.pickupLongitude = updateCoordinatesDto.pickupLongitude;
  }
  if (updateCoordinatesDto.deliveryLatitude !== undefined) {
    updates.deliveryLatitude = updateCoordinatesDto.deliveryLatitude;
  }
  if (updateCoordinatesDto.deliveryLongitude !== undefined) {
    updates.deliveryLongitude = updateCoordinatesDto.deliveryLongitude;
  }

  // Përditëso shipment-in
  await this.shipmentRepository.update(id, updates);

  // Kthe shipment-in e përditësuar
  const updatedShipment = await this.findOne(id, organizationId, 'admin', '');

  // ✅ Notifikatë për dispatchers kur përditësohen koordinatat
  await this.notificationsService.createForRole(
    'dispatcher',
    'Shipment Coordinates Updated',
    `Coordinates for shipment ${shipment.trackingNumber} have been updated.`,
    { shipmentId: id, trackingNumber: shipment.trackingNumber }
  );

  return updatedShipment;
}
// backend/src/modules/shipments/shipments.service.ts
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
    relations: ['driver', 'driver.user', 'vehicle', 'customer'],
    skip,
    take: limit,
    order: { createdAt: 'DESC' },
  });

  // Transformo të dhënat për frontend (pa select)
  const transformedItems = items.map(shipment => ({
    id: shipment.id,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    pickupAddress: shipment.pickupAddress,
    deliveryAddress: shipment.deliveryAddress,
    createdAt: shipment.createdAt,
    customer: shipment.customer ? {
      name: shipment.customer.name,
      email: shipment.customer.email
    } : null,
    driver: shipment.driver ? {
      name: shipment.driver.user?.name || 'Driver',
      id: shipment.driver.id,
      phone: shipment.driver.phone
    } : null,
    vehicle: shipment.vehicle ? {
      licensePlate: shipment.vehicle.licensePlate,
      type: shipment.vehicle.type
    } : null
  }));

  return { items: transformedItems, total, page, limit, totalPages: Math.ceil(total / limit) };
}

  async getHistory(id: string, organizationId: string, userRole: string, userId: string): Promise<any[]> {
    await this.findOne(id, organizationId, userRole, userId);
    return [];
  }

  async findOne(id: string, organizationId: string, userRole: string, userId: string): Promise<any> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: ['driver', 'driver.user', 'vehicle', 'customer', 'organization'],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (userRole !== 'super_admin') {
      if (shipment.organizationId !== organizationId) {
        throw new ForbiddenException('Access denied - This shipment belongs to a different organization');
      }

      if (userRole === 'driver') {
        const driver = await this.driverRepository.findOne({
          where: { userId: userId },
        });

        if (!driver || shipment.driverId !== driver.id) {
          throw new ForbiddenException('Access denied - This shipment is not assigned to you');
        }
      }
    }

    return {
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
    const shipment = await this.findOne(id, organizationId, 'admin', '');
    
    const updates: any = { status: statusDto.status };
    if (statusDto.status === ShipmentStatus.PICKED_UP) updates.pickedUpAt = new Date();
    if (statusDto.status === ShipmentStatus.DELIVERED) updates.actualDelivery = new Date();

    await this.shipmentRepository.update(id, updates);
    const updatedShipment = await this.findOne(id, organizationId, 'admin', '');

    // ✅ Notifikata kur shipment-i dorëzohet
    if (statusDto.status === ShipmentStatus.DELIVERED) {
      await this.notificationsService.create({
        userId: updatedShipment.customerId,
        title: 'Shipment Delivered',
        message: `Your shipment ${updatedShipment.trackingNumber} has been delivered successfully.`,
        data: { shipmentId: id, trackingNumber: updatedShipment.trackingNumber }
      });

      await this.notificationsService.createForRole(
        'company_admin',
        'Shipment Delivered',
        `Shipment ${updatedShipment.trackingNumber} has been delivered.`,
        { shipmentId: id, trackingNumber: updatedShipment.trackingNumber }
      );
    }

    return updatedShipment;
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

      if (vehicle.licensePlate && driver.licenseNumber !== vehicle.licensePlate) {
        driver.licenseNumber = vehicle.licensePlate;
        await this.driverRepository.save(driver);
      }
      
    }

    // ✅ Notifikatë për driver-in e assignuar
    const driver = await this.driverRepository.findOne({
      where: { id: finalDriverId },
      relations: ['user'],
    });

    if (driver?.user) {
      await this.notificationsService.create({
        userId: driver.user.id,
        title: 'New Shipment Assigned',
        message: `You have been assigned to shipment ${shipment.trackingNumber}. Pickup: ${shipment.pickupAddress}`,
        data: { shipmentId: id, trackingNumber: shipment.trackingNumber }
      });
    }

    // ✅ Notifikatë për dispatchers
    await this.notificationsService.createForRole(
      'dispatcher',
      'Driver Assigned',
      `Driver ${driver?.user?.name || 'Unknown'} has been assigned to shipment ${shipment.trackingNumber}.`,
      { shipmentId: id, driverId: finalDriverId, trackingNumber: shipment.trackingNumber }
    );

    return this.findOne(id, organizationId, 'admin', '');
  }

  async assignVehicle(id: string, vehicleId: string, organizationId: string): Promise<Shipment> {
    await this.findOne(id, organizationId, 'admin', '');

    await this.shipmentRepository.update(id, { vehicleId });

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
    
    const result = await this.findAll(query, organizationId, 'driver', driver.id);
    return result;
  }

  async getStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    inTransit: number;
    delivered: number;
    cancelled: number;
    failed: number;
  }> {
    const [total, delivered, pending, inTransit, cancelled, failed] = await Promise.all([
      this.shipmentRepository.count({ where: { organizationId } }),
      this.shipmentRepository.count({ where: { organizationId, status: ShipmentStatus.DELIVERED } }),
      this.shipmentRepository.count({ where: { organizationId, status: ShipmentStatus.PENDING } }),
      this.shipmentRepository.count({ where: { organizationId, status: ShipmentStatus.IN_TRANSIT } }),
      this.shipmentRepository.count({ where: { organizationId, status: ShipmentStatus.CANCELLED } }),
      this.shipmentRepository.count({ where: { organizationId, status: ShipmentStatus.FAILED } }),
    ]);

    return {
      total,
      pending,
      inTransit,
      delivered,
      cancelled,
      failed,
    };
  }

  async getTracking(trackingNumber: string) {
    console.log('getTracking called for:', trackingNumber);
    
    const shipment = await this.shipmentRepository.findOne({
      where: { trackingNumber },
      relations: ['driver', 'driver.user', 'vehicle'],
    });
    
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    
    console.log('Found shipment:', shipment.id);
    
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