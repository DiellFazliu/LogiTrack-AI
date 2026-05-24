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
  @Roles(UserRole.SUPER_ADMIN, UserRole.CUSTOMER, UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Create a new shipment' })
  create(@Body() createDto: CreateShipmentDto, @Request() req) {
    const organizationId = createDto.organizationId || req.user.organizationId;
    return this.shipmentsService.create(createDto, req.user.id, organizationId);
  }

  
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get all shipments with filters' })
  findAll(@Query() query: ShipmentQueryDto, @Request() req) {
    return this.shipmentsService.findAll(query, req.user.organizationId, req.user.role, req.user.id);
  }

  @Get('my')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CUSTOMER, UserRole.DRIVER)
  @ApiOperation({ summary: 'Get my shipments (for customers and drivers)' })
  async getMyShipments(@Query() query: ShipmentQueryDto, @Request() req) {
    if (req.user.role === UserRole.CUSTOMER) {
    
      return this.shipmentsService.getMyShipments(req.user.id, req.user.organizationId, query);
    } else if (req.user.role === UserRole.DRIVER) {
    
      return this.shipmentsService.getMyShipments(req.user.id, req.user.organizationId, query);
    }
  
  
    return this.shipmentsService.findAll(query, req.user.organizationId, req.user.role, req.user.id);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get shipment statistics for the caller organization' })
  async getStats(@Request() req) {
    // Scope to organization; super_admin is also treated as allowed to any organization through role/guard
    return this.shipmentsService.getStats(req.user.organizationId);
  }

  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Track shipment by tracking number (public)' })
  async trackShipment(@Param('trackingNumber') trackingNumber: string) {
    return this.shipmentsService.getTracking(trackingNumber);
  }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER, UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Get shipment by ID' })
    async findOne(@Param('id') id: string, @Request() req) {
      
      if (req.user.role === 'driver') {
        return this.shipmentsService.findOne(id, req.user.organizationId, req.user.role, req.user.id);
      }
      
      return this.shipmentsService.findOne(id, req.user.organizationId, req.user.role, req.user.id);
    }

    @Get('customer/my')
    @Roles(UserRole.SUPER_ADMIN, UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Get my shipments (for customers)' })
    async getCustomerShipments(@Query() query: ShipmentQueryDto, @Request() req) {
      return this.shipmentsService.findByCustomer(req.user.id, req.user.organizationId, query);
    }


    @Get(':id/history')
    @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER, UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Get shipment status history' })
    async getHistory(@Param('id') id: string, @Request() req) {
    
      return this.shipmentsService.getHistory(id, req.user.organizationId, req.user.role, req.user.id);
    }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Update shipment' })
  update(@Param('id') id: string, @Body() updateDto: UpdateShipmentDto, @Request() req) {
    return this.shipmentsService.update(id, updateDto, req.user.organizationId);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
  @ApiOperation({ summary: 'Update shipment status' })
  updateStatus(@Param('id') id: string, @Body() statusDto: UpdateStatusDto, @Request() req) {
    return this.shipmentsService.updateStatus(id, statusDto, req.user.organizationId, req.user.id);
  }

  @Patch(':id/assign-driver/:driverId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Assign driver to shipment' })
  assignDriver(@Param('id') id: string, @Param('driverId') driverId: string, @Request() req) {
    return this.shipmentsService.assignDriver(id, driverId, req.user.organizationId);
  }

  @Patch(':id/assign-vehicle/:vehicleId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Assign vehicle to shipment' })
  assignVehicle(@Param('id') id: string, @Param('vehicleId') vehicleId: string, @Request() req) {
    return this.shipmentsService.assignVehicle(id, vehicleId, req.user.organizationId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete shipment' })
  remove(@Param('id') id: string, @Request() req) {
    return this.shipmentsService.remove(id, req.user.organizationId);
  }
}