import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, ILike, In } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { FilterAuditDto } from './dto/filter-audit.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private async toResponseDto(auditLog: AuditLog): Promise<AuditLogResponseDto> {
    let userName: string | undefined;
    if (auditLog.userId) {
      const user = await this.userRepository.findOne({
        where: { id: auditLog.userId },
        select: ['name', 'email'],
      });
      userName = user?.name || user?.email;
    }

    return {
      id: auditLog.id,
      organizationId: auditLog.organizationId,
      userId: auditLog.userId,
      userName,
      action: auditLog.action,
      method: auditLog.method,
      url: auditLog.url,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      oldValues: auditLog.oldValues,
      newValues: auditLog.newValues,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      statusCode: auditLog.statusCode,
      responseTimeMs: auditLog.responseTimeMs,
      errorMessage: auditLog.errorMessage,
      createdAt: auditLog.createdAt,
    };
  }

  async log(createDto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    const auditLog = this.auditRepository.create(createDto);
    const savedLog = await this.auditRepository.save(auditLog);
    return this.toResponseDto(savedLog);
  }

  async findAll(filters: FilterAuditDto): Promise<{
    data: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      userId,
      organizationId,
      action,
      entityType,
      entityId,
      method,
      actions,
      fromDate,
      toDate,
      statusCode,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      order = 'DESC',
    } = filters;

    const where: FindOptionsWhere<AuditLog> = {};

    if (userId) where.userId = userId;
    if (organizationId) where.organizationId = organizationId;
    if (action) where.action = ILike(`%${action}%`);
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (method) where.method = method;
    if (actions) where.action = In(actions);
    if (statusCode) where.statusCode = statusCode;

    if (fromDate && toDate) {
      where.createdAt = Between(new Date(fromDate), new Date(toDate));
    }

    const [data, total] = await this.auditRepository.findAndCount({
      where,
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: order },
    });

    const responseData = await Promise.all(data.map(item => this.toResponseDto(item)));

    return {
      data: responseData,
      total,
      page,
      limit,
    };
  }

  async findByUser(userId: string, filters: FilterAuditDto): Promise<{
    data: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findAll({ ...filters, userId });
  }

  async findByEntity(entityType: string, entityId: string, filters: FilterAuditDto): Promise<{
    data: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findAll({ ...filters, entityType, entityId });
  }

  async findOne(id: string): Promise<AuditLogResponseDto> {
    const auditLog = await this.auditRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!auditLog) {
      throw new Error(`Audit log with ID ${id} not found`);
    }
    return this.toResponseDto(auditLog);
  }

  async getActivitySummary(organizationId?: string): Promise<any> {
    const where: FindOptionsWhere<AuditLog> = {};
    if (organizationId) where.organizationId = organizationId;

    const totalLogs = await this.auditRepository.count({ where });
    const uniqueUsers = await this.auditRepository
      .createQueryBuilder('audit')
      .select('COUNT(DISTINCT audit.user_id)', 'count')
      .where(organizationId ? 'audit.organization_id = :orgId' : '1=1', { orgId: organizationId })
      .getRawOne();

    const actionsByType = await this.auditRepository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where(organizationId ? 'audit.organization_id = :orgId' : '1=1', { orgId: organizationId })
      .groupBy('audit.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const activityByDay = await this.auditRepository
      .createQueryBuilder('audit')
      .select('DATE(audit.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where(organizationId ? 'audit.organization_id = :orgId' : '1=1', { orgId: organizationId })
      .andWhere("audit.created_at >= NOW() - INTERVAL '7 days'")
      .groupBy('DATE(audit.created_at)')
      .orderBy('date', 'DESC')
      .getRawMany();

    const entityTypes = await this.auditRepository
      .createQueryBuilder('audit')
      .select('audit.entity_type', 'entityType')
      .addSelect('COUNT(*)', 'count')
      .where(organizationId ? 'audit.organization_id = :orgId' : '1=1', { orgId: organizationId })
      .andWhere('audit.entity_type IS NOT NULL')
      .groupBy('audit.entity_type')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const methods = await this.auditRepository
      .createQueryBuilder('audit')
      .select('audit.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .where(organizationId ? 'audit.organization_id = :orgId' : '1=1', { orgId: organizationId })
      .groupBy('audit.method')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      totalLogs,
      uniqueUsers: parseInt(uniqueUsers?.count || '0'),
      actionsByType,
      activityByDay,
      entityTypes,
      methods,
    };
  }

  async getRecentActivities(limit: number = 20, organizationId?: string): Promise<AuditLogResponseDto[]> {
    const where: FindOptionsWhere<AuditLog> = {};
    if (organizationId) where.organizationId = organizationId;

    const logs = await this.auditRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return Promise.all(logs.map(item => this.toResponseDto(item)));
  }

  async cleanup(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}