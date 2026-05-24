// src/modules/users/users.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  async findAll(organizationId?: string): Promise<User[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.userRepository.find({
      where,
      select: ['id', 'email', 'name', 'phone', 'roles', 'organizationId', 'isActive', 'createdAt'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'phone', 'roles', 'organizationId', 'isActive', 'createdAt'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(
    id: string, 
    updateData: Partial<User>, 
    organizationId?: string, 
    requesterRole?: string, 
    requesterId?: string
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Kontrollo autorizimin
    if (requesterRole !== 'super_admin' && user.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have permission to update this user');
    }

    const oldValues = {
      name: user.name,
      phone: user.phone,
      email: user.email,
    };

    await this.userRepository.update(id, updateData);
    const updatedUser = await this.findById(id);

    // ✅ Audit log for user update
    await this.auditService.log({
      organizationId: user.organizationId,
      userId: requesterId,
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: id,
      oldValues,
      newValues: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
      },
    });

    return updatedUser;
  }

  async remove(id: string, organizationId?: string, requesterRole?: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requesterRole !== 'super_admin' && user.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have permission to delete this user');
    }

    await this.userRepository.update(id, { isActive: false });
  }

  async toggleStatus(id: string, isActive: boolean, organizationId?: string, requesterRole?: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requesterRole !== 'super_admin' && user.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have permission to update this user');
    }

    await this.userRepository.update(id, { isActive });
    return this.findById(id);
  }

  async findByIdWithRoles(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}