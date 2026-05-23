import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { WaybillsService } from './waybills.service';
import { CreateWaybillDto } from './dto/create-waybill.dto';
import { UpdateWaybillDto } from './dto/update-waybill.dto';
import { SignWaybillDto } from './dto/sign-waybill.dto';
import { WaybillResponseDto } from './dto/waybill-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Waybills')
@ApiBearerAuth()
@Controller('waybills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WaybillsController {
  constructor(private readonly waybillsService: WaybillsService) {}

  @Post('generate')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Generate a new waybill for a shipment' })
  async generate(@Body() createDto: CreateWaybillDto, @Req() req: any): Promise<WaybillResponseDto> {
    return this.waybillsService.generate(createDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all waybills' })
  async findAll(@Req() req: any): Promise<WaybillResponseDto[]> {
    return this.waybillsService.findAll(req.user.organizationId);
  }

  @Get('shipment/:shipmentId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get waybill by shipment ID' })
  async findByShipment(
    @Param('shipmentId') shipmentId: string,
    @Req() req: any,
  ): Promise<WaybillResponseDto> {
    return this.waybillsService.findByShipment(shipmentId, req.user.organizationId);
  }

  @Get('number/:waybillNumber')
  @ApiOperation({ summary: 'Get waybill by waybill number (public)' })
  async findByWaybillNumber(@Param('waybillNumber') waybillNumber: string): Promise<WaybillResponseDto> {
    return this.waybillsService.findByWaybillNumber(waybillNumber);
  }


  @Get(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get waybill by ID' })
  async findOne(@Param('id') id: string, @Req() req: any): Promise<WaybillResponseDto> {
    return this.waybillsService.findOne(id, req.user.organizationId);
  }

  @Post(':id/sign')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign a waybill' })
  async sign(
    @Param('id') id: string,
    @Body() signWaybillDto: SignWaybillDto,
    @Req() req: any,
  ): Promise<WaybillResponseDto> {
    return this.waybillsService.sign(id, signWaybillDto, req.user.id, req.user.organizationId);
  }

  @Post(':id/print')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark waybill as printed' })
  async markAsPrinted(@Param('id') id: string, @Req() req: any): Promise<WaybillResponseDto> {
    return this.waybillsService.markAsPrinted(id, req.user.organizationId);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update waybill' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWaybillDto,
    @Req() req: any,
  ): Promise<WaybillResponseDto> {
    return this.waybillsService.update(id, updateDto, req.user.organizationId);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete waybill' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.waybillsService.remove(id, req.user.organizationId);
  }
}