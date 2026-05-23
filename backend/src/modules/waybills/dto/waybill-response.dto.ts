import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShipmentInfoDto {
  @ApiProperty()
  trackingNumber!: string;

  @ApiProperty()
  pickupAddress!: string;

  @ApiProperty()
  deliveryAddress!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  driverName?: string;

  @ApiPropertyOptional()
  vehiclePlate?: string;
}

export class WaybillResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  shipmentId!: string;

  @ApiProperty({ type: ShipmentInfoDto })
  shipment!: ShipmentInfoDto;

  @ApiProperty()
  waybillNumber!: string;

  @ApiPropertyOptional()
  pdfUrl!: string | null;

  @ApiPropertyOptional()
  qrCode!: string | null;

  @ApiPropertyOptional()
  signature!: string | null;

  @ApiPropertyOptional()
  signedAt!: Date | null;

  @ApiPropertyOptional()
  signedBy!: string | null;

  @ApiPropertyOptional()
  generatedBy!: string | null;

  @ApiProperty()
  isSigned!: boolean;

  @ApiProperty()
  isPrinted!: boolean;

  @ApiPropertyOptional()
  printedAt!: Date | null;

  @ApiPropertyOptional()
  notes!: string | null;

  @ApiProperty()
  createdAt!: Date;
}