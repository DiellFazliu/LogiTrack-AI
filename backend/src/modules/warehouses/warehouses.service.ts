// src/modules/warehouses/warehouses.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    private auditService: AuditService,
  ) {}

  async create(createDto: CreateWarehouseDto, organizationId: string, userId: string): Promise<Warehouse> {
    const warehouse = this.warehouseRepository.create({
      ...createDto,
      organizationId,
    });
    const savedWarehouse = await this.warehouseRepository.save(warehouse);
    
    // ✅ Audit log for warehouse creation
    await this.auditService.log({
      organizationId,
      userId,
      action: 'CREATE_WAREHOUSE',
      entityType: 'warehouse',
      entityId: savedWarehouse.id,
      newValues: {
        name: savedWarehouse.name,
        address: savedWarehouse.address,
        latitude: savedWarehouse.latitude,
        longitude: savedWarehouse.longitude,
      },
    });
    
    return savedWarehouse;
  }

  async findAll(organizationId: string, userId: string): Promise<Warehouse[]> {
    const warehouses = await this.warehouseRepository.find({
      where: { organizationId, isActive: true },
    });
    
    // ✅ Audit log for viewing warehouses list
    await this.auditService.log({
      organizationId,
      userId,
      action: 'VIEW_WAREHOUSES_LIST',
      entityType: 'warehouse',
      newValues: { count: warehouses.length },
    });
    
    return warehouses;
  }

  async findOne(id: string, organizationId: string, userId: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id, organizationId, isActive: true },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    
    // ✅ Audit log for viewing warehouse details
    await this.auditService.log({
      organizationId,
      userId,
      action: 'VIEW_WAREHOUSE_DETAILS',
      entityType: 'warehouse',
      entityId: warehouse.id,
      newValues: { name: warehouse.name },
    });
    
    return warehouse;
  }

  async update(id: string, updateDto: UpdateWarehouseDto, organizationId: string, userId: string): Promise<Warehouse> {
    const oldWarehouse = await this.findOne(id, organizationId, userId);
    
    const changes: any = {};
    if (updateDto.name !== undefined && updateDto.name !== oldWarehouse.name) {
      changes.name = { old: oldWarehouse.name, new: updateDto.name };
    }
    if (updateDto.address !== undefined && updateDto.address !== oldWarehouse.address) {
      changes.address = { old: oldWarehouse.address, new: updateDto.address };
    }
    if (updateDto.latitude !== undefined && updateDto.latitude !== oldWarehouse.latitude) {
      changes.latitude = { old: oldWarehouse.latitude, new: updateDto.latitude };
    }
    if (updateDto.longitude !== undefined && updateDto.longitude !== oldWarehouse.longitude) {
      changes.longitude = { old: oldWarehouse.longitude, new: updateDto.longitude };
    }
    if (updateDto.capacitySqm !== undefined && updateDto.capacitySqm !== oldWarehouse.capacitySqm) {
      changes.capacitySqm = { old: oldWarehouse.capacitySqm, new: updateDto.capacitySqm };
    }
    if (updateDto.managerName !== undefined && updateDto.managerName !== oldWarehouse.managerName) {
      changes.managerName = { old: oldWarehouse.managerName, new: updateDto.managerName };
    }
    if (updateDto.managerPhone !== undefined && updateDto.managerPhone !== oldWarehouse.managerPhone) {
      changes.managerPhone = { old: oldWarehouse.managerPhone, new: updateDto.managerPhone };
    }
    
    await this.warehouseRepository.update(id, updateDto);
    const updatedWarehouse = await this.findOne(id, organizationId, userId);
    
    if (Object.keys(changes).length > 0) {
      await this.auditService.log({
        organizationId,
        userId,
        action: 'UPDATE_WAREHOUSE',
        entityType: 'warehouse',
        entityId: id,
        oldValues: changes,
        newValues: {
          name: updatedWarehouse.name,
          address: updatedWarehouse.address,
        },
      });
    }
    
    return updatedWarehouse;
  }

  async remove(id: string, organizationId: string, userId: string): Promise<void> {
    const warehouse = await this.findOne(id, organizationId, userId);
    
    // ✅ Audit log for warehouse deletion
    await this.auditService.log({
      organizationId,
      userId,
      action: 'DELETE_WAREHOUSE',
      entityType: 'warehouse',
      entityId: id,
      oldValues: {
        name: warehouse.name,
        address: warehouse.address,
      },
    });
    
    await this.warehouseRepository.update(id, { isActive: false });
  }
}