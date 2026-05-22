import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { FilterAuditDto } from './dto/filter-audit.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get all audit logs' })
  async findAll(@Query() filters: FilterAuditDto, @Req() req: any): Promise<{
    data: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const organizationId = req.user.organizationId;
    const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;
    
    if (!isSuperAdmin) {
      filters.organizationId = organizationId;
    }
    
    return this.auditService.findAll(filters);
  }

  @Get('user/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get audit logs by user' })
  async findByUser(
    @Param('userId') userId: string,
    @Query() filters: FilterAuditDto,
    @Req() req: any,
  ): Promise<{
    data: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const organizationId = req.user.organizationId;
    const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;
    
    if (!isSuperAdmin) {
      filters.organizationId = organizationId;
    }
    
    return this.auditService.findByUser(userId, filters);
  }

  @Get('entity/:entityType/:entityId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get audit logs by entity' })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() filters: FilterAuditDto,
    @Req() req: any,
  ): Promise<{
    data: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const organizationId = req.user.organizationId;
    const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;
    
    if (!isSuperAdmin) {
      filters.organizationId = organizationId;
    }
    
    return this.auditService.findByEntity(entityType, entityId, filters);
  }

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get activity summary' })
  async getActivitySummary(@Req() req: any): Promise<any> {
    const organizationId = req.user.organizationId;
    const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;
    
    return this.auditService.getActivitySummary(isSuperAdmin ? undefined : organizationId);
  }

  @Get('recent')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get recent activities' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getRecentActivities(
    @Query('limit') limit: number = 20,
    @Req() req: any,
  ): Promise<AuditLogResponseDto[]> {
    const organizationId = req.user.organizationId;
    const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;
    
    return this.auditService.getRecentActivities(limit, isSuperAdmin ? undefined : organizationId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get audit log by ID' })
  async findOne(@Param('id') id: string): Promise<AuditLogResponseDto> {
    return this.auditService.findOne(id);
  }

  @Post('cleanup')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clean up old audit logs (super admin only)' })
  @ApiQuery({ name: 'daysToKeep', required: false, example: 90 })
  async cleanup(@Query('daysToKeep') daysToKeep: number = 90): Promise<{ deletedCount: number; message: string }> {
    const deletedCount = await this.auditService.cleanup(daysToKeep);
    return {
      deletedCount,
      message: `Deleted ${deletedCount} audit logs older than ${daysToKeep} days`,
    };
  }
}