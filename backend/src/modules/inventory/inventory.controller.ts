import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { FilterInventoryDto } from './dto/filter-inventory.dto';
import { BulkStockMovementDto } from './dto/stock-movement.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create new inventory record' })
  @ApiResponse({ status: 201, type: InventoryResponseDto })
  async create(@Body() createInventoryDto: CreateInventoryDto, @Req() req: any): Promise<InventoryResponseDto> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.create(createInventoryDto, organizationId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get all inventory records' })
  async findAll(@Query() filters: FilterInventoryDto, @Req() req: any): Promise<{
    data: InventoryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.findAll(filters, organizationId);
  }

  @Get('warehouse/:warehouseId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get inventory by warehouse' })
  async findByWarehouse(@Param('warehouseId') warehouseId: string, @Req() req: any): Promise<InventoryResponseDto[]> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.findByWarehouse(warehouseId, organizationId);
  }

  @Get('product/:productId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get inventory by product' })
  async findByProduct(@Param('productId') productId: string, @Req() req: any): Promise<InventoryResponseDto[]> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.findByProduct(productId, organizationId);
  }

  @Get('low-stock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get low stock items' })
  async getLowStockItems(@Req() req: any): Promise<InventoryResponseDto[]> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.getLowStockItems(organizationId);
  }

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get stock summary' })
  async getStockSummary(@Req() req: any): Promise<any> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.getStockSummary(organizationId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get inventory by ID' })
  async findOne(@Param('id') id: string, @Req() req: any): Promise<InventoryResponseDto> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.findOne(id, organizationId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update inventory' })
  async update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @Req() req: any,
  ): Promise<InventoryResponseDto> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.update(id, updateInventoryDto, organizationId);
  }

  @Post(':id/add-stock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add stock' })
  async addStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Body('reason') reason: string,
    @Req() req: any,
  ): Promise<InventoryResponseDto> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.addStock(id, quantity, reason, organizationId);
  }

  @Post(':id/remove-stock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove stock' })
  async removeStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Body('reason') reason: string,
    @Req() req: any,
  ): Promise<InventoryResponseDto> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.removeStock(id, quantity, reason, organizationId);
  }

  @Post(':id/reserve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reserve stock' })
  async reserveStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Req() req: any,
  ): Promise<InventoryResponseDto> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.reserveStock(id, quantity, organizationId);
  }

  @Post(':id/release')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release reserved stock' })
  async releaseStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Req() req: any,
  ): Promise<InventoryResponseDto> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.releaseStock(id, quantity, organizationId);
  }

  @Post('bulk/movement')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk stock movements' })
  async bulkStockMovement(
    @Body() bulkMovementDto: BulkStockMovementDto,
    @Req() req: any,
  ): Promise<{
    success: boolean;
    results: InventoryResponseDto[];
    errors: any[];
  }> {
    const organizationId = req.user?.organizationId;
    const results: InventoryResponseDto[] = [];
    const errors: any[] = [];

    for (const movement of bulkMovementDto.movements) {
      try {
        const result = await this.inventoryService.updateStock(movement, organizationId);
        results.push(result);
      } catch (error: any) {
        errors.push({ movement, error: error.message });
      }
    }

    return { success: errors.length === 0, results, errors };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete inventory' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const organizationId = req.user?.organizationId;
    return this.inventoryService.remove(id, organizationId);
  }
}