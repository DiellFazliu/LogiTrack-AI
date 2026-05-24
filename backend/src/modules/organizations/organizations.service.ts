// src/modules/organizations/organizations.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, PlanType, SubscriptionStatus } from './organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
  ) {}

  async create(createDto: CreateOrganizationDto): Promise<Organization> {
    const organization = this.orgRepository.create({
      ...createDto,
      planType: createDto.planType || PlanType.FREE,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    return this.orgRepository.save(organization);
  }

  async findAll(): Promise<Organization[]> {
    return this.orgRepository.find({
      relations: ['users', 'drivers', 'vehicles', 'warehouses', 'shipments'],
    });
  }

  async findAvailableOrganizations(): Promise<Organization[]> {
    return this.orgRepository.find({
      where: { isActive: true },
      select: ['id', 'name', 'email', 'phone', 'address'],
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({
      where: { id },
      relations: ['users', 'drivers', 'vehicles', 'warehouses', 'shipments'],
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, updateDto: UpdateOrganizationDto): Promise<Organization> {
    await this.findById(id);
    await this.orgRepository.update(id, updateDto);
    return this.findById(id);
  }

  async updatePlan(id: string, planType: PlanType): Promise<Organization> {
    await this.findById(id);
    await this.orgRepository.update(id, { planType });
    return this.findById(id);
  }

  async updateSubscription(id: string, status: SubscriptionStatus): Promise<Organization> {
    await this.findById(id);
    await this.orgRepository.update(id, { subscriptionStatus: status });
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.orgRepository.update(id, { isActive: false });
  }

  async getOrganizationStats(id: string): Promise<any> {
    const organization = await this.findById(id);
    return {
      totalUsers: organization.users?.length || 0,
      totalDrivers: organization.drivers?.length || 0,
      totalVehicles: organization.vehicles?.length || 0,
      totalWarehouses: organization.warehouses?.length || 0,
      totalProducts: 0,
      totalShipments: organization.shipments?.length || 0,
      planType: organization.planType,
      subscriptionStatus: organization.subscriptionStatus,
    };
  }
}