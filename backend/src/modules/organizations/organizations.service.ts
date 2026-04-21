import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, PlanType, SubscriptionStatus } from './organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
  ) {}

  async create(data: Partial<Organization>): Promise<Organization> {
    const organization = this.orgRepository.create({
      ...data,
      planType: PlanType.FREE,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    return this.orgRepository.save(organization);
  }

  async findAll(): Promise<Organization[]> {
    return this.orgRepository.find({ relations: ['users'] });
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({
      where: { id },
      relations: ['users'],
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, updateData: Partial<Organization>): Promise<Organization> {
    await this.orgRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.orgRepository.delete(id);
  }
}