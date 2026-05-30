// src/modules/reports/reports.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Delete,
  Put,
  Query,
  UseGuards,
  Request,
  ForbiddenException, 
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  // ==================== CRUD OPERATIONS ====================

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 200, description: 'Report created successfully' })
  async createReport(@Body() body: any, @Request() req) {
    return this.reportsService.createReport(
      body.type,
      body.title,
      body.data,
      req.user.organizationId,
      req.user.id, // ✅ Shto userId
    );
  }

  @Get(':id/download')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Download report file' })
  async downloadReport(@Param('id') id: string, @Request() req, @Res() res: Response) {
    const report = await this.reportsService.getReport(id, req.user.organizationId);
    
    if (!report.fileUrl) {
      const jsonData = JSON.stringify(report.data, null, 2);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=report_${report.id}.json`);
      return res.send(jsonData);
    }
    
    return res.download(report.fileUrl);
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all reports for organization' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getAllReports(@Request() req) {
    return this.reportsService.getReportsByOrganization(
      req.user.organizationId,
      req.user.id, // ✅ Shto userId
    );
  }

  @Get(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  async getReport(@Param('id') id: string, @Request() req) {
    return this.reportsService.getReport(id, req.user.organizationId);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a report' })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  async updateReport(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.reportsService.updateReport(
      id,
      req.user.organizationId,
      req.user.id, // ✅ Shto userId
      body.title,
      body.data,
      body.fileUrl,
    );
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a report' })
  @ApiResponse({ status: 200, description: 'Report deleted successfully' })
  async deleteReport(@Param('id') id: string, @Request() req) {
    await this.reportsService.deleteReport(
      id,
      req.user.organizationId,
      req.user.id, // ✅ Shto userId
    );
    return { message: 'Report deleted successfully' };
  }

  // ==================== DASHBOARD STATS ====================

  @Get('dashboard/:organizationId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats(@Param('organizationId') organizationId: string, @Request() req) {
    if (req.user.role !== UserRole.SUPER_ADMIN && req.user.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have access to this organization');
    }
    return this.reportsService.getDashboardStats(
      organizationId,
      req.user.id, // ✅ Shto userId
    );
  }

  // ==================== DAILY REPORTS ====================

  @Post('daily/:organizationId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Generate daily report' })
  @ApiResponse({ status: 200, description: 'Daily report generated successfully' })
  async generateDailyReport(
    @Param('organizationId') organizationId: string,
    @Body('date') date: string,
    @Request() req,
  ) {
    if (req.user.role !== UserRole.SUPER_ADMIN && req.user.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have access to this organization');
    }
    return this.reportsService.generateDailyReport(
      organizationId,
      req.user.id, // ✅ Shto userId
      new Date(date),
    );
  }

  // ==================== CUSTOM REPORTS ====================

  @Post('custom')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Generate custom report' })
  @ApiResponse({ status: 200, description: 'Custom report generated successfully' })
  async generateCustomReport(@Body() body: any, @Request() req) {
    return this.reportsService.generateCustomReport(
      req.user.organizationId,
      req.user.id, // ✅ Shto userId
      body.startDate,
      body.endDate,
      body.type,
    );
  }

  @Get('shipments/export')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export shipments as CSV' })
  @ApiResponse({ status: 200, description: 'Shipments exported successfully' })
  async exportShipments(@Query('format') format: string, @Request() req) {
    return this.reportsService.exportShipments(
      req.user.organizationId,
      req.user.id, // ✅ Shto userId
      format || 'csv',
    );
  }
}