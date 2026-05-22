import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FilterTrackingDto } from './dto/filter-tracking.dto';
import {
  TrackingResponseDto,
  LocationHistoryResponseDto,
} from './dto/tracking-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER, UserRole.DISPATCHER, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update shipment location (driver only)' })
  async updateLocation(@Body() updateDto: UpdateLocationDto, @Req() req: any) {
    const driverId = req.user.id;
    const organizationId = req.user.organizationId;
    return this.trackingService.updateLocation(updateDto, driverId, organizationId);
  }

  @Get('public/:trackingNumber')
  @Public()
  @ApiOperation({ summary: 'Public tracking by tracking number' })
  async getPublicTracking(@Param('trackingNumber') trackingNumber: string): Promise<TrackingResponseDto> {
    return this.trackingService.getPublicTracking(trackingNumber);
  }

  @Get('shipment/:shipmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER, UserRole.DISPATCHER, UserRole.COMPANY_ADMIN, UserRole.CUSTOMER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tracking for a specific shipment' })
  async getTrackingByShipment(@Param('shipmentId') shipmentId: string, @Req() req: any): Promise<TrackingResponseDto> {
    const organizationId = req.user.organizationId;
    return this.trackingService.getTrackingByShipment(shipmentId, organizationId);
  }

  @Get('history/:shipmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DISPATCHER, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get location history for a shipment' })
  async getLocationHistory(
    @Param('shipmentId') shipmentId: string,
    @Query() filters: FilterTrackingDto,
    @Req() req: any,
  ) {
    const organizationId = req.user.organizationId;
    return this.trackingService.getLocationHistory(shipmentId, filters, organizationId);
  }

  @Get('last/:shipmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER, UserRole.DISPATCHER, UserRole.COMPANY_ADMIN, UserRole.CUSTOMER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get last known location for a shipment' })
  async getLastLocation(@Param('shipmentId') shipmentId: string, @Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.trackingService.getLastLocation(shipmentId, organizationId);
  }

  @Get('active/locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DISPATCHER, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get locations of all active shipments' })
  async getActiveShipmentsLocations(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.trackingService.getActiveShipmentsLocations(organizationId);
  }

  @Get('route/:shipmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DISPATCHER, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full route of a shipment' })
  async getShipmentRoute(@Param('shipmentId') shipmentId: string, @Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.trackingService.getShipmentRoute(shipmentId, organizationId);
  }

  @Get('stats/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tracking statistics for dashboard' })
  async getTrackingStats(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.trackingService.getTrackingStats(organizationId);
  }
}