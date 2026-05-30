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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FilterPaymentDto } from './dto/filter-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  async create(@Body() createDto: CreatePaymentDto, @Req() req: any): Promise<PaymentResponseDto> {
    return this.paymentsService.create(createDto, req.user.id, req.user.organizationId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get all payments' })
  async findAll(@Query() filters: FilterPaymentDto, @Req() req: any): Promise<{
    data: PaymentResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.paymentsService.findAll(filters, req.user.organizationId);
  }

  @Get('invoice/:invoiceId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get payments by invoice' })
  async findByInvoice(@Param('invoiceId') invoiceId: string, @Req() req: any): Promise<PaymentResponseDto[]> {
    return this.paymentsService.findByInvoice(invoiceId, req.user.organizationId);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get payment statistics' })
  async getPaymentStats(@Req() req: any): Promise<any> {
    return this.paymentsService.getPaymentStats(req.user.organizationId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get payment by ID' })
  async findOne(@Param('id') id: string, @Req() req: any): Promise<PaymentResponseDto> {
    return this.paymentsService.findOne(id, req.user.organizationId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update payment' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePaymentDto,
    @Req() req: any,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.update(id, updateDto, req.user.organizationId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete payment' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.paymentsService.remove(id, req.user.organizationId);
  }
}