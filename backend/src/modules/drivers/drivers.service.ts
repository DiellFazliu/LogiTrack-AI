// src/modules/drivers/drivers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './driver.entity';
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
      status: DriverStatus.AVAILABLE,
      isActive: true,
      totalDeliveries: 0,
      rating: 0,
    });
    return this.driverRepository.save(driver);
  }

  async findAll(organizationId: string, status?: DriverStatus): Promise<Driver[]> {
    const where: any = { organizationId, isActive: true };
    if (status) where.status = status;
    
    return this.driverRepository.find({
      where,
      relations: ['user', 'organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id, organizationId, isActive: true },
      relations: ['user', 'organization', 'shipments'],
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }
      // src/modules/drivers/drivers.service.ts
    async findByUserId(userId: string): Promise<Driver | null> {
      return this.driverRepository.findOne({
        where: { userId: userId, isActive: true },
      });
    }

  async update(id: string, updateDto: UpdateDriverDto, organizationId: string): Promise<Driver> {
    await this.findOne(id, organizationId);
    await this.driverRepository.update(id, updateDto);
    return this.findOne(id, organizationId);
  }

  async updateStatus(id: string, status: DriverStatus, organizationId: string): Promise<Driver> {
    await this.findOne(id, organizationId);
    await this.driverRepository.update(id, { status });
    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findOne(id, organizationId);
    await this.driverRepository.update(id, { isActive: false });
  }

  // ✅ Rregullo getAvailable për të marrë emrin dhe email-in nga User
  async getAvailable(organizationId: string): Promise<any[]> {
    const drivers = await this.driverRepository.find({
      where: { 
        organizationId, 
        status: DriverStatus.AVAILABLE,
        isActive: true 
      },
      relations: ['user'], // Join me tabelën users
      order: { createdAt: 'DESC' },
    });

    // Transformo të dhënat për të përfshirë emrin dhe email-in nga user
    return drivers.map(driver => ({
      id: driver.id,
      name: driver.user?.name || 'N/A',
      email: driver.user?.email || 'N/A',
      phone: driver.phone,
      status: driver.status,
      totalDeliveries: driver.totalDeliveries,
      rating: driver.rating,
      licenseNumber: driver.licenseNumber,
    }));
  }
}