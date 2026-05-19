import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
  ) {}

  async create(createDto: CreateWarehouseDto, organizationId: string): Promise<Warehouse> {
    const warehouse = this.warehouseRepository.create({
      ...createDto,
      organizationId,
    });
    return this.warehouseRepository.save(warehouse);
  }

  async findAll(organizationId: string): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      where: { organizationId, isActive: true },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id, organizationId },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  async update(id: string, updateDto: UpdateWarehouseDto, organizationId: string): Promise<Warehouse> {
    await this.findOne(id, organizationId);
    await this.warehouseRepository.update(id, updateDto);
    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findOne(id, organizationId);
    await this.warehouseRepository.update(id, { isActive: false });
  }
}