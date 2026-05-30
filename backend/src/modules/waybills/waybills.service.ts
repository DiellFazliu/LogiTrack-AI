// backend/src/modules/waybills/waybills.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Waybill } from './waybill.entity';
import { CreateWaybillDto } from './dto/create-waybill.dto';
import { UpdateWaybillDto } from './dto/update-waybill.dto';
import { SignWaybillDto } from './dto/sign-waybill.dto';
import { WaybillResponseDto, ShipmentInfoDto } from './dto/waybill-response.dto';
import { Shipment, ShipmentStatus } from '../shipments/shipment.entity';
import * as QRCode from 'qrcode';

@Injectable()
export class WaybillsService {
  constructor(
    @InjectRepository(Waybill)
    private waybillRepository: Repository<Waybill>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
  ) {}

  private toResponseDto(waybill: Waybill): WaybillResponseDto {
    let driverName: string | undefined;
    if (waybill.shipment?.driver) {
      driverName = waybill.shipment.driver.user?.name || waybill.shipment.driver.licenseNumber;
    }

    const shipmentInfo: ShipmentInfoDto = {
      trackingNumber: waybill.shipment?.trackingNumber,
      pickupAddress: waybill.shipment?.pickupAddress,
      deliveryAddress: waybill.shipment?.deliveryAddress,
      status: waybill.shipment?.status,
      driverName: driverName,
      vehiclePlate: waybill.shipment?.vehicle?.licensePlate,
    };

    return {
      id: waybill.id,
      shipmentId: waybill.shipmentId,
      shipment: shipmentInfo,
      waybillNumber: waybill.waybillNumber,
      pdfUrl: waybill.pdfUrl,
      qrCode: waybill.qrCode,
      signature: waybill.signature,
      signedAt: waybill.signedAt,
      generatedBy: waybill.generatedBy,
      createdAt: waybill.createdAt,
      isSigned: !!waybill.signature,
    };
  }

