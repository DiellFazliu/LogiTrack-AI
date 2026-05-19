// src/modules/drivers/drivers.controller.ts
import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverStatus } from './driver.entity';  // ✅ Shto importin e enum-it
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Drivers')
@ApiBearerAuth()
@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(private driversService: DriversService) {}

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
  findAll(@Query('status') status: DriverStatus, @Request() req) {  // ✅ Ndrysho string → DriverStatus
    return this.driversService.findAll(req.user.organizationId, status);
  }

  @Get('available')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get available drivers' })
  getAvailable(@Request() req) {
    return this.driversService.getAvailable(req.user.organizationId);
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
  updateStatus(@Param('id') id: string, @Body('status') status: DriverStatus, @Request() req) {  // ✅ Ndrysho string → DriverStatus
    return this.driversService.updateStatus(id, status, req.user.organizationId);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete driver' })
  remove(@Param('id') id: string, @Request() req) {
    return this.driversService.remove(id, req.user.organizationId);
  }
}