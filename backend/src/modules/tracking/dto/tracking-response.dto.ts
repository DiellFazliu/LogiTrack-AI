import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackingLocationDto {
  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  speed?: number;

  @ApiPropertyOptional()
  heading?: number;

  @ApiPropertyOptional()
  trackedAt!: Date;
}

export class ShipmentTrackingInfoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  trackingNumber!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  pickupAddress?: string;

  @ApiPropertyOptional()
  deliveryAddress?: string;

  @ApiPropertyOptional()
  estimatedDelivery?: Date;

  @ApiPropertyOptional()
  driverName?: string;

  @ApiPropertyOptional()
  driverPhone?: string;

  @ApiPropertyOptional()
  vehiclePlate?: string;
}

export class TrackingResponseDto {
  @ApiProperty()
  shipment!: ShipmentTrackingInfoDto;

  @ApiProperty({ type: TrackingLocationDto, nullable: true })
  currentLocation!: TrackingLocationDto | null;

  @ApiProperty({ type: [TrackingLocationDto] })
  history!: TrackingLocationDto[];

  @ApiPropertyOptional()
  estimatedArrival?: Date;

  @ApiPropertyOptional()
  lastUpdate?: Date;
}

export class LocationHistoryResponseDto {
  @ApiProperty()
  shipmentId!: string;

  @ApiProperty()
  trackingNumber!: string;

  @ApiProperty({ type: [TrackingLocationDto] })
  locations!: TrackingLocationDto[];
}