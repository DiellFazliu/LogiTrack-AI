// backend/src/modules/drivers/drivers.controller.ts
import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverStatus } from './driver.entity';
import { UpdateLocationDto, LocationHistoryQueryDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment, ShipmentStatus } from '../shipments/shipment.entity';
import { Waybill } from '../waybills/waybill.entity';
import { In } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

@ApiTags('Drivers')
@ApiBearerAuth()
@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(
    private driversService: DriversService,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(Waybill)
    private waybillRepository: Repository<Waybill>,
  ) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Create a new driver' })
  @ApiResponse({ status: 201, description: 'Driver created successfully' })
  create(@Body() createDto: CreateDriverDto, @Request() req) {
    return this.driversService.create(createDto, req.user.organizationId);
  }


  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get all drivers' })
  findAll(@Query('status') status: string, @Request() req) {
    const driverStatus = (status && status !== 'all') ? status as DriverStatus : undefined;
    return this.driversService.findAll(req.user.organizationId, driverStatus);
  }

  @Get('available')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get available drivers' })
  async getAvailable(@Request() req) {
    const drivers = await this.driversService.getAvailable(req.user.organizationId);
    console.log(`Found ${drivers.length} available drivers for organization ${req.user.organizationId}`);
    return drivers;
  }

  @Get('stats')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get driver statistics' })
  async getStats(@Request() req) {
    const driver = await this.driversService.findByUserId(req.user.id);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const shipments = await this.shipmentRepository.find({
      where: { driverId: driver.id, organizationId: driver.organizationId },
    });

    const waybills = await this.waybillRepository.find({
      where: { shipmentId: In(shipments.map(s => s.id)) },
    });

    const total = shipments.length;
    const completed = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
    const inProgress = shipments.filter(s => 
      s.status === ShipmentStatus.PICKED_UP || 
      s.status === ShipmentStatus.IN_TRANSIT
    ).length;
    const pending = shipments.filter(s => s.status === ShipmentStatus.PENDING).length;
    
    const pendingSignature = waybills.filter(w => !w.signature).length;

    return {
      total,
      inProgress,
      completed,
      pending,
      pendingSignature,
    };
  }

  @Get('shipments')
  @Roles(UserRole.DRIVER)
  async getShipments(@Request() req, @Query('limit') limit?: string) {
    const driver = await this.driversService.findByUserId(req.user.id);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const query = this.shipmentRepository.createQueryBuilder('shipment')
      .where('shipment.driverId = :driverId', { driverId: driver.id })
      .leftJoinAndSelect('shipment.customer', 'customer')
      .leftJoinAndSelect('shipment.vehicle', 'vehicle')
      .orderBy('shipment.createdAt', 'DESC');

    if (limit) {
      query.limit(parseInt(limit));
    }

    const shipments = await query.getMany();

    const shipmentsWithWaybill = await Promise.all(
      shipments.map(async (shipment) => {
        const waybill = await this.waybillRepository.findOne({
          where: { shipmentId: shipment.id },
        });
        return {
          id: shipment.id,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          pickupAddress: shipment.pickupAddress,
          deliveryAddress: shipment.deliveryAddress,
          pickupLatitude: shipment.pickupLatitude,
          pickupLongitude: shipment.pickupLongitude,
          deliveryLatitude: shipment.deliveryLatitude,
          deliveryLongitude: shipment.deliveryLongitude,
          estimatedDelivery: shipment.estimatedDelivery,
          waybillNumber: waybill?.waybillNumber || null,
          isWaybillSigned: !!waybill?.signature,
        };
      })
    );

    return shipmentsWithWaybill;
  }

  @Get(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get driver by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.driversService.findOne(id, req.user.organizationId);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Update driver' })
  update(@Param('id') id: string, @Body() updateDto: UpdateDriverDto, @Request() req) {
    return this.driversService.update(id, updateDto, req.user.organizationId);
  }

  @Patch(':id/status')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Update driver status' })
  updateStatus(@Param('id') id: string, @Body('status') status: DriverStatus, @Request() req) {
    return this.driversService.updateStatus(id, status, req.user.organizationId);
  }
  // backend/src/modules/drivers/drivers.controller.ts
@Get(':id/location/last')
@Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
@ApiOperation({ summary: 'Get driver last known location by driver ID' })
async getDriverLastLocation(@Param('id') id: string) {
  const lastLocation = await this.driversService.getLastLocationByDriverId(id);
  if (!lastLocation) {
    return { message: 'No location updates yet' };
  }
  return lastLocation;
}
// backend/src/modules/drivers/drivers.controller.ts
// Shto këtë endpoint:

@Get(':id/location/last')
@Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
@ApiOperation({ summary: 'Get driver last known location by driver ID' })
async getDriverLastLocationById(@Param('id') id: string) {
  const lastLocation = await this.driversService.getLastLocationByDriverId(id);
  if (!lastLocation) {
    return { message: 'No location updates yet' };
  }
  return lastLocation;
}

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete driver' })
  remove(@Param('id') id: string, @Request() req) {
    return this.driversService.remove(id, req.user.organizationId);
  }

  // ==================== LOCATION ENDPOINTS ====================

  @Post('location')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Update driver current location' })
  async updateLocation(
    @Body() updateLocationDto: UpdateLocationDto,
    @Request() req,
  ) {
    const driver = await this.driversService.findByUserId(req.user.id);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return this.driversService.updateLocation(
      driver.id,
      updateLocationDto.latitude,
      updateLocationDto.longitude,
      updateLocationDto.address,
    );
  }

  @Get('location/history')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get driver location history' })
  async getLocationHistory(
    @Query() query: LocationHistoryQueryDto,
    @Request() req,
  ) {
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.driversService.getLocationHistory(req.user.id, limit, offset);
  }

  @Get('location/last')
  @Roles(UserRole.DRIVER, UserRole.DISPATCHER, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get driver last known location' })
  async getLastLocation(@Request() req) {
    const lastLocation = await this.driversService.getLastLocation(req.user.id);
    if (!lastLocation) {
      return { message: 'No location updates yet' };
    }
    return lastLocation;
  }
}