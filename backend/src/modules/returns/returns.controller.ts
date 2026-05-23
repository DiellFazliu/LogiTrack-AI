import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Returns')
@ApiBearerAuth()
@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  async create(@Body() createReturnDto: CreateReturnDto, @Request() req) {
    return this.returnsService.create(createReturnDto, req.user.id, req.user.organizationId);
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.DISPATCHER)
  async findAll(@Query() query: any, @Request() req) {
    return this.returnsService.findAll(req.user.organizationId, {
      status: query.status,
      fromDate: query.fromDate,
      toDate: query.toDate,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
    });
  }

  @Get('statistics')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getStatistics(@Request() req) {
    return this.returnsService.getStatistics(req.user.organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.returnsService.findById(id, req.user.organizationId);
  }

  @Patch(':id/status')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.DISPATCHER)
  async updateStatus(@Param('id') id: string, @Body() updateReturnDto: UpdateReturnDto, @Request() req) {
    return this.returnsService.updateStatus(id, req.user.organizationId, updateReturnDto, req.user.id);
  }

  @Patch(':id/complete-pickup')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
  async completePickup(@Param('id') id: string, @Request() req) {
    return this.returnsService.completePickup(id, req.user.organizationId);
  }

  @Patch(':id/complete-delivery')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
  async completeDelivery(@Param('id') id: string, @Request() req) {
    return this.returnsService.completeDelivery(id, req.user.organizationId);
  }

  @Post(':id/refund')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async processRefund(
    @Param('id') id: string,
    @Body('refundAmount') refundAmount: number,
    @Body('transactionId') transactionId: string,
    @Request() req,
  ) {
    return this.returnsService.processRefund(id, req.user.organizationId, refundAmount, transactionId);
  }

  @Post(':id/reject')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async reject(@Param('id') id: string, @Body('rejectionReason') rejectionReason: string, @Request() req) {
    return this.returnsService.reject(id, req.user.organizationId, rejectionReason);
  }

  @Delete(':id/cancel')
  async cancel(@Param('id') id: string, @Request() req) {
    return this.returnsService.cancel(id, req.user.organizationId);
  }
}