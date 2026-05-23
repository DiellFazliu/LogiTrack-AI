// src/modules/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Report } from './reports.entity';
import { Shipment, ShipmentStatus } from '../shipments/shipment.entity';
import { Driver, DriverStatus } from '../drivers/driver.entity';
import { Vehicle, VehicleStatus } from '../vehicles/vehicle.entity';

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
  ) {}

  async generateDailyReport(organizationId: string, date: Date): Promise<Report> {
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
    const inTransit = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length;
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
    });

    return this.reportRepository.save(report);
  }

  async getDashboardStats(organizationId: string) {
    // Fetch all required data
    const [shipments, drivers, vehicles] = await Promise.all([
      this.shipmentRepository.find({ where: { organizationId } }),
      this.driverRepository.find({ where: { organizationId, isActive: true } }),
      this.vehicleRepository.find({ where: { organizationId, isActive: true } }),
    ]);

    // Shipment stats
    const totalShipments = shipments.length;
    const completedShipments = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
    const pendingShipments = shipments.filter(s => s.status === ShipmentStatus.PENDING).length;
    const inTransitShipments = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length;
    const failedShipments = shipments.filter(s => s.status === ShipmentStatus.FAILED).length;
    const cancelledShipments = shipments.filter(s => s.status === ShipmentStatus.CANCELLED).length;

    // Driver stats
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => 
      d.status === DriverStatus.AVAILABLE || d.status === DriverStatus.ON_DUTY
    ).length;

    // Vehicle stats
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length;

    // On‑time delivery rate (only for shipments that have both estimated and actual delivery)
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

    // Average delivery time (in days) for completed shipments
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

    return {
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
  }

  async getReport(id: string): Promise<Report | null> {
    return this.reportRepository.findOne({ where: { id } });
  }

  async getReportsByOrganization(organizationId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { organizationId },
      order: { generatedAt: 'DESC' },
    });
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