// src/modules/drivers/drivers.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './driver.entity';  // ✅ Shto DriverStatus enum
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async create(createDto: CreateDriverDto, organizationId: string): Promise<Driver> {
    const driver = this.driverRepository.create({
      ...createDto,
      organizationId,
    });
    return this.driverRepository.save(driver);
  }

  async findAll(organizationId: string, status?: DriverStatus): Promise<Driver[]> {  // ✅ Ndrysho string → DriverStatus
    const where: any = { organizationId };
    if (status) where.status = status;
    
    return this.driverRepository.find({
      where,
      relations: ['user', 'organization'],
    });
  }

  async findOne(id: string, organizationId: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id, organizationId },
      relations: ['user', 'organization', 'shipments'],
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async update(id: string, updateDto: UpdateDriverDto, organizationId: string): Promise<Driver> {
    await this.findOne(id, organizationId);
    await this.driverRepository.update(id, updateDto);
    return this.findOne(id, organizationId);
  }

  async updateStatus(id: string, status: DriverStatus, organizationId: string): Promise<Driver> {  // ✅ Ndrysho string → DriverStatus
    await this.findOne(id, organizationId);
    await this.driverRepository.update(id, { status });
    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findOne(id, organizationId);
    await this.driverRepository.delete(id);
  }

  async getAvailable(organizationId: string): Promise<Driver[]> {
    return this.driverRepository.find({
      where: { 
        organizationId, 
        status: DriverStatus.AVAILABLE,  // ✅ Përdor enum, jo string 'available'
        isActive: true 
      },
    });
  }
}