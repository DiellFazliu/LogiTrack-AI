import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { Organization, PlanType } from './organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
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
  findAll() {
    return this.orgService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id') id: string) {
    return this.orgService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update organization' })
  update(@Param('id') id: string, @Body() updateData: Partial<Organization>) {
    return this.orgService.update(id, updateData);
  }

  @Patch(':id/plan')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change organization plan' })
  changePlan(@Param('id') id: string, @Body('planType') planType: PlanType) {
    return this.orgService.update(id, { planType });
  }

  @Get(':id/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get users by organization' })
  async getUsersByOrganization(@Param('id') id: string) {
    const organization = await this.orgService.findById(id);
    return organization.users;
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete organization' })
  remove(@Param('id') id: string) {
    return this.orgService.remove(id);
  }
}