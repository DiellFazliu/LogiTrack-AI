import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleStatus } from './vehicle.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Create a new vehicle' })
  create(@Body() createDto: CreateVehicleDto, @Request() req) {
    return this.vehiclesService.create(createDto, req.user.organizationId);
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get all vehicles' })
  async findAll(
    @Query('status') status: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Request() req
  ) {
    return this.vehiclesService.findAll(req.user.organizationId, status, +page, +limit);
  }

  @Get('available')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get available vehicles' })
  getAvailable(@Request() req) {
    return this.vehiclesService.getAvailable(req.user.organizationId);
  }

  @Get(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get vehicle by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.vehiclesService.findOne(id, req.user.organizationId);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Update vehicle' })
  update(@Param('id') id: string, @Body() updateDto: UpdateVehicleDto, @Request() req) {
    return this.vehiclesService.update(id, updateDto, req.user.organizationId);
  }

  @Patch(':id/status')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Update vehicle status' })
  updateStatus(@Param('id') id: string, @Body('status') status: VehicleStatus, @Request() req) {
    return this.vehiclesService.updateStatus(id, status, req.user.organizationId);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete vehicle' })
  remove(@Param('id') id: string, @Request() req) {
    return this.vehiclesService.remove(id, req.user.organizationId);
  }
}