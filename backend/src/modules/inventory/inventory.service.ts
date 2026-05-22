import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, FindOptionsWhere, In } from 'typeorm';
import { Inventory } from './inventory.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { FilterInventoryDto } from './dto/filter-inventory.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { Warehouse } from '../warehouses/warehouse.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  private toResponseDto(inventory: Inventory): InventoryResponseDto {
    return {
      id: inventory.id,
      warehouseId: inventory.warehouseId,
      warehouse: inventory.warehouse ? {
        id: inventory.warehouse.id,
        name: inventory.warehouse.name,
        address: inventory.warehouse.address || '',
      } : undefined,
      productId: inventory.productId,
      product: inventory.product ? {
        id: inventory.product.id,
        sku: inventory.product.sku,
        name: inventory.product.name,
        category: inventory.product.category,
        price: (inventory.product as any).price || 0,
      } : undefined,
      quantity: inventory.quantity,
      reservedQuantity: inventory.reservedQuantity,
      availableQuantity: inventory.availableQuantity,
      minStock: inventory.minStock,
      maxStock: inventory.maxStock,
      reorderPoint: inventory.reorderPoint,
      locationInWarehouse: inventory.locationInWarehouse,
      batchNumber: inventory.batchNumber,
      expiryDate: inventory.expiryDate ? inventory.expiryDate.toISOString() : null,
      notes: inventory.notes,
      isActive: inventory.isActive,
      createdAt: inventory.createdAt,
      updatedAt: inventory.updatedAt,
    };
  }

  private async validateOrganizationAccess(
    warehouseId: string,
    organizationId: string,
  ): Promise<void> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId, organizationId },
    });
    if (!warehouse) {
      throw new ForbiddenException('You do not have access to this warehouse');
    }
  }

  private async validateProductOrganization(productId: string, organizationId: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId, organizationId },
    });
    if (!product) {
      throw new ForbiddenException('You do not have access to this product');
    }
  }

  async create(createInventoryDto: CreateInventoryDto, organizationId: string): Promise<InventoryResponseDto> {
    const { warehouseId, productId } = createInventoryDto;

    await this.validateOrganizationAccess(warehouseId, organizationId);
    await this.validateProductOrganization(productId, organizationId);

    const existing = await this.inventoryRepository.findOne({
      where: { warehouseId, productId },
    });
    if (existing) {
      throw new ConflictException('Inventory already exists for this warehouse and product');
    }

    const quantity = createInventoryDto.quantity || 0;
    const inventory = this.inventoryRepository.create({
      ...createInventoryDto,
      quantity,
      reservedQuantity: 0,
      availableQuantity: quantity,
    });

    const savedInventory = await this.inventoryRepository.save(inventory);
    return this.toResponseDto(savedInventory);
  }

  async findAll(
    filters: FilterInventoryDto,
    organizationId: string,
  ): Promise<{ data: InventoryResponseDto[]; total: number; page: number; limit: number }> {
    const {
      warehouseId,
      productId,
      search,
      lowStock,
      outOfStock,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'DESC',
    } = filters;

    const warehouses = await this.warehouseRepository.find({
      where: { organizationId },
      select: ['id'],
    });
    const warehouseIds = warehouses.map((w) => w.id);

    const where: FindOptionsWhere<Inventory> = {
      warehouseId: In(warehouseIds),
    };

    if (warehouseId) where.warehouseId = warehouseId;
    if (productId) where.productId = productId;
    if (isActive !== undefined) where.isActive = isActive;

    if (lowStock) {
      where.quantity = LessThanOrEqual(5);
    }

    if (outOfStock) {
      where.quantity = 0;
    }

    const [data, total] = await this.inventoryRepository.findAndCount({
      where,
      relations: ['warehouse', 'product'],
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: order },
    });

    let filteredData = data;
    if (search) {
      filteredData = data.filter(
        (item) =>
          item.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
          item.product?.sku?.toLowerCase().includes(search.toLowerCase()) ||
          item.warehouse?.name?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return {
      data: filteredData.map(item => this.toResponseDto(item)),
      total: filteredData.length,
      page,
      limit,
    };
  }

  async findOne(id: string, organizationId: string): Promise<InventoryResponseDto> {
    const warehouses = await this.warehouseRepository.find({
      where: { organizationId },
      select: ['id'],
    });
    const warehouseIds = warehouses.map((w) => w.id);

    const inventory = await this.inventoryRepository.findOne({
      where: { id, warehouseId: In(warehouseIds) },
      relations: ['warehouse', 'product'],
    });
    if (!inventory) throw new NotFoundException(`Inventory with ID ${id} not found`);
    return this.toResponseDto(inventory);
  }

  async findByWarehouse(warehouseId: string, organizationId: string): Promise<InventoryResponseDto[]> {
    await this.validateOrganizationAccess(warehouseId, organizationId);

    const inventory = await this.inventoryRepository.find({
      where: { warehouseId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
    return inventory.map(item => this.toResponseDto(item));
  }

  async findByProduct(productId: string, organizationId: string): Promise<InventoryResponseDto[]> {
    await this.validateProductOrganization(productId, organizationId);

    const warehouses = await this.warehouseRepository.find({
      where: { organizationId },
      select: ['id'],
    });
    const warehouseIds = warehouses.map((w) => w.id);

    const inventory = await this.inventoryRepository.find({
      where: { productId, warehouseId: In(warehouseIds) },
      relations: ['warehouse'],
      order: { createdAt: 'DESC' },
    });
    return inventory.map(item => this.toResponseDto(item));
  }

  async update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
    organizationId: string,
  ): Promise<InventoryResponseDto> {
    let inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['warehouse', 'product'],
    });
    if (!inventory) throw new NotFoundException(`Inventory with ID ${id} not found`);

    const warehouse = await this.warehouseRepository.findOne({
      where: { id: inventory.warehouseId, organizationId },
    });
    if (!warehouse) throw new ForbiddenException('You do not have access to this inventory');

    if (updateInventoryDto.warehouseId) {
      await this.validateOrganizationAccess(updateInventoryDto.warehouseId, organizationId);
    }

    if (updateInventoryDto.productId) {
      await this.validateProductOrganization(updateInventoryDto.productId, organizationId);
    }

    if (updateInventoryDto.quantity !== undefined) {
      updateInventoryDto.availableQuantity = updateInventoryDto.quantity - (inventory.reservedQuantity || 0);
    }

    Object.assign(inventory, updateInventoryDto);
    const savedInventory = await this.inventoryRepository.save(inventory);
    return this.toResponseDto(savedInventory);
  }

  async updateStock(movementDto: StockMovementDto, organizationId: string): Promise<InventoryResponseDto> {
    const { inventoryId, quantity, reason, movementType = 'IN' } = movementDto;
    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId },
      relations: ['warehouse', 'product'],
    });
    if (!inventory) throw new NotFoundException(`Inventory with ID ${inventoryId} not found`);

    const warehouse = await this.warehouseRepository.findOne({
      where: { id: inventory.warehouseId, organizationId },
    });
    if (!warehouse) throw new ForbiddenException('You do not have access to this inventory');

    switch (movementType) {
      case 'IN':
        inventory.quantity += quantity;
        inventory.availableQuantity = inventory.quantity - inventory.reservedQuantity;
        inventory.lastRestocked = new Date();
        break;
      case 'OUT':
        if (inventory.quantity < quantity) {
          throw new BadRequestException('Insufficient stock');
        }
        inventory.quantity -= quantity;
        inventory.availableQuantity = inventory.quantity - inventory.reservedQuantity;
        break;
      case 'RESERVE':
        if (inventory.availableQuantity < quantity) {
          throw new BadRequestException('Insufficient available stock');
        }
        inventory.reservedQuantity += quantity;
        inventory.availableQuantity = inventory.quantity - inventory.reservedQuantity;
        break;
      case 'RELEASE':
        if (inventory.reservedQuantity < quantity) {
          throw new BadRequestException('Insufficient reserved stock');
        }
        inventory.reservedQuantity -= quantity;
        inventory.availableQuantity = inventory.quantity - inventory.reservedQuantity;
        break;
      default:
        throw new BadRequestException('Invalid movement type');
    }

    const savedInventory = await this.inventoryRepository.save(inventory);
    return this.toResponseDto(savedInventory);
  }

  async reserveStock(inventoryId: string, quantity: number, organizationId: string): Promise<InventoryResponseDto> {
    return this.updateStock(
      {
        inventoryId,
        quantity,
        movementType: 'RESERVE',
        reason: 'Order reservation',
      },
      organizationId,
    );
  }

  async releaseStock(inventoryId: string, quantity: number, organizationId: string): Promise<InventoryResponseDto> {
    return this.updateStock(
      {
        inventoryId,
        quantity,
        movementType: 'RELEASE',
        reason: 'Order cancelled',
      },
      organizationId,
    );
  }

  async addStock(
    inventoryId: string,
    quantity: number,
    reason: string,
    organizationId: string,
  ): Promise<InventoryResponseDto> {
    return this.updateStock(
      {
        inventoryId,
        quantity,
        movementType: 'IN',
        reason,
      },
      organizationId,
    );
  }

  async removeStock(
    inventoryId: string,
    quantity: number,
    reason: string,
    organizationId: string,
  ): Promise<InventoryResponseDto> {
    return this.updateStock(
      {
        inventoryId,
        quantity,
        movementType: 'OUT',
        reason,
      },
      organizationId,
    );
  }

  async getLowStockItems(organizationId: string): Promise<InventoryResponseDto[]> {
    const warehouses = await this.warehouseRepository.find({
      where: { organizationId },
      select: ['id'],
    });
    const warehouseIds = warehouses.map((w) => w.id);

    const inventory = await this.inventoryRepository.find({
      where: {
        warehouseId: In(warehouseIds),
        quantity: LessThanOrEqual(5),
      },
      relations: ['warehouse', 'product'],
      order: { quantity: 'ASC' },
    });
    return inventory.map(item => this.toResponseDto(item));
  }

  async getStockSummary(organizationId: string): Promise<any> {
    const warehouses = await this.warehouseRepository.find({
      where: { organizationId },
      select: ['id'],
    });
    const warehouseIds = warehouses.map((w) => w.id);

    const inventory = await this.inventoryRepository.find({
      where: { warehouseId: In(warehouseIds) },
      relations: ['product'],
    });

    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = inventory.reduce(
      (sum, item) => sum + ((item.product as any)?.price || 0) * item.quantity,
      0,
    );
    const lowStockCount = inventory.filter((item) => item.quantity <= item.reorderPoint).length;
    const outOfStockCount = inventory.filter((item) => item.quantity === 0).length;

    return {
      totalQuantity,
      totalValue,
      lowStockCount,
      outOfStockCount,
      totalProducts: inventory.length,
      byWarehouse: await this.getStockByWarehouse(warehouseIds),
    };
  }

  private async getStockByWarehouse(warehouseIds: string[]): Promise<any[]> {
    const result: any[] = [];
    for (const warehouseId of warehouseIds) {
      const items = await this.inventoryRepository.find({
        where: { warehouseId },
        relations: ['warehouse'],
      });
      result.push({
        warehouseId,
        warehouseName: items[0]?.warehouse?.name,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        itemCount: items.length,
      });
    }
    return result;
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
    });
    if (!inventory) throw new NotFoundException(`Inventory with ID ${id} not found`);

    const warehouse = await this.warehouseRepository.findOne({
      where: { id: inventory.warehouseId, organizationId },
    });
    if (!warehouse) throw new ForbiddenException('You do not have access to this inventory');

    await this.inventoryRepository.remove(inventory);
  }
}