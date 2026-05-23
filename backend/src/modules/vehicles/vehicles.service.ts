import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus } from './vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(createDto: CreateVehicleDto, organizationId: string): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create({
      ...createDto,
      organizationId,
    });
    return this.vehicleRepository.save(vehicle);
  }

  async findAll(organizationId: string, status?: string, page = 1, limit = 20) {
  const where: any = { organizationId };
  if (status) where.status = status;
  const [data, total] = await this.vehicleRepository.findAndCount({
    where,
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' },
  });
  return { data, total, page, limit };
  }

  async findOne(id: string, organizationId: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id, organizationId },
      relations: ['organization', 'shipments'],
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async update(id: string, updateDto: UpdateVehicleDto, organizationId: string): Promise<Vehicle> {
    await this.findOne(id, organizationId);
    await this.vehicleRepository.update(id, updateDto);
    return this.findOne(id, organizationId);
  }

  async updateStatus(id: string, status: VehicleStatus, organizationId: string): Promise<Vehicle> {
    await this.findOne(id, organizationId);
    await this.vehicleRepository.update(id, { status });
    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.findOne(id, organizationId);
    await this.vehicleRepository.delete(id);
  }

  async getAvailable(organizationId: string): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { organizationId, status: VehicleStatus.AVAILABLE, isActive: true },
    });
  }
}