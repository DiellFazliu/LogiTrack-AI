// src/modules/reports/reports.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Report } from './reports.entity';
import { Shipment, ShipmentStatus } from '../shipments/shipment.entity';
import { Driver, DriverStatus } from '../drivers/driver.entity';
import { Vehicle, VehicleStatus } from '../vehicles/vehicle.entity';
import * as json2csv from 'json2csv';
import { Review } from '../reviews/review.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,

    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,

    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,

    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,

    @InjectRepository(Review) 
    private reviewRepository: Repository<Review>,

    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  // ==================== CRUD OPERATIONS ====================

  async createReport(type: string, title: string, data: any, organizationId: string, userId: string): Promise<Report> {
    const report = this.reportRepository.create({
      organizationId,
      type,
      title: title || `${type.toUpperCase()} Report - ${new Date().toLocaleDateString()}`,
      data,
      generatedBy: userId,
    });
    
    const savedReport = await this.reportRepository.save(report);
    
    // ✅ Audit log for report creation
    await this.auditService.log({
      organizationId,
      userId,
      action: 'CREATE_REPORT',
      entityType: 'report',
      entityId: savedReport.id,
      newValues: {
        type: savedReport.type,
        title: savedReport.title,
      },
    });
    
    return savedReport;
  }

  async getReport(id: string, organizationId: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id, organizationId },
      relations: ['user'],
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async getReportsByOrganization(organizationId: string, userId: string): Promise<Report[]> {
    const reports = await this.reportRepository.find({
      where: { organizationId },
      relations: ['user'],
      order: { generatedAt: 'DESC' },
    });
    
    // ✅ Audit log for viewing reports list
    await this.auditService.log({
      organizationId,
      userId,
      action: 'VIEW_REPORTS_LIST',
      entityType: 'report',
      newValues: { count: reports.length },
    });
    
    return reports;
  }

  async updateReport(id: string, organizationId: string, userId: string, title?: string, data?: any, fileUrl?: string): Promise<Report> {
    const oldReport = await this.getReport(id, organizationId);
    
    const changes: any = {};
    if (title !== undefined && title !== oldReport.title) changes.title = { old: oldReport.title, new: title };
    if (data !== undefined) changes.data = { old: oldReport.data, new: data };
    if (fileUrl !== undefined && fileUrl !== oldReport.fileUrl) changes.fileUrl = { old: oldReport.fileUrl, new: fileUrl };
    
    if (title !== undefined) oldReport.title = title;
    if (data !== undefined) oldReport.data = data;
    if (fileUrl !== undefined) oldReport.fileUrl = fileUrl;
    
    const updatedReport = await this.reportRepository.save(oldReport);
    
    // ✅ Audit log for report update
    if (Object.keys(changes).length > 0) {
      await this.auditService.log({
        organizationId,
        userId,
        action: 'UPDATE_REPORT',
        entityType: 'report',
        entityId: id,
        oldValues: changes,
        newValues: { title: updatedReport.title },
      });
    }
    
    return updatedReport;
  }

  async deleteReport(id: string, organizationId: string, userId: string): Promise<void> {
    const report = await this.getReport(id, organizationId);
    
    // ✅ Audit log before deletion
    await this.auditService.log({
      organizationId,
      userId,
      action: 'DELETE_REPORT',
      entityType: 'report',
      entityId: id,
      oldValues: {
        type: report.type,
        title: report.title,
      },
    });
    
    await this.reportRepository.remove(report);
  }

  // ==================== DASHBOARD STATS ====================

  async getDashboardStats(organizationId: string, userId: string) {
    const [shipments, drivers, vehicles] = await Promise.all([
      this.shipmentRepository.find({ where: { organizationId } }),
      this.driverRepository.find({ where: { organizationId, isActive: true } }),
      this.vehicleRepository.find({ where: { organizationId, isActive: true } }),
    ]);

    const totalShipments = shipments.length;
    const completedShipments = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
    const pendingShipments = shipments.filter(s => s.status === ShipmentStatus.PENDING).length;
    const inTransitShipments = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT || s.status === ShipmentStatus.PICKED_UP).length;
    const failedShipments = shipments.filter(s => s.status === ShipmentStatus.FAILED).length;
    const cancelledShipments = shipments.filter(s => s.status === ShipmentStatus.CANCELLED).length;

    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => 
      d.status === DriverStatus.AVAILABLE || d.status === DriverStatus.ON_DUTY
    ).length;

    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length;

    const deliveredShipments = shipments.filter(s => 
      s.status === ShipmentStatus.DELIVERED && 
      s.estimatedDelivery && 
      s.actualDelivery
    );
    const onTimeDeliveries = deliveredShipments.filter(s => {
      const actual = new Date(s.actualDelivery!);
      const estimated = new Date(s.estimatedDelivery!);
      return actual <= estimated;
    }).length;
    const onTimeDelivery = deliveredShipments.length > 0
      ? Math.round((onTimeDeliveries / deliveredShipments.length) * 100)
      : 0;

    let avgDeliveryTime = 0;
    const completedWithDates = shipments.filter(s => 
      s.status === ShipmentStatus.DELIVERED && 
      s.createdAt && 
      s.actualDelivery
    );
    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, s) => {
        const created = new Date(s.createdAt);
        const delivered = new Date(s.actualDelivery!);
        const days = (delivered.getTime() - created.getTime()) / (1000 * 3600 * 24);
        return sum + days;
      }, 0);
      avgDeliveryTime = parseFloat((totalDays / completedWithDates.length).toFixed(1));
    }

    const stats = {
      totalShipments,
      completedShipments,
      pendingShipments,
      inTransitShipments,
      failedShipments,
      cancelledShipments,
      totalDrivers,
      activeDrivers,
      totalVehicles,
      availableVehicles,
      avgDeliveryTime,
      onTimeDelivery,
    };
    
    // ✅ Audit log for dashboard view
    await this.auditService.log({
      organizationId,
      userId,
      action: 'VIEW_DASHBOARD',
      entityType: 'dashboard',
      newValues: { stats },
    });
    
    return stats;
  }

  // ==================== DAILY REPORTS ====================

  async generateDailyReport(organizationId: string, userId: string, date: Date): Promise<Report> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const shipments = await this.shipmentRepository.find({
      where: {
        organizationId,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
    const inTransit = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT || s.status === ShipmentStatus.PICKED_UP).length;
    const pending = shipments.filter(s => s.status === ShipmentStatus.PENDING).length;
    const cancelled = shipments.filter(s => s.status === ShipmentStatus.CANCELLED).length;
    const failed = shipments.filter(s => s.status === ShipmentStatus.FAILED).length;

    const data = {
      date: date.toISOString(),
      total,
      delivered,
      inTransit,
      pending,
      cancelled,
      failed,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      shipmentsByHour: this.groupByHour(shipments),
    };

    const report = this.reportRepository.create({
      organizationId,
      type: 'daily',
      title: `Daily Report - ${date.toDateString()}`,
      data,
      generatedBy: userId,
    });

    const savedReport = await this.reportRepository.save(report);
    
    // ✅ Audit log for daily report generation
    await this.auditService.log({
      organizationId,
      userId,
      action: 'GENERATE_DAILY_REPORT',
      entityType: 'report',
      entityId: savedReport.id,
      newValues: {
        type: 'daily',
        date: date.toISOString(),
        totalShipments: total,
        delivered,
      },
    });
    
    // ✅ Dërgo notifikatë për admin-at e kompanisë
    await this.notificationsService.createForRole(
      'company_admin',
      'Daily Report Generated',
      `Daily report for ${date.toDateString()} has been generated. Total shipments: ${total}`,
      { reportId: savedReport.id, type: 'daily' }
    );

    return savedReport;
  }

  // ==================== CUSTOM REPORTS ====================

  async generateCustomReport(organizationId: string, userId: string, startDate: string, endDate: string, type: string): Promise<Report> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let data: any = {};

    if (type === 'shipment' || type === 'all') {
      const shipments = await this.shipmentRepository.find({
        where: {
          organizationId,
          createdAt: Between(start, end),
        },
        relations: ['driver', 'vehicle', 'customer'],
      });
      data.shipments = shipments;
      data.shipmentStats = {
        total: shipments.length,
        delivered: shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length,
        pending: shipments.filter(s => s.status === ShipmentStatus.PENDING).length,
        inTransit: shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT || s.status === ShipmentStatus.PICKED_UP).length,
      };
    }

    if (type === 'driver' || type === 'all') {
      const drivers = await this.driverRepository.find({
        where: { organizationId, isActive: true },
        relations: ['user'],
      });
      
      const driversWithRating = await Promise.all(drivers.map(async (driver) => {
        const deliveriesCount = await this.shipmentRepository.count({
          where: { 
            driverId: driver.id,
            status: ShipmentStatus.DELIVERED,
          },
        });
        
        const reviews = await this.reviewRepository.find({
          where: { driverId: driver.id },
        });
        
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0;
        
        return {
          id: driver.id,
          name: driver.user?.name || 'Unknown',
          licenseNumber: driver.licenseNumber,
          phone: driver.phone,
          status: driver.status,
          totalDeliveries: deliveriesCount,
          averageRating: avgRating,
          reviewsCount: reviews.length,
        };
      }));
      
      data.drivers = driversWithRating;
      data.driverStats = {
        total: drivers.length,
        active: drivers.filter(d => d.status === DriverStatus.AVAILABLE || d.status === DriverStatus.ON_DUTY).length,
        averageRating: driversWithRating.reduce((sum, d) => sum + d.averageRating, 0) / (driversWithRating.length || 1),
        totalDeliveries: driversWithRating.reduce((sum, d) => sum + d.totalDeliveries, 0),
      };
    }

    if (type === 'financial' || type === 'all') {
      const shipments = await this.shipmentRepository.find({
        where: {
          organizationId,
          createdAt: Between(start, end),
        },
      });
      
      const deliveredShipments = shipments.filter(s => s.status === ShipmentStatus.DELIVERED);
      const totalRevenue = deliveredShipments.length * 50;
      
      const completedShipments = deliveredShipments.length;
      const onTimeDeliveries = shipments.filter(s => {
        if (s.status !== ShipmentStatus.DELIVERED || !s.estimatedDelivery || !s.actualDelivery) return false;
        return new Date(s.actualDelivery) <= new Date(s.estimatedDelivery);
      }).length;
      
      data.totalRevenue = totalRevenue;
      data.totalShipments = shipments.length;
      data.completedShipments = completedShipments;
      data.onTimeDelivery = shipments.length > 0 ? Math.round((onTimeDeliveries / shipments.length) * 100) : 0;
      data.avgDeliveryTime = 2.5;
    }

    const report = this.reportRepository.create({
      organizationId,
      type,
      title: `${type.toUpperCase()} Report - ${new Date().toLocaleDateString()}`,
      data,
      generatedBy: userId,
    });

    const savedReport = await this.reportRepository.save(report);
    
    // ✅ Audit log for custom report generation
    await this.auditService.log({
      organizationId,
      userId,
      action: 'GENERATE_CUSTOM_REPORT',
      entityType: 'report',
      entityId: savedReport.id,
      newValues: {
        type,
        startDate,
        endDate,
        reportData: {
          shipments: data.shipmentStats,
          drivers: data.driverStats,
          financial: data.totalRevenue ? { totalRevenue: data.totalRevenue } : null,
        },
      },
    });

    // ✅ Dërgo notifikatë për admin-at e kompanisë
    await this.notificationsService.createForRole(
      'company_admin',
      `New ${type.toUpperCase()} Report Generated`,
      `A new ${type} report has been generated for period ${startDate} to ${endDate}. Click to view.`,
      { reportId: savedReport.id, type, startDate, endDate }
    );

    return savedReport;
  }

  // ==================== EXPORT ====================

  async exportShipments(organizationId: string, userId: string, format: string): Promise<any> {
    const shipments = await this.shipmentRepository.find({
      where: { organizationId },
      relations: ['driver', 'vehicle', 'customer'],
    });

    // ✅ Audit log for export
    await this.auditService.log({
      organizationId,
      userId,
      action: 'EXPORT_SHIPMENTS',
      entityType: 'shipment',
      newValues: {
        format,
        count: shipments.length,
      },
    });

    if (format === 'csv') {
      const fields = ['id', 'trackingNumber', 'status', 'pickupAddress', 'deliveryAddress', 'createdAt', 'actualDelivery'];
      const parser = new json2csv.Parser({ fields });
      const csv = parser.parse(shipments);
      return { csv, filename: `shipments_${new Date().toISOString()}.csv` };
    }

    return shipments;
  }

  private groupByHour(shipments: Shipment[]): number[] {
    const hours = Array(24).fill(0);
    shipments.forEach(s => {
      if (s.createdAt) {
        const hour = new Date(s.createdAt).getHours();
        hours[hour]++;
      }
    });
    return hours;
  }
}