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
import { AuditService } from '../audit/audit.service';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(
    private orgService: OrganizationsService,
    private auditService: AuditService,
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
  async create(@Body() createDto: CreateOrganizationDto, @Request() req) {
    const org = await this.orgService.create(createDto);
    await this.auditService.log({
      organizationId: org.id,
      userId: req.user.id,
      action: 'CREATE_ORGANIZATION',
      entityType: 'organization',
      entityId: org.id,
      newValues: { name: org.name, email: org.email, planType: org.planType },
    });
    return org;
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  findAll() {
    return this.orgService.findAll();
  }

  @Get('available')
  @Roles(UserRole.CUSTOMER, UserRole.DRIVER, UserRole.DISPATCHER)
  getAvailableOrganizations() {
    return this.orgService.findAvailableOrganizations();
  }

  @Get('my-organization')
  async getMyOrganization(@Request() req) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return { message: 'No organization associated with this user' };
    }
    return this.orgService.findById(organizationId);
  }

  @Get('me')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getMyOrganizationByMe(@Request() req) {
    console.log('=== GET /organizations/me ===');
    console.log('User ID:', req.user?.id);
    console.log('Organization ID:', req.user?.organizationId);
    
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return { message: 'User is not associated with an organization' };
    }
    
    const org = await this.orgService.findById(organizationId);
    console.log('Organization found:', org?.id, org?.name);
    
    await this.auditService.log({
      organizationId,
      userId: req.user.id,
      action: 'VIEW_ORGANIZATION',
      entityType: 'organization',
      entityId: organizationId,
      newValues: { name: org.name },
    });
    
    return org;
  }

  @Put('me')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async updateMyOrganizationByMe(@Request() req, @Body() updateDto: UpdateOrganizationDto) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return { message: 'User is not associated with an organization' };
    }
    
    const oldOrg = await this.orgService.findById(organizationId);
    const updated = await this.orgService.update(organizationId, updateDto);
    
    const changes: any = {};
    if (updateDto.name && updateDto.name !== oldOrg.name) changes.name = { old: oldOrg.name, new: updateDto.name };
    if (updateDto.email && updateDto.email !== oldOrg.email) changes.email = { old: oldOrg.email, new: updateDto.email };
    if (updateDto.phone && updateDto.phone !== oldOrg.phone) changes.phone = { old: oldOrg.phone, new: updateDto.phone };
    if (updateDto.address && updateDto.address !== oldOrg.address) changes.address = { old: oldOrg.address, new: updateDto.address };
    
    await this.auditService.log({
      organizationId,
      userId: req.user.id,
      action: 'UPDATE_ORGANIZATION',
      entityType: 'organization',
      entityId: organizationId,
      oldValues: changes,
      newValues: { name: updated.name, email: updated.email },
    });
    
    return updated;
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  findOne(@Param('id') id: string) {
    return this.orgService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateDto: UpdateOrganizationDto) {
    return this.orgService.update(id, updateDto);
  }

  @Patch(':id/plan')
  @Roles(UserRole.SUPER_ADMIN)
  changePlan(@Param('id') id: string, @Body('planType') planType: PlanType) {
    return this.orgService.updatePlan(id, planType);
  }

  @Patch(':id/subscription')
  @Roles(UserRole.SUPER_ADMIN)
  changeSubscription(@Param('id') id: string, @Body('status') status: SubscriptionStatus) {
    return this.orgService.updateSubscription(id, status);
  }

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getStats(@Param('id') id: string, @Request() req) {
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
    const inTransitShipments = await this.shipmentRepository.count({ where: { organizationId: id, status: ShipmentStatus.IN_TRANSIT } });
    return { totalUsers, totalDrivers, totalVehicles, totalShipments, completedShipments, pendingShipments, inTransitShipments };
  }

  @Get(':id/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getUsersByOrganization(@Param('id') id: string) {
    const organization = await this.orgService.findById(id);
    return organization.users;
  }

  @Get(':id/drivers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getDriversByOrganization(@Param('id') id: string) {
    const organization = await this.orgService.findById(id);
    return organization.drivers;
  }

  @Get(':id/vehicles')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getVehiclesByOrganization(@Param('id') id: string) {
    const organization = await this.orgService.findById(id);
    return organization.vehicles;
  }

  @Get(':id/shipments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getShipmentsByOrganization(@Param('id') id: string) {
    const organization = await this.orgService.findById(id);
    return organization.shipments;
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.orgService.remove(id);
  }
}