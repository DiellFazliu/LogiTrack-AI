// src/modules/organizations/organizations.controller.ts
import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { Organization, PlanType, SubscriptionStatus } from './organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Driver } from '../drivers/driver.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Shipment, ShipmentStatus } from '../shipments/shipment.entity';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(
    private orgService: OrganizationsService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  create(@Body() createDto: CreateOrganizationDto) {
    return this.orgService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get all organizations (Admin only)' })
  @ApiResponse({ status: 200, description: 'Organizations retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  findAll() {
    return this.orgService.findAll();
  }

  @Get('available')
  @Roles(UserRole.CUSTOMER, UserRole.DRIVER, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get available organizations for customers/drivers/dispatchers' })
  @ApiResponse({ status: 200, description: 'Available organizations retrieved successfully' })
  async getAvailableOrganizations() {
    return this.orgService.findAvailableOrganizations();
  }

  @Get('my-organization')
  @ApiOperation({ summary: 'Get current user organization' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getMyOrganization(@Request() req) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return { message: 'No organization associated with this user' };
    }
    return this.orgService.findById(organizationId);
  }

  @Get('me')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get current user\'s organization' })
  async getMyOrganizationByMe(@Request() req) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return { message: 'User is not associated with an organization' };
    }
    return this.orgService.findById(organizationId);
  }

  @Put('me')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update current user\'s organization' })
  async updateMyOrganizationByMe(@Request() req, @Body() updateDto: UpdateOrganizationDto) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return { message: 'User is not associated with an organization' };
    }
    return this.orgService.update(organizationId, updateDto);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get organization by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(@Param('id') id: string) {
    return this.orgService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update organization (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  update(@Param('id') id: string, @Body() updateDto: UpdateOrganizationDto) {
    return this.orgService.update(id, updateDto);
  }

  @Patch(':id/plan')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change organization plan' })
  @ApiResponse({ status: 200, description: 'Organization plan updated successfully' })
  changePlan(@Param('id') id: string, @Body('planType') planType: PlanType) {
    return this.orgService.updatePlan(id, planType);
  }

  @Patch(':id/subscription')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change organization subscription status' })
  @ApiResponse({ status: 200, description: 'Subscription status updated successfully' })
  changeSubscription(@Param('id') id: string, @Body('status') status: SubscriptionStatus) {
    return this.orgService.updateSubscription(id, status);
  }

  // ✅ ENDPOINT I PËRDITËSUAR PËR STATISTIKA
  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get organization statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Param('id') id: string, @Request() req) {
    // Verifiko që përdoruesi ka të drejtë për këtë organizatë
    if (req.user.role !== UserRole.SUPER_ADMIN && req.user.organizationId !== id) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    const [totalUsers, totalDrivers, totalVehicles, totalShipments, completedShipments, pendingShipments] = await Promise.all([
      this.userRepository.count({ where: { organizationId: id, isActive: true } }),
      this.driverRepository.count({ where: { organizationId: id, isActive: true } }),
      this.vehicleRepository.count({ where: { organizationId: id, isActive: true } }),
      this.shipmentRepository.count({ where: { organizationId: id } }),
      this.shipmentRepository.count({ where: { organizationId: id, status: ShipmentStatus.DELIVERED } }),
      this.shipmentRepository.count({ where: { organizationId: id, status: ShipmentStatus.PENDING } }),
    ]);

    // Llogarit shipment-et në transit
    const inTransitShipments = await this.shipmentRepository.count({ 
      where: { 
        organizationId: id, 
        status: ShipmentStatus.IN_TRANSIT 
      } 
    });

    return {
      totalUsers,
      totalDrivers,
      totalVehicles,
      totalShipments,
      completedShipments,
      pendingShipments,
      inTransitShipments,
    };
  }

  @Get(':id/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get users by organization' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsersByOrganization(@Param('id') id: string) {
    const organization = await this.orgService.findById(id);
    return organization.users;
  }

  @Get(':id/drivers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get drivers by organization' })
  @ApiResponse({ status: 200, description: 'Drivers retrieved successfully' })
  async getDriversByOrganization(@Param('id') id: string) {
    const organization = await this.orgService.findById(id);
    return organization.drivers;
  }

  @Get(':id/vehicles')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get vehicles by organization' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  async getVehiclesByOrganization(@Param('id') id: string) {
    const organization = await this.orgService.findById(id);
    return organization.vehicles;
  }

  @Get(':id/shipments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get shipments by organization' })
  @ApiResponse({ status: 200, description: 'Shipments retrieved successfully' })
  async getShipmentsByOrganization(@Param('id') id: string) {
    const organization = await this.orgService.findById(id);
    return organization.shipments;
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete organization (soft delete)' })
  @ApiResponse({ status: 200, description: 'Organization deleted successfully' })
  remove(@Param('id') id: string) {
    return this.orgService.remove(id);
  }
}