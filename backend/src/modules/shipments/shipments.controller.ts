// src/modules/shipments/shipments.controller.ts
import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ShipmentQueryDto } from './dto/shipment-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { DriversService } from '../drivers/drivers.service';

@ApiTags('Shipments')
@ApiBearerAuth()
@Controller('shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShipmentsController {
  constructor(
    private shipmentsService: ShipmentsService,
    private driversService: DriversService,
  ) {}

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Create a new shipment' })
  create(@Body() createDto: CreateShipmentDto, @Request() req) {
    const organizationId = createDto.organizationId || req.user.organizationId;
    return this.shipmentsService.create(createDto, req.user.id, organizationId);
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all shipments with filters' })
  findAll(@Query() query: ShipmentQueryDto, @Request() req) {
    return this.shipmentsService.findAll(query, req.user.organizationId, req.user.role, req.user.id);
  }

  @Get('my')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get my assigned shipments (for drivers)' })
  getMyShipments(@Query() query: ShipmentQueryDto, @Request() req) {
    return this.shipmentsService.getMyShipments(req.user.id, req.user.organizationId, query);
  }

  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Track shipment by tracking number (public)' })
  async trackShipment(@Param('trackingNumber') trackingNumber: string) {
    return this.shipmentsService.getTracking(trackingNumber);
  }

    @Get(':id')
    @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER, UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Get shipment by ID' })
    async findOne(@Param('id') id: string, @Request() req) {
      // Për driver, kalojmë userId, JO driver.id
      if (req.user.role === 'driver') {
        return this.shipmentsService.findOne(id, req.user.organizationId, req.user.role, req.user.id);
      }
      
      return this.shipmentsService.findOne(id, req.user.organizationId, req.user.role, req.user.id);
    }

    @Get(':id/history')
    @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER, UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Get shipment status history' })
    async getHistory(@Param('id') id: string, @Request() req) {
      // ✅ Kalo req.user.id për driver
      return this.shipmentsService.getHistory(id, req.user.organizationId, req.user.role, req.user.id);
    }

  @Put(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Update shipment' })
  update(@Param('id') id: string, @Body() updateDto: UpdateShipmentDto, @Request() req) {
    return this.shipmentsService.update(id, updateDto, req.user.organizationId);
  }

  @Patch(':id/status')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
  @ApiOperation({ summary: 'Update shipment status' })
  updateStatus(@Param('id') id: string, @Body() statusDto: UpdateStatusDto, @Request() req) {
    return this.shipmentsService.updateStatus(id, statusDto, req.user.organizationId, req.user.id);
  }

  @Patch(':id/assign-driver/:driverId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Assign driver to shipment' })
  assignDriver(@Param('id') id: string, @Param('driverId') driverId: string, @Request() req) {
    return this.shipmentsService.assignDriver(id, driverId, req.user.organizationId);
  }

  @Patch(':id/assign-vehicle/:vehicleId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Assign vehicle to shipment' })
  assignVehicle(@Param('id') id: string, @Param('vehicleId') vehicleId: string, @Request() req) {
    return this.shipmentsService.assignVehicle(id, vehicleId, req.user.organizationId);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete shipment' })
  remove(@Param('id') id: string, @Request() req) {
    return this.shipmentsService.remove(id, req.user.organizationId);
  }
}