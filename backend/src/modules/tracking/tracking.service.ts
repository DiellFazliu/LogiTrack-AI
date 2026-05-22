import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, In } from 'typeorm';
import { TrackingHistory } from './tracking-history.entity';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FilterTrackingDto } from './dto/filter-tracking.dto';
import {
  TrackingResponseDto,
  TrackingLocationDto,
  ShipmentTrackingInfoDto,
} from './dto/tracking-response.dto';
import { Shipment, ShipmentStatus } from '../shipments/shipment.entity';
import { Driver } from '../drivers/driver.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Organization } from '../organizations/organization.entity';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(TrackingHistory)
    private trackingRepository: Repository<TrackingHistory>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  private toLocationDto(history: TrackingHistory): TrackingLocationDto {
    return {
      latitude: history.latitude,
      longitude: history.longitude,
      address: history.address,
      speed: history.speed,
      heading: history.heading,
      trackedAt: history.trackedAt,
    };
  }

  async updateLocation(
    updateDto: UpdateLocationDto,
    driverId: string,
    organizationId: string,
  ): Promise<TrackingLocationDto> {
    const { shipmentId, latitude, longitude, ...rest } = updateDto;

    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId, organizationId },
      relations: ['driver'],
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    if (shipment.driverId !== driverId) {
      throw new ForbiddenException('You are not assigned to this shipment');
    }

    const tracking = this.trackingRepository.create({
      shipmentId,
      latitude,
      longitude,
      ...rest,
    });

    const savedTracking = await this.trackingRepository.save(tracking);

    if (shipment.status === ShipmentStatus.PENDING) {
      shipment.status = ShipmentStatus.IN_TRANSIT;
      await this.shipmentRepository.save(shipment);
    }

    return this.toLocationDto(savedTracking);
  }

  async getPublicTracking(trackingNumber: string): Promise<TrackingResponseDto> {
    const shipment = await this.shipmentRepository.findOne({
      where: { trackingNumber },
      relations: ['driver', 'driver.user', 'vehicle', 'organization'],
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment with tracking number ${trackingNumber} not found`);
    }

    const currentLocation = await this.trackingRepository.findOne({
      where: { shipmentId: shipment.id },
      order: { trackedAt: 'DESC' },
    });

    const history = await this.trackingRepository.find({
      where: { shipmentId: shipment.id },
      order: { trackedAt: 'DESC' },
      take: 50,
    });

    const shipmentInfo: ShipmentTrackingInfoDto = {
      id: shipment.id,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      pickupAddress: shipment.pickupAddress,
      deliveryAddress: shipment.deliveryAddress,
      estimatedDelivery: shipment.estimatedDelivery,
      driverName: shipment.driver?.user?.name,
      driverPhone: shipment.driver?.phone,
      vehiclePlate: shipment.vehicle?.licensePlate,
    };

    return {
      shipment: shipmentInfo,
      currentLocation: currentLocation ? this.toLocationDto(currentLocation) : null,
      history: history.map(h => this.toLocationDto(h)),
      estimatedArrival: shipment.estimatedDelivery,
      lastUpdate: currentLocation?.trackedAt,
    };
  }

  async getTrackingByShipment(
    shipmentId: string,
    organizationId: string,
  ): Promise<TrackingResponseDto> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId, organizationId },
      relations: ['driver', 'driver.user', 'vehicle'],
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    const currentLocation = await this.trackingRepository.findOne({
      where: { shipmentId: shipment.id },
      order: { trackedAt: 'DESC' },
    });

    const history = await this.trackingRepository.find({
      where: { shipmentId: shipment.id },
      order: { trackedAt: 'DESC' },
      take: 100,
    });

    const shipmentInfo: ShipmentTrackingInfoDto = {
      id: shipment.id,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      pickupAddress: shipment.pickupAddress,
      deliveryAddress: shipment.deliveryAddress,
      estimatedDelivery: shipment.estimatedDelivery,
      driverName: shipment.driver?.user?.name,
      driverPhone: shipment.driver?.phone,
      vehiclePlate: shipment.vehicle?.licensePlate,
    };

    return {
      shipment: shipmentInfo,
      currentLocation: currentLocation ? this.toLocationDto(currentLocation) : null,
      history: history.map(h => this.toLocationDto(h)),
      estimatedArrival: shipment.estimatedDelivery,
      lastUpdate: currentLocation?.trackedAt,
    };
  }

  async getLocationHistory(
    shipmentId: string,
    filters: FilterTrackingDto,
    organizationId: string,
  ): Promise<any> {
    const { fromDate, toDate, page = 1, limit = 50 } = filters;

    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId, organizationId },
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    const where: FindOptionsWhere<TrackingHistory> = { shipmentId };

    if (fromDate && toDate) {
      where.trackedAt = Between(new Date(fromDate), new Date(toDate));
    }

    const [data, total] = await this.trackingRepository.findAndCount({
      where,
      order: { trackedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: data.map(h => this.toLocationDto(h)),
      total,
      page,
      limit,
    };
  }

  async getLastLocation(shipmentId: string, organizationId: string): Promise<TrackingLocationDto | null> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId, organizationId },
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    const lastLocation = await this.trackingRepository.findOne({
      where: { shipmentId },
      order: { trackedAt: 'DESC' },
    });

    return lastLocation ? this.toLocationDto(lastLocation) : null;
  }

  async getActiveShipmentsLocations(organizationId: string): Promise<any[]> {
    const activeShipments = await this.shipmentRepository.find({
      where: {
        organizationId,
        status: In([ShipmentStatus.IN_TRANSIT, ShipmentStatus.PICKED_UP]),
      },
      relations: ['driver', 'driver.user', 'vehicle'],
    });

const results: {
  shipmentId: string;
  trackingNumber: string;
  status: ShipmentStatus;
  driverName: string | undefined;
  vehiclePlate: string | undefined;
  lastLocation: TrackingLocationDto | null;
  lastUpdate: Date | undefined;
}[] = [];

    for (const shipment of activeShipments) {
      const lastLocation = await this.trackingRepository.findOne({
        where: { shipmentId: shipment.id },
        order: { trackedAt: 'DESC' },
      });

      results.push({
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        driverName: shipment.driver?.user?.name,
        vehiclePlate: shipment.vehicle?.licensePlate,
        lastLocation: lastLocation ? this.toLocationDto(lastLocation) : null,
        lastUpdate: lastLocation?.trackedAt,
      });
    }

    return results;
  }

  async getShipmentRoute(shipmentId: string, organizationId: string): Promise<any> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId, organizationId },
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    const history = await this.trackingRepository.find({
      where: { shipmentId },
      order: { trackedAt: 'ASC' },
    });

    const waypoints = history.map(h => ({
      latitude: h.latitude,
      longitude: h.longitude,
      address: h.address,
      timestamp: h.trackedAt,
    }));

    const startPoint = shipment.pickupLatitude && shipment.pickupLongitude
      ? { latitude: shipment.pickupLatitude, longitude: shipment.pickupLongitude, address: shipment.pickupAddress }
      : null;

    const endPoint = shipment.deliveryLatitude && shipment.deliveryLongitude
      ? { latitude: shipment.deliveryLatitude, longitude: shipment.deliveryLongitude, address: shipment.deliveryAddress }
      : null;

    return {
      shipmentId,
      trackingNumber: shipment.trackingNumber,
      startPoint,
      endPoint,
      waypoints,
      totalPoints: history.length,
    };
  }

  async getTrackingStats(organizationId: string): Promise<any> {
    const shipments = await this.shipmentRepository.find({
      where: { organizationId },
      relations: ['driver'],
    });

    const activeShipments = shipments.filter(
      s => s.status === ShipmentStatus.IN_TRANSIT || s.status === ShipmentStatus.PICKED_UP,
    );

    let totalDistance = 0;
    let totalDuration = 0;

    for (const shipment of activeShipments) {
      const history = await this.trackingRepository.find({
        where: { shipmentId: shipment.id },
        order: { trackedAt: 'ASC' },
      });

      if (history.length > 1) {
        // Calculate approximate distance (simplified)
        totalDistance += history.length * 0.1;
        const firstTime = history[0].trackedAt.getTime();
        const lastTime = history[history.length - 1].trackedAt.getTime();
        totalDuration += (lastTime - firstTime) / (1000 * 60);
      }
    }

    return {
      activeShipmentsCount: activeShipments.length,
      totalTrackingPoints: await this.trackingRepository.count(),
      averageDistance: totalDistance / (activeShipments.length || 1),
      averageDuration: totalDuration / (activeShipments.length || 1),
    };
  }
}