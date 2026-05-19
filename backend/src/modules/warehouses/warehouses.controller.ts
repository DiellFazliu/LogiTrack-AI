import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Warehouses')
@ApiBearerAuth()
@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesController {
  constructor(private warehousesService: WarehousesService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Create a new warehouse' })
  create(@Body() createDto: CreateWarehouseDto, @Request() req) {
    return this.warehousesService.create(createDto, req.user.organizationId);
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get all warehouses' })
  findAll(@Request() req) {
    return this.warehousesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Get warehouse by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.warehousesService.findOne(id, req.user.organizationId);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Update warehouse' })
  update(@Param('id') id: string, @Body() updateDto: UpdateWarehouseDto, @Request() req) {
    return this.warehousesService.update(id, updateDto, req.user.organizationId);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete warehouse' })
  remove(@Param('id') id: string, @Request() req) {
    return this.warehousesService.remove(id, req.user.organizationId);
  }
}