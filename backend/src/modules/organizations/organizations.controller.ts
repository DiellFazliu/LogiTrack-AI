// src/modules/organizations/organizations.controller.ts
import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { Organization, PlanType, SubscriptionStatus } from './organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private orgService: OrganizationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateOrganizationDto })
  create(@Body() createDto: CreateOrganizationDto) {
    return this.orgService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiResponse({ status: 200, description: 'Organizations retrieved successfully' })
  findAll() {
    return this.orgService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(@Param('id') id: string) {
    return this.orgService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
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

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get organization statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStats(@Param('id') id: string) {
    return this.orgService.getOrganizationStats(id);
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
  async getDriversByOrganization(@Param('id') id: string) {
    const organization = await this.orgService.findById(id);
    return organization.drivers;
  }

  @Get(':id/vehicles')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get vehicles by organization' })
  async getVehiclesByOrganization(@Param('id') id: string) {
    const organization = await this.orgService.findById(id);
    return organization.vehicles;
  }

  @Get(':id/shipments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get shipments by organization' })
  async getShipmentsByOrganization(@Param('id') id: string) {
    const organization = await this.orgService.findById(id);
    return organization.shipments;
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete organization' })
  @ApiResponse({ status: 200, description: 'Organization deleted successfully' })
  remove(@Param('id') id: string) {
    return this.orgService.remove(id);
  }
}