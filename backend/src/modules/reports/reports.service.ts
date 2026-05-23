import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
  Between,
} from 'typeorm';

import { Report } from './reports.entity';

import { Shipment } from '../shipments/shipment.entity';

import { Driver } from '../drivers/driver.entity';

@Injectable()
export class ReportsService {

  constructor(

    @InjectRepository(Report)
    private reportRepository:
    Repository<Report>,

    @InjectRepository(Shipment)
    private shipmentRepository:
    Repository<Shipment>,

    @InjectRepository(Driver)
    private driverRepository:
    Repository<Driver>,

  ) {}

  async generateDailyReport(
    organizationId: string,
    date: Date,
  ): Promise<Report> {

    const startOfDay =
    new Date(date);

    startOfDay.setHours(
      0,
      0,
      0,
      0,
    );

    const endOfDay =
    new Date(date);

    endOfDay.setHours(
      23,
      59,
      59,
      999,
    );

    const shipments =
    await this.shipmentRepository.find({

      where: {

        organizationId,

        createdAt:
        Between(
          startOfDay,
          endOfDay,
        ),

      },

    });

    const total =
    shipments.length;

    const delivered =
    shipments.filter(
      s => s.status === 'delivered'
    ).length;

    const inTransit =
    shipments.filter(
      s => s.status === 'in_transit'
    ).length;

    const pending =
    shipments.filter(
      s => s.status === 'pending'
    ).length;

    const cancelled =
    shipments.filter(
      s => s.status === 'cancelled'
    ).length;

    const failed =
    shipments.filter(
      s => s.status === 'failed'
    ).length;

    const data = {

      date:
      date.toISOString(),

      total,

      delivered,

      inTransit,

      pending,

      cancelled,

      failed,

      deliveryRate:
      total > 0
      ? (delivered / total) * 100
      : 0,

      shipmentsByHour:
      this.groupByHour(
        shipments
      ),

    };

    const report =
    this.reportRepository.create({

      organizationId,

      type:'daily',

      title:
      `Daily Report - ${date.toDateString()}`,

      data,

    });

    return this.reportRepository.save(
      report
    );

  }

  async getDashboardStats(organizationId: string) {
  const [shipments, drivers, vehicles] = await Promise.all([
    this.shipmentRepository.find({ where: { organizationId } }),
    this.driverRepository.find({ where: { organizationId, isActive: true } }),
    this.vehicleRepository.find({ where: { organizationId, isActive: true } }),
  ]);
  // ... calculate stats
  return { totalShipments, completedShipments, ... };
}

  async getReport(
    id:string,
  ): Promise<Report | null> {

    return this.reportRepository.findOne({

      where:{
        id
      }

    });

  }

  async getReportsByOrganization(
    organizationId:string
  ): Promise<Report[]> {

    return this.reportRepository.find({

      where:{
        organizationId
      },

      order:{
        generatedAt:'DESC'
      }

    });

  }

  private groupByHour(
    shipments: Shipment[]
  ) {

    const hours =
    Array(24).fill(0);

    shipments.forEach(s=>{

      const hour =
      new Date(
        s.createdAt
      ).getHours();

      hours[hour]++;

    });

    return hours;

  }

}