  private generateWaybillNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `WB-${year}${month}${day}-${random}`;
  }

  private async generateQrCode(waybillNumber: string, trackingNumber: string): Promise<string> {
    const trackingUrl = `https://logitrack.ai/track/${trackingNumber}`;
    const qrData = JSON.stringify({
      waybillNumber,
      trackingNumber,
      trackingUrl,
      generatedAt: new Date().toISOString(),
    });
    return QRCode.toDataURL(qrData);
  }

  async generate(createDto: CreateWaybillDto, userId: string): Promise<WaybillResponseDto> {
    const { shipmentId, generatePdf = true } = createDto;

    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId },
      relations: ['driver', 'driver.user', 'vehicle', 'organization'],
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    const existingWaybill = await this.waybillRepository.findOne({
      where: { shipmentId },
    });
    if (existingWaybill) {
      return this.toResponseDto(existingWaybill);
    }

    const waybillNumber = this.generateWaybillNumber();
    const qrCode = await this.generateQrCode(waybillNumber, shipment.trackingNumber);

    const waybill = this.waybillRepository.create({
      shipmentId,
      waybillNumber,
      qrCode,
      generatedBy: userId,
    });

    if (generatePdf) {
      waybill.pdfUrl = `/waybills/${waybillNumber}.pdf`;
    }

    const savedWaybill = await this.waybillRepository.save(waybill);
    return this.toResponseDto(savedWaybill);
  }

  async findAll(organizationId: string): Promise<WaybillResponseDto[]> {
    const waybills = await this.waybillRepository.find({
      where: {
        shipment: {
          organizationId,
        },
      },
      relations: ['shipment', 'shipment.driver', 'shipment.driver.user', 'shipment.vehicle'],
      order: { createdAt: 'DESC' },
    });
    return waybills.map(w => this.toResponseDto(w));
  }

  // ✅ MODIFIKUAR - Kthen null në vend të error 404
  async findByShipment(shipmentId: string, organizationId: string | null): Promise<WaybillResponseDto | null> {
    console.log('findByShipment called with:', { shipmentId, organizationId });
    
    const waybill = await this.waybillRepository.findOne({
      where: {
        shipmentId: shipmentId,
      },
      relations: ['shipment', 'shipment.driver', 'shipment.driver.user', 'shipment.vehicle'],
    });
    
    console.log('Found waybill:', waybill);
    
    if (!waybill) {
      console.log('No waybill found for shipment:', shipmentId);
      return null;
    }
    
    // Kontrollo që shipment i përket organizatës së duhur (vetëm nëse organizationId është dhënë)
    if (organizationId && waybill.shipment.organizationId !== organizationId) {
      console.log('Organization mismatch');
      return null;
    }
    
    return this.toResponseDto(waybill);
  }

  async markAsPrinted(id: string, organizationId: string): Promise<WaybillResponseDto> {
    const waybill = await this.waybillRepository.findOne({
      where: {
        id,
        shipment: { organizationId },
      },
    });
    if (!waybill) {
      throw new NotFoundException(`Waybill with ID ${id} not found`);
    }
    return this.toResponseDto(waybill);
  }

  async findOne(id: string, organizationId: string): Promise<WaybillResponseDto> {
    const waybill = await this.waybillRepository.findOne({
      where: {
        id,
        shipment: { organizationId },
      },
      relations: ['shipment', 'shipment.driver', 'shipment.driver.user', 'shipment.vehicle'],
    });
    if (!waybill) {
      throw new NotFoundException(`Waybill with ID ${id} not found`);
    }
    return this.toResponseDto(waybill);
  }

  async findByWaybillNumber(waybillNumber: string): Promise<WaybillResponseDto> {
    const waybill = await this.waybillRepository.findOne({
      where: { waybillNumber },
      relations: ['shipment', 'shipment.driver', 'shipment.driver.user', 'shipment.vehicle'],
    });
    if (!waybill) {
      throw new NotFoundException(`Waybill with number ${waybillNumber} not found`);
    }
    return this.toResponseDto(waybill);
  }

  async sign(
    id: string,
    signWaybillDto: SignWaybillDto,
    userId: string,
    organizationId: string,
  ): Promise<WaybillResponseDto> {
    const waybill = await this.waybillRepository.findOne({
      where: {
        id,
        shipment: { organizationId },
      },
      relations: ['shipment'],
    });
    if (!waybill) {
      throw new NotFoundException(`Waybill with ID ${id} not found`);
    }

    if (waybill.signature) {
      throw new BadRequestException('Waybill is already signed');
    }

    waybill.signature = signWaybillDto.signature;
    waybill.signedAt = new Date();

    if (waybill.shipment && waybill.shipment.status === ShipmentStatus.PENDING) {
      waybill.shipment.status = ShipmentStatus.PICKED_UP;
      waybill.shipment.pickedUpAt = new Date();
      await this.shipmentRepository.save(waybill.shipment);
    }

    const savedWaybill = await this.waybillRepository.save(waybill);
    return this.toResponseDto(savedWaybill);
  }

  async update(
    id: string,
    updateDto: UpdateWaybillDto,
    organizationId: string,
  ): Promise<WaybillResponseDto> {
    const waybill = await this.waybillRepository.findOne({
      where: {
        id,
        shipment: { organizationId },
      },
    });
    if (!waybill) {
      throw new NotFoundException(`Waybill with ID ${id} not found`);
    }

    if (updateDto.pdfUrl !== undefined) waybill.pdfUrl = updateDto.pdfUrl;
    if (updateDto.qrCode !== undefined) waybill.qrCode = updateDto.qrCode;
    if (updateDto.signature !== undefined) waybill.signature = updateDto.signature;
    
    const savedWaybill = await this.waybillRepository.save(waybill);
    return this.toResponseDto(savedWaybill);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const waybill = await this.waybillRepository.findOne({
      where: {
        id,
        shipment: { organizationId },
      },
    });
    if (!waybill) {
      throw new NotFoundException(`Waybill with ID ${id} not found`);
    }
    await this.waybillRepository.remove(waybill);
  }
}