// src/modules/users/users.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: string, organizationId?: string, userRole?: string): Promise<User> {
    const where: any = { id };
    if (organizationId && userRole !== 'super_admin') {
      where.organizationId = organizationId;
    }
    
    const user = await this.userRepository.findOne({
      where,
      relations: ['organization', 'roles'],
    });
    
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll(organizationId?: string): Promise<User[]> {
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    
    return this.userRepository.find({
      where,
      relations: ['organization', 'roles'],
    });
  }

  async update(id: string, updateData: Partial<User>, organizationId?: string, userRole?: string, updatedBy?: string): Promise<User> {
    const user = await this.findById(id, organizationId, userRole);
    
    if (updateData.organizationId && userRole !== 'super_admin') {
      throw new ForbiddenException('Cannot change organization');
    }
    
    // ✅ Përditëso last_updated_by
    if (updatedBy) {
      updateData.lastUpdatedBy = updatedBy;
    }
    
    await this.userRepository.update(id, updateData);
    return this.findById(id, organizationId, userRole);
  }

  async remove(id: string, organizationId?: string, userRole?: string): Promise<void> {
    await this.findById(id, organizationId, userRole);
    await this.userRepository.delete(id);
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    return user?.roles?.map(role => role.name) || [];
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });
    
    const permissions: string[] = [];
    user?.roles?.forEach(role => {
      role.permissions?.forEach(permission => {
        permissions.push(`${permission.resource}:${permission.action}`);
      });
    });
    
    return [...new Set(permissions)];
  }
}